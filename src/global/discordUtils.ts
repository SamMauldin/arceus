import { Message } from 'discord.js';
import { getConfigItem } from './configuration';

const DEFAULT_MESSAGE_DELETE_TIME = 1000 * 5;

export const replyWithDelete = async (message: Message, reply?: string) => {
  const deleteTimeMs = parseInt(
    getConfigItem(
      'global.message-delete-time',
      String(DEFAULT_MESSAGE_DELETE_TIME)
    )!
  );

  setTimeout(() => {
    if (!message.deletable) return;

    message.delete().catch(() => {});
  }, deleteTimeMs);

  if (!reply) return;

  message
    .reply(reply.substr(0, 1999))
    .catch(() => {})
    .then((createdMessage) => {
      if (!createdMessage) return;

      setTimeout(() => {
        if (!createdMessage.deletable) return;

        createdMessage.delete().catch(() => {});
      }, deleteTimeMs);
    });
};

export const codeWrap = (message: string) => `\`\`\`\n${message}\`\`\``;
