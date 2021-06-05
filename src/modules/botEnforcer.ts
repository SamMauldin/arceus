import { client } from '../discord';
import { enabledConfigName, getConfigItem } from '../global/configuration';

const moduleSlug = 'bot-enforcer';

export const setup = () => {
  client.on('guildMemberAdd', (member) => {
    if (!member.user.bot) return;
    if (!member.kickable) return;

    const guildEnabled =
      getConfigItem(
        enabledConfigName({ moduleSlug, guildId: member.guild.id }),
        'false'
      ) === 'true';
    if (!guildEnabled) return;

    const userEnabled =
      getConfigItem(
        enabledConfigName({ moduleSlug, userId: member.user.id }),
        'true'
      ) === 'true';
    if (!userEnabled) return;

    member.kick('Bot Enforcer removing unauthorized bot');
  });
};
