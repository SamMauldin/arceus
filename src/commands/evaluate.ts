import { client } from '../discord';
import { prisma } from '../prisma';
import { CommandHandler, registerCommand } from '../global/commandRegistry';
import { inspect } from 'util';

const evalHandler: CommandHandler = async ({ args, message }) => {
  const code = args.join(' ');
  if (!code) return 'Usage: eval [code]';

  const c = client;
  const g = message.guild;
  const p = prisma;

  c;
  g;
  p;

  try {
    const res = await eval(code);

    return '```' + inspect(res).substr(0, 1000) + '```';
  } catch (e) {
    return '```' + inspect(e).substr(0, 1000) + '```';
  }
};

export const register = () => {
  registerCommand({
    name: 'eval',
    description: 'Evaluate code',
    handler: evalHandler,
  });
};
