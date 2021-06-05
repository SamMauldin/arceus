import { CommandHandler, registerCommand } from '../global/commandRegistry';
import { prisma } from '../prisma';

const webHandler: CommandHandler = async () => {
  return `https://arceus.mauldin.me/`;
};

const authHandler: CommandHandler = async ({ executor, args: [token] }) => {
  if (!token) return `Usage: web:auth [token]`;

  const { count } = await prisma.session.updateMany({
    where: {
      loginToken: { equals: token },
      discordUserId: { equals: null },
    },
    data: {
      discordUserId: executor.id,
    },
  });

  if (count === 0) return 'Authentication failed';

  return 'Successfully authenticated!';
};

const deauthHandler: CommandHandler = async ({ executor }) => {
  const { count } = await prisma.session.deleteMany({
    where: {
      discordUserId: { equals: executor.id },
    },
  });

  return `Deauthorized ${count} sessions`;
};

export const register = () => {
  registerCommand({
    name: 'web',
    description: 'Open the Web UI',
    handler: webHandler,
  });

  registerCommand({
    name: 'web:auth',
    description: 'Authenticate with the Web UI',
    handler: authHandler,
  });

  registerCommand({
    name: 'web:deauth',
    description: 'Deauthorize all of your existing sessions',
    handler: deauthHandler,
  });
};
