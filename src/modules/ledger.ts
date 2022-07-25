import { prisma } from '../prisma';
import { client } from '../discord';
import {
  ChannelType,
  Message,
  Snowflake,
  TextChannel,
  Attachment,
} from 'discord.js';
import { CommandHandler, registerCommand } from '../global/commandRegistry';
import fetch from 'node-fetch';
import { enabledConfigName, getConfigItem } from '../global/configuration';
import { minio } from '../global/minio';
import { log as originalLog } from '../log';

const moduleSlug = 'ledger';

const log = originalLog.getChildLogger({ name: moduleSlug });

const statsHandler: CommandHandler = async () => {
  const messages = await prisma.ledgerMessage.count();
  const attachments = await prisma.ledgerAttachment.count();
  const guilds = await prisma.ledgerGuild.count();

  return `Tracking ${messages} message(s) and ${attachments} attachments across ${guilds} server(s).`;
};

const backfillHandler: CommandHandler = async ({ message }) => {
  const guild = message.guild!;
  log.debug(`Backfilling ledger data for guild ${guild.name}`);

  let messageCount = 0;
  const startedAt = new Date().getTime() / 1000;
  let spinIx = 0;

  const getStatusContent = () => {
    const spinChars = ['|', '/', '-', '\\'];
    spinIx++;

    const secondsPassed = new Date().getTime() / 1000 - startedAt;
    const perSecond = Math.round(messageCount / secondsPassed);

    return (
      '`[' +
      spinChars[spinIx % 4] +
      ']: ' +
      messageCount +
      ' messages tabulated (' +
      perSecond +
      ' per second)`'
    );
  };

  const statusReply = await message.reply(getStatusContent());
  const statusInterval = setInterval(() => {
    statusReply.edit(getStatusContent()).catch(() => {});
  }, 1000 * 5);

  for (const channel of guild.channels.cache.values()) {
    if (channel.type !== ChannelType.GuildText) continue;
    if (!channel.viewable) continue;
    log.debug(`Fetching messages for channel ${channel.name}`);

    let lastMessageId: Snowflake | undefined;
    while (true) {
      const previousMessages = await channel.messages.fetch({
        before: lastMessageId,
        limit: 100,
      });

      lastMessageId = previousMessages.last()?.id;

      await Promise.all(previousMessages.map((msg) => processMessage(msg)));
      messageCount += previousMessages.size;

      if (previousMessages.size < 25) {
        break;
      }
    }
  }

  clearInterval(statusInterval);
  statusReply.edit(`Backfill completed with ${messageCount} message(s)!`);

  log.debug('Ledger backfill complete');
};

export const setup = () => {
  client.on('message', processMessage);
  client.on('channelPinsUpdate', async (channel) => {
    if (channel.type !== ChannelType.GuildText) return;
    const chan = channel as TextChannel;
    const pins = await chan.messages.fetchPinned(false);
    for (const pin of pins.values()) {
      await processMessage(pin);
    }
  });

  registerCommand({
    name: 'ledger:stats',
    description: 'Ledger Statistics',
    handler: statsHandler,
  });

  registerCommand({
    name: 'ledger:backfill',
    description: 'Backfill Ledger data for current guild',
    guildOnly: true,
    handler: backfillHandler,
  });
};

const attachmentFileKey = (attachment: Attachment) =>
  `${attachment.id}-${encodeURIComponent(attachment.name || 'media.dat')}`;

const processMessage = async (message: Message) => {
  if (!message.guild) return;

  const guildEnabled =
    getConfigItem(
      enabledConfigName({ moduleSlug, guildId: message.guild.id }),
      'false'
    ) === 'true';
  if (!guildEnabled) return;

  const channelEnabled =
    getConfigItem(
      enabledConfigName({ moduleSlug, channelId: message.channel.id }),
      'true'
    ) === 'true';
  if (!channelEnabled) return;

  // Upload attachments
  for (const attachment of message.attachments.values()) {
    const ledgerAttachment = await prisma.ledgerAttachment.findUnique({
      where: { discordId: attachment.id },
    });
    if (ledgerAttachment) continue;

    log.debug(`Uploading attachment ${attachment.name} (${attachment.url})`);
    const res = await fetch(attachment.url);
    const contentType = res.headers.get('Content-Type');
    const buffer = await res.buffer();

    const attemptUpload = async () => {
      await minio.putObject(
        process.env.MINIO_BUCKET_LEDGER!,
        attachmentFileKey(attachment),
        buffer,
        undefined,
        {
          contentType,
        }
      );
    };
    await attemptUpload().catch(() => attemptUpload());
    log.debug('Attachment upload complete');
  }

  const attempt = async () => {
    // Create message
    await prisma.ledgerMessage.upsert({
      where: { discordId: message.id },
      update: {
        pinned: message.pinned ? true : undefined,
      },
      create: {
        discordId: message.id,
        content: message.cleanContent,
        embeds: message.embeds.map((embed) => embed.toJSON()) as any,
        timestamp: new Date(message.createdTimestamp),
        pinned: message.pinned,
        user: {
          connectOrCreate: {
            create: { discordId: message.author.id, tag: message.author.tag },
            where: { discordId: message.author.id },
          },
        },
        channel: {
          connectOrCreate: {
            create: {
              discordId: message.channel.id,
              name: (message.channel as TextChannel).name,
              guild: {
                connectOrCreate: {
                  create: {
                    discordId: message.guild!.id,
                    name: message.guild!.name,
                  },
                  where: { discordId: message.guild!.id },
                },
              },
            },
            where: { discordId: message.channel.id },
          },
        },
        attachments: {
          connectOrCreate: message.attachments.map((attachment) => ({
            create: {
              discordId: attachment.id,
              name: attachment.name!,
            },
            where: { discordId: attachment.id },
          })),
        },
      },
    });
  };

  await attempt().catch(() => attempt());
};
