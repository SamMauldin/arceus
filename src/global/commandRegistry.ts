import { Message, User } from 'discord.js';
import { client } from '../discord';
import { log } from '../log';
import { enabledConfigName, getConfigItem } from './configuration';
import { replyWithDelete } from './discordUtils';
import { hasPermission } from './permissions';
import { some } from 'lodash';

export type Command = {
  // Primary of the command, used to call it
  name: string;
  // Allow alias for command
  alias?: string[];
  // Description to be printed with help
  description?: string;
  // What module the command is associated with
  module?: string;

  // Handler to be called when command is executed
  handler: CommandHandler;

  // If the command should only work in a GuildChannel
  // Default: False
  guildOnly?: boolean;

  permissionNode?: string;
};

export type CommandArgs = {
  args: string[];
  executor: User;
  message: Message;
};

export type CommandHandler = (details: CommandArgs) => Promise<string | void>;

export const commandRegistry: Command[] = [];

export const registerCommand = (command: Command) => {
  commandRegistry.push(command);
};

export const registerHandler = () => {
  client.on('messageCreate', async (message) => {
    if (!message.content) return;
    if (message.author.bot) return;

    const userEnabled =
      getConfigItem(
        enabledConfigName({
          moduleSlug: 'commands',
          userId: message.author.id,
        }),
        'true'
      ) === 'true';
    if (!userEnabled) return;

    let content = message.content.trim();

    const mentions = [`<@!${client.user?.id}>`, `<@${client.user?.id}>`, '~'];
    if (
      message.guild &&
      !some(mentions, (mention) => content.startsWith(mention))
    )
      return;
    mentions.forEach((mention) => {
      content = content.replace(mention, '').trim();
    });

    const args = content.split(' ');
    const cmdName = args.shift() || 'help';

    const foundCommand = commandRegistry.find((cmd) => {
      if (cmd.name !== cmdName && !cmd.alias?.includes(cmdName)) return false;
      if (cmd.guildOnly && !message.guild) return false;

      return true;
    });

    if (!foundCommand) {
      await replyWithDelete(
        message,
        'Sorry, I could not find that command in this context.'
      );
      return;
    }

    const commandArgs: CommandArgs = {
      args,
      executor: message.author,
      message,
    };

    const permissionNode =
      foundCommand.permissionNode || `command:${foundCommand.name}`;

    const permissionGranted = await hasPermission(
      message.author.id,
      permissionNode
    );

    if (!permissionGranted) {
      log.info(
        `Denied permissions to run command ${foundCommand.name} for ${message.author.tag} (${permissionNode})`
      );
      await replyWithDelete(
        message,
        'You do not have permission to run this command.'
      );
      return;
    }

    log.info(
      `Executing command ${foundCommand.name} for ${
        message.author.tag
      } with arguments "${args.join(' ')}"`
    );

    try {
      const result = await foundCommand.handler(commandArgs);

      await replyWithDelete(message, result || undefined);
    } catch (err) {
      log.error(
        `Error while executing command ${foundCommand.name} for ${
          message.author.tag
        } with arguments "${args.join(' ')}"`,
        err
      );

      await replyWithDelete(
        message,
        'An internal error occured while executing your command.'
      );
    }
  });
};
