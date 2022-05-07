import { prisma } from '../prisma';
import { CommandHandler, registerCommand } from '../global/commandRegistry';

const CURRENCY_SUFFIX = ' gold';

const getMention = (arg: string): string | undefined => {
  const match = /<@!?(?<id>\d+)>/.exec(arg);
  return match?.groups?.id;
};

export const balance: CommandHandler = async ({
  executor,
  args: [mention],
}) => {
  const usage = 'Usage: gold:balance [@user]';

  let targetUserId = executor.id;

  if (mention) {
    const mentioned = getMention(mention);
    if (!mentioned) return usage;

    targetUserId = mentioned;
  }

  const user = await prisma.discordUser.findUnique({
    where: { discordUserId: targetUserId },
  });

  if (!user) return `User not found.`;

  return user.balance.toLocaleString('en-US') + CURRENCY_SUFFIX;
};

export const give: CommandHandler = async ({
  executor,
  args: [mention, amount],
}) => {
  const usage = 'Usage: gold:give [@user] [amount]';

  const sender = await prisma.discordUser.findUnique({
    where: { discordUserId: executor.id },
  });

  if (!sender) return 'Could not find your account.';

  const recipientDiscordId = getMention(mention);
  if (!recipientDiscordId) return usage;
  const recipient = await prisma.discordUser.findUnique({
    where: { discordUserId: recipientDiscordId },
  });
  if (!recipient) return 'User not found.';

  let parsedAmount: bigint;

  try {
    parsedAmount = BigInt(amount);
  } catch (_) {
    return usage;
  }

  if (parsedAmount <= 0n) return 'Must transfer an amount greater than 0.';

  return await prisma.$transaction(async (prisma) => {
    const sender = await prisma.discordUser.update({
      data: { balance: { decrement: parsedAmount } },
      where: {
        discordUserId: executor.id,
      },
    });

    if (sender.balance < 0)
      return 'You cannot transfer an amount greater than your current balance.';

    await prisma.discordUser.update({
      data: { balance: { increment: parsedAmount } },
      where: { discordUserId: recipientDiscordId },
    });

    return 'Transfer complete!';
  });
};

export const register = () => {
  registerCommand({
    name: 'gold',
    description: "Check your or another user's balance",
    handler: balance,
    permissionNode: 'currency:basic:balance',
  });

  registerCommand({
    name: 'gold:give',
    description: 'Give gold to another user',
    handler: give,
    permissionNode: 'currency:basic:give',
  });
};
