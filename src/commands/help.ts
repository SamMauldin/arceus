import {
  registerCommand,
  commandRegistry,
  CommandHandler,
} from '../global/commandRegistry';

const helpHandler: CommandHandler = async ({ executor, message }) => {
  const output = commandRegistry
    .map((command) => `${command.name}: ${command.description}`)
    .join('\n');

  executor.send('```' + output + '```');

  if (message.deletable) {
    message.delete().catch(() => {});
  }
};

export const register = () => {
  registerCommand({
    name: 'help',
    description: 'View a list of commands',
    handler: helpHandler,
  });
};
