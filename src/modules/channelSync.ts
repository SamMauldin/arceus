import { log as parentLog } from '../log';
import { client } from '../discord';
import {
  enabledConfigName,
  getConfigItem,
  setConfigItem,
} from '../global/configuration';

const log = parentLog.getChildLogger({ name: 'Channel Sync' });

const CHANNEL_SYNC_INTERVAL = 1000 * 3;

const moduleSlug = 'channel-sync';

export const setup = () => {
  client.setInterval(() => {
    client.guilds.cache.forEach((guild) => {
      const guildEnabled =
        getConfigItem(
          enabledConfigName({ moduleSlug, guildId: guild.id }),
          'false'
        ) === 'true';
      if (!guildEnabled) return;

      guild.channels.cache
        .filter((chan) => chan.type !== 'category')
        .filter((chan) => Boolean(chan.parent))
        .filter((chan) => chan.permissionsLocked === false)
        .forEach((chan) => {
          const channelEnabled =
            getConfigItem(
              enabledConfigName({ moduleSlug, channelId: chan.id }),
              'true'
            ) === 'true';
          if (!channelEnabled) return;

          const permissionOverwrites = chan.parent!.permissionOverwrites.map(
            (overwrite) => overwrite.toJSON()
          );
          chan
            .edit(
              { permissionOverwrites } as any,
              'Channel Sync detected unlocked permissions'
            )
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
