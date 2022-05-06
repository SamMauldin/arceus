import { prisma } from '../prisma';
import { CommandHandler, registerCommand } from '../global/commandRegistry';

const CURRENCY_SUFFIX = " gold";

const getMention = (arg: string): string | undefined => {
  const match = /<@!?(?<id>\d+)>/.exec(arg);
  return match?.groups?.id;
};

export const balance: CommandHandler = async ({
  executor,
  args: [mention],
}) => {
  const usage = 'Usage: balance [@user]';

  let targetUserId = executor.id;

  if (mention) {
    const mentioned = getMention(mention);
    if (!mentioned) return usage;

    targetUserId = mentioned;
  }

  const user = await prisma.discordUser.findUnique({ where: { discordUserId: targetUserId } });

  if (!user) return `User not found.`;

  return user.balance.toLocaleString('en-US') + CURRENCY_SUFFIX;
};

export const register = () => {
  registerCommand({
    name: 'balance',
    description: "Check your or another user's balance",
    handler: balance,
  });
};
