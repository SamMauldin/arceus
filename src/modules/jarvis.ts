import { log as parentLog } from '../log';
import { getConfigItem } from '../global/configuration';
import { client } from '../discord';
import { ChannelType, VoiceChannel } from 'discord.js';
import {
  EndBehaviorType,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { Readable } from 'stream';
import { OpusEncoder } from '@discordjs/opus';
import { randomUUID } from 'crypto';
import { minio } from '../global/minio';
import assert from 'assert';
import { prisma } from '../prisma';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import pathToFfmpeg from 'ffmpeg-static';
import { exec } from 'child_process';
import { EmbedBuilder } from '@discordjs/builders';

const tmpDir = tmpdir();
const log = parentLog.getChildLogger({ name: 'Jarvis' });
const moduleSlug = 'jarvis';
const channelConnected: { [channelId: string]: true | undefined } = {};

const processAudio = async ({
  audio,
  startDate,
  userId,
  channelId,
  guildId,
}: {
  audio: Buffer;
  startDate: Date;
  userId: string;
  channelId: string;
  guildId: string;
}) => {
  const guild = client.guilds.cache.get(guildId);
  assert(guild);
  const channel = guild.channels.cache.get(channelId);
  assert(channel);
  const member = guild.members.cache.get(userId);
  assert(member);

  const snippetId = randomUUID();

  const pcmPath = `${tmpDir}/${snippetId}.pcm`;
  const mp3Path = `${tmpDir}/${snippetId}.mp3`;
  const wavPath = `${tmpDir}/${snippetId}.wav`;

  await writeFile(pcmPath, audio);

  await Promise.all([
    new Promise<void>((resolve, reject) =>
      exec(
        `${pathToFfmpeg} -f s16le -ar 48k -ac 1 -i ${pcmPath} ${mp3Path}`,
        (err, _stdout, _stderr) => (err ? reject() : resolve())
      )
    ),
    new Promise<void>((resolve, reject) =>
      exec(
        `${pathToFfmpeg} -f s16le -ar 48k -ac 1 -i ${pcmPath} -af loudnorm=I=-16:LRA=11:TP=-1.5 -ar 16k ${wavPath}`,
        (err, _stdout, _stderr) => (err ? reject() : resolve())
      )
    ),
  ]);

  const [mp3Buf, wavBuf] = await Promise.all([
    readFile(mp3Path),
    readFile(wavPath),
  ]);

  await Promise.all([unlink(mp3Path), unlink(wavPath), unlink(pcmPath)]);

  await Promise.all([
    minio.putObject(
      process.env.MINIO_BUCKET_LEDGER!,
      `snippets/${snippetId}.mp3`,
      mp3Buf,
      undefined,
      {
        ContentType: 'audio/mp3',
      }
    ),
    minio.putObject(
      process.env.MINIO_BUCKET_LEDGER!,
      `snippets/${snippetId}.wav`,
      wavBuf,
      undefined,
      {
        ContentType: 'audio/wav',
      }
    ),
    minio.putObject(
      process.env.MINIO_BUCKET_LEDGER!,
      `snippets/${snippetId}.pcm`,
      audio,
      undefined,
      { ContentType: 'audio/pcm' }
    ),
  ]);

  await prisma.ledgerVoiceSnippet.create({
    data: {
      snippetId,
      startDate,
      user: {
        connectOrCreate: {
          create: { discordId: member.user.id, tag: member.user.tag },
          where: { discordId: member.user.id },
        },
      },
      channel: {
        connectOrCreate: {
          create: {
            discordId: channel.id,
            name: (channel as VoiceChannel).name,
            type: 'VOICE',
            guild: {
              connectOrCreate: {
                create: {
                  discordId: guild.id,
                  name: guild.name,
                },
                where: { discordId: guild.id },
              },
            },
          },
          where: { discordId: channel.id },
        },
      },
    },
  });
};

const setupChannel = async (channel: VoiceChannel) => {
  const conn = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    selfDeaf: false,
    selfMute: false,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  channelConnected[channel.id] = true;

  const speakingData: {
    [userId: string]: { end: () => void } | undefined;
  } = {};

  const shutdown = () => {
    delete channelConnected[channel.id];
    conn.disconnect();
    if (conn.state.status !== VoiceConnectionStatus.Destroyed) conn.destroy();

    for (const data of Object.values(speakingData)) {
      data?.end();
    }
  };

  conn.on('error', (err) => {
    log.warn('Error on voice connection', err);
    shutdown();
  });

  conn.receiver.speaking.on('start', (userId) => {
    if (speakingData[userId]) return;

    const recvStream = conn.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.Manual },
    }) as unknown as Readable;
    const encoder = new OpusEncoder(48000, 1);

    const chunks: Buffer[] = [];
    const startDate = new Date();

    speakingData[userId] = {
      end: () => {
        if (!recvStream.destroyed) recvStream.destroy();
        delete speakingData[userId];

        const audio = Buffer.concat(chunks);

        processAudio({
          audio,
          startDate,
          userId,
          channelId: channel.id,
          guildId: channel.guildId,
        }).then(
          () => {},
          (err) => log.warn('Failed to process captured audio', err)
        );
      },
    };

    recvStream.on('data', (chunk) => {
      chunks.push(encoder.decode(chunk));
    });

    recvStream.on('close', () => {
      speakingData[userId]?.end();
    });
  });

  conn.receiver.speaking.on('end', (userId) => {
    speakingData[userId]?.end();
  });

  conn.on('stateChange', (oldState, newState) => {
    if (newState.status === VoiceConnectionStatus.Ready) {
    }

    if (
      newState.status === VoiceConnectionStatus.Disconnected &&
      oldState.status === VoiceConnectionStatus.Ready
    ) {
      shutdown();
    }
  });
};

const joinChannels = () => {
  for (const [_, guild] of client.guilds.cache) {
    const channelId = getConfigItem(
      `module.${moduleSlug}.guild.${guild.id}.voice_channel`
    );
    if (!channelId || channelConnected[channelId]) continue;

    const channel = guild.channels.cache.get(channelId);
    if (
      !channel ||
      channel.type !== ChannelType.GuildVoice ||
      !channel.joinable
    )
      continue;

    setupChannel(channel).then(
      () => {},
      (err) => log.warn('Failed to setup Jarvis voice channel', err)
    );
  }
};

const debounceMap: { [guildId: string]: { title: string; body: string }[] } =
  {};

export const displayMessage = async (voiceSnippetId: number) => {
  const snippet = await prisma.ledgerVoiceSnippet.findUnique({
    where: { id: voiceSnippetId },
    include: { user: true, channel: { include: { guild: true } } },
  });

  if (!snippet) return;

  const channelId = getConfigItem(
    `module.${moduleSlug}.guild.${snippet.channel.guild.discordId}.transcription_channel`
  );
  if (!channelId) return;

  const item = {
    title: `${snippet.user.tag} (${snippet.id})`,
    body: (snippet.transcription || '(empty transcription)').toLowerCase(),
  };

  if (item.body === '(empty transcription)') return;

  if (debounceMap[channelId]) {
    if (debounceMap[channelId].length > 20) return;
    debounceMap[channelId].push(item);
    return;
  }

  debounceMap[channelId] = [item];

  setTimeout(() => {
    const items = debounceMap[channelId];
    delete debounceMap[channelId];

    const guild = client.guilds.cache.get(snippet.channel.guild.discordId);
    if (!guild) return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder();

    for (const item of items) {
      embed.addFields({ name: item.title, value: item.body });
    }

    channel.send({ embeds: [embed] });
  }, 1000 * 5);
};

export const setup = () => {
  log.info('Initializing Jarvis');

  setInterval(joinChannels, 1000);
};
