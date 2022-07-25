import { ChannelType } from 'discord.js';
import { client } from '../discord';
import { enabledConfigName, getConfigItem } from '../global/configuration';
import { prisma } from '../prisma';

const moduleSlug = 'gold-distributor';

export const setup = () => {
  setInterval(() => {
    const eligibleMembers = new Set<string>();

    for (const guild of client.guilds.cache.values()) {
      if (
        !(
          getConfigItem(
            enabledConfigName({ moduleSlug, guildId: guild.id }),
            'true'
          ) === 'true'
        )
      )
        continue;

      for (const channel of guild.channels.cache.values()) {
        if (channel.type !== ChannelType.GuildVoice) continue;

        for (const member of channel.members.values()) {
          if (member.user.bot || member.voice.mute || member.voice.deaf)
            continue;

          eligibleMembers.add(member.user.id);
        }
      }
    }

    prisma.discordUser
      .updateMany({
        where: { discordUserId: { in: [...eligibleMembers.values()] } },
        data: { balance: { increment: 50 } },
      })
      .catch(() => {});
  }, 1000 * 60 * 6);
};
