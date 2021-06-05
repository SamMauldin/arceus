import { CommandHandler, registerCommand } from '../global/commandRegistry';

const pruneHandler: CommandHandler = async ({ message, args: [number] }) => {
  const count = number ? Math.min(Math.max(parseInt(number), 0), 100) : 50;
  if (isNaN(count)) return 'Invalid count';
  if ('bulkDelete' in message.channel) {
    await message.channel.bulkDelete(count);
    return 'Prune complete';
  }
  return 'Channel not supported';
};

export const register = () => {
  registerCommand({
    name: 'prune',
    description: 'Prune messages in channel',
    handler: pruneHandler,
  });
};
