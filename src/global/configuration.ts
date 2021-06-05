import { prisma } from '../prisma';

let configItemCache = new Map<string, string>();

export const getConfigItem = (key: string, defaultValue?: string) => {
  return configItemCache.get(key) || defaultValue;
};

export const setConfigItem = async (key: string, value: string) => {
  await prisma.configItem.upsert({
    create: {
      key,
      value,
    },
    update: {
      value,
    },
    where: { key },
  });
  configItemCache.set(key, value);
  return true;
};

export const deleteConfigItem = async (key: string) => {
  await prisma.configItem.delete({ where: { key } });
  configItemCache.delete(key);
  return true;
};

export const loadConfiguration = async () => {
  const temporaryConfig = new Map<string, string>();

  const configItems = await prisma.configItem.findMany();

  configItems.forEach((item) => {
    temporaryConfig.set(item.key, item.value);
  });

  configItemCache = temporaryConfig;
};

type UserConfigParam = { userId: string };
type GuildConfigParam = { channelId: string };
type ChannelConfigParam = { guildId: string };
type AreaConfigParam = UserConfigParam | GuildConfigParam | ChannelConfigParam;

type ConfigParameter = {
  moduleSlug: string;
} & AreaConfigParam;

export const enabledConfigName = ({ moduleSlug, ...args }: ConfigParameter) => {
  if ('userId' in args) {
    return `module.${moduleSlug}.user.${args.userId}.enabled`;
  } else if ('channelId' in args) {
    return `module.${moduleSlug}.channel.${args.channelId}.enabled`;
  } else if ('guildId' in args) {
    return `module.${moduleSlug}.guild.${args.guildId}.enabled`;
  }

  throw new Error('Unknown arguments passed to `enabledConfigName`');
};
