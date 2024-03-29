import { log as parentLog } from '../log';
import { client } from '../discord';
import {
  enabledConfigName,
  getConfigItem,
  setConfigItem,
} from '../global/configuration';
import { ChannelType } from 'discord.js';

const log = parentLog.getChildLogger({ name: 'Channel Sync' });

const CHANNEL_SYNC_INTERVAL = 1000 * 3;

const moduleSlug = 'channel-sync';

export const setup = () => {
  setInterval(() => {
    client.guilds.cache.forEach((guild) => {
      const guildEnabled =
        getConfigItem(
          enabledConfigName({ moduleSlug, guildId: guild.id }),
          'false'
        ) === 'true';
      if (!guildEnabled) return;

      guild.channels.cache
        .filter((chan) => chan.type !== ChannelType.GuildCategory)
        .filter((chan) => Boolean(chan.parent))
        .filter((chan) => !chan.isThread() && chan.permissionsLocked === false)
        .forEach((chan) => {
          const channelEnabled =
            getConfigItem(
              enabledConfigName({ moduleSlug, channelId: chan.id }),
              'true'
            ) === 'true';
          if (!channelEnabled) return;

          const permissionOverwrites = chan
            .parent!.permissionOverwrites.valueOf()
            .map((overwrite) => overwrite.toJSON());
          chan
            .edit({
              permissionOverwrites: permissionOverwrites as any,
              reason: 'Channel Sync detected unlocked permissions',
            })
            .catch(async (err) => {
              if (err) {
                log.warn(
                  'Failed to lock permissions for channel, disabling channel for future',
                  {
                    channelId: chan.id,
                    guildId: chan.guild.id,
                  }
                );

                await setConfigItem(
                  enabledConfigName({
                    moduleSlug,
                    channelId: chan.id,
                  }),
                  'false'
                );
              }
            });
        });
    });
  }, CHANNEL_SYNC_INTERVAL);
};
