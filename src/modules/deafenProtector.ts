import { log as parentLog } from '../log';
import { enabledConfigName, getConfigItem } from '../global/configuration';
import { client } from '../discord';

const log = parentLog.getChildLogger({ name: 'Deafen Protector' });

const moduleSlug = 'deafen-protector';

export const setup = () => {
  log.info('Initializing Deafen Protector');

  client.on('voiceStateUpdate', async (_, newState) => {
    const guildEnabled =
      getConfigItem(
        enabledConfigName({ moduleSlug, guildId: newState.guild.id }),
        'true'
      ) === 'true';
    if (!guildEnabled) return;

    if (!newState.member) return;
    const userId = newState.member.user.id;

    const userEnabled =
      getConfigItem(
        enabledConfigName({ moduleSlug, userId: userId }),
        'false'
      ) === 'true';
    if (!userEnabled) return;

    if (newState.serverDeaf) {
      await newState.setDeaf(false, 'Deafen protector undeafening');
    }

    if (newState.serverMute) {
      await newState.setMute(false, 'Deafen protector unmuting');
    }
  });
};
