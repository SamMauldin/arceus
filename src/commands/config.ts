import { CommandHandler, registerCommand } from '../global/commandRegistry';
import {
  deleteConfigItem,
  getConfigItem,
  loadConfiguration,
  setConfigItem,
} from '../global/configuration';

const reloadHandler: CommandHandler = async () => {
  await loadConfiguration();
  return 'Reloaded configuration!';
};

const getHandler: CommandHandler = async ({ args: [key] }) => {
  if (!key) return 'Usage: config:get [key]';

  return `${key}: ${getConfigItem(key)}`;
};

const setHandler: CommandHandler = async ({ args: [key, ...args] }) => {
  const value = args.join(' ');
  if (!key || !value) return 'Usage: config:set [key] [value]';

  await setConfigItem(key, value);

  return `Config item ${key} set!`;
};

const deleteHandler: CommandHandler = async ({ args: [key] }) => {
  if (!key) return 'Usage: config:delete [key]';

  await deleteConfigItem(key);

  return `Config item ${key} removed!`;
};

export const register = () => {
  registerCommand({
    name: 'config:reload',
    description: 'Reload configuration',
    handler: reloadHandler,
  });

  registerCommand({
    name: 'config:get',
    description: 'Get a configuration item',
    handler: getHandler,
  });

  registerCommand({
    name: 'config:set',
    description: 'Set a configuration item',
    handler: setHandler,
  });

  registerCommand({
    name: 'config:delete',
    description: 'Delete a configuration item',
    handler: deleteHandler,
  });
};
