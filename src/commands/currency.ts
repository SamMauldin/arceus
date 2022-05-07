import { prisma } from '../prisma';
import { CommandHandler, registerCommand } from '../global/commandRegistry';

export const CURRENCY_SUFFIX = ' gold';

const getMention = (arg: string): string | undefined => {
  const match = /<@!?(?<id>\d+)>/.exec(arg);
  return match?.groups?.id;
};

export const parseAmount = (
  amount: string | undefined,
  nonZero: boolean
): number | null => {
  if (amount === undefined) return null;

  try {
    const parsed = parseInt(amount);
    if (parsed < 0 || isNaN(parsed)) return null;
    if (nonZero && parsed == 0) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

export const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('en-US')}${CURRENCY_SUFFIX}`;

const balance: CommandHandler = async ({ executor, args: [mention] }) => {
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

const print: CommandHandler = async ({ args: [mention, amount] }) => {
  const usage = 'Usage: gold:print [@user] [amount]';

  const recipientDiscordId = getMention(mention);
  if (!recipientDiscordId) return usage;
  const recipient = await prisma.discordUser.findUnique({
    where: { discordUserId: recipientDiscordId },
  });
  if (!recipient) return 'User not found.';

  const parsedAmount = parseAmount(amount, true);
  if (!parsedAmount) return usage;

  await prisma.discordUser.update({
    data: { balance: { increment: parsedAmount } },
    where: { discordUserId: recipientDiscordId },
  });

  return `Printed!`;
};

const give: CommandHandler = async ({ executor, args: [mention, amount] }) => {
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

  const parsedAmount = parseAmount(amount, true);
  if (!parsedAmount) return usage;

  // Real check is in transaction for consistency, but this is for a proper error
  if (parsedAmount > sender.balance)
    return 'Cannot transfer an amount greater than your balance';

  return await prisma.$transaction(async (prisma) => {
    const sender = await prisma.discordUser.update({
      data: { balance: { decrement: parsedAmount } },
      where: {
        discordUserId: executor.id,
      },
    });

    if (sender.balance < 0) throw new Error('Balance dropped below zero');

    await prisma.discordUser.update({
      data: { balance: { increment: parsedAmount } },
      where: { discordUserId: recipientDiscordId },
    });

    return 'Transfer complete!';
  });
};

const rich: CommandHandler = async () => {
  const richest = await prisma.discordUser.findMany({
    orderBy: [{ balance: 'desc' }],
    take: 5,
  });

  const richestText = richest
    .map(
      (user) =>
        `<@${user.discordUserId}>: ${user.balance.toLocaleString(
          'en-US'
        )}${CURRENCY_SUFFIX}`
    )
    .join('\n');

  return `Richest Users:\n${richestText}`;
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

  registerCommand({
    name: 'gold:print',
    description: 'Print gold from thin air',
    handler: print,
    permissionNode: 'currency:admin:print',
  });

  registerCommand({
    name: 'gold:rich',
    description: 'See users with the most currency',
    handler: rich,
    permissionNode: 'currency:basic:rich',
  });
};
