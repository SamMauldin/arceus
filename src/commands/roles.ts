import { User } from 'discord.js';
import { CommandHandler, registerCommand } from '../global/commandRegistry';
import { DEFAULT_ROLE_NAME } from '../global/permissions';
import { prisma } from '../prisma';

const getUser = async (discordUserId: string) => {
  return await prisma.discordUser.upsert({
    create: {
      discordUserId,
      roles: {
        connect: [{ name: DEFAULT_ROLE_NAME }],
      },
    },
    update: {},
    where: {
      discordUserId,
    },
    select: {
      roles: { select: { name: true } },
    },
  });
};

const getMention = (arg: string): string | undefined => {
  const match = /<@!?(?<id>\d+)>/.exec(arg);
  return match?.groups?.id;
};

const roleUserGiveHandler: CommandHandler = async ({
  args: [mention, role],
}) => {
  const usage = 'Usage: role:user:give @mention [role name]';

  const user = getMention(mention);
  if (!user) return usage;
  if (!role) return usage;

  // Ensure user exists
  await getUser(user);

  await prisma.discordUser.update({
    where: {
      discordUserId: user,
    },
    data: {
      roles: {
        connect: [
          {
            name: role,
          },
        ],
      },
    },
  });

  return 'Role given!';
};

const roleUserTakeHandler: CommandHandler = async ({
  args: [mention, role],
}) => {
  const usage = 'Usage: role:user:take @mention [role name]';

  const user = getMention(mention);
  if (!user) return usage;
  if (!role) return usage;

  // Ensure user exists
  await getUser(user);

  await prisma.discordUser.update({
    where: {
      discordUserId: user,
    },
    data: {
      roles: {
        disconnect: [
          {
            name: role,
          },
        ],
      },
    },
  });

  return 'Role removed!';
};

const roleUserListHandler: CommandHandler = async ({ args: [mention] }) => {
  const usage = 'Usage: role:user:list @mention';

  const user = getMention(mention);
  if (!user) return usage;

  // Ensure user exists
  const discordUser = await getUser(user);

  return `User has: \`${discordUser.roles
    .map(({ name }) => name)
    .join(', ')}\``;
};

const roleCreateHandler: CommandHandler = async ({ args: [name] }) => {
  if (!name) return 'Usage: role:create [role name]';

  await prisma.role.create({
    data: {
      name,
    },
  });

  return `Role \`${name}\` created!`;
};

const roleDeleteHandler: CommandHandler = async ({ args: [name] }) => {
  if (!name) return 'Usage: role:delete [role name]';

  await prisma.role.delete({
    where: {
      name,
    },
  });

  return `Role \`${name}\` deleted!`;
};

const roleGrantHandler: CommandHandler = async ({ args: [name, node] }) => {
  if (!name || !node) return 'Usage: role:grant [role name] [permission node]';

  await prisma.role.update({
    where: { name },
    data: {
      grants: {
        create: {
          node,
        },
      },
    },
  });

  return `Granted \`${node}\` to role \`${name}\`!`;
};

const roleRevokeHandler: CommandHandler = async ({ args: [name, node] }) => {
  if (!name || !node) return 'Usage: role:revoke [role name] [permission node]';

  await prisma.grant.deleteMany({
    where: { node, role: { name } },
  });

  return `Revoked \`${node}\` from role \`${name}\`!`;
};

const roleGrantsHandler: CommandHandler = async ({ args: [name] }) => {
  if (!name) return 'Usage: role:revoke [role name]';

  const role = await prisma.role.findUnique({
    where: { name },
    select: { grants: { select: { node: true } } },
  });

  if (!role) return `Role \`${name}\` not found!`;

  return `Role \`${name}\` has the following grants:\n\`\`\`\n${role.grants
    .map(({ node }) => node)
    .join('\n')}\`\`\``;
};

const roleListHandler: CommandHandler = async () => {
  const roles = await prisma.role.findMany();

  return `Roles:\n\`\`\`\n${roles.map(({ name }) => name).join('\n')}\`\`\``;
};

export const register = () => {
  registerCommand({
    name: 'role:user:give',
    description: 'Give a role to a user',
    handler: roleUserGiveHandler,
  });

  registerCommand({
    name: 'role:user:take',
    description: 'Take a role from a user',
    handler: roleUserTakeHandler,
  });

  registerCommand({
    name: 'role:user:list',
    description: "List a user's roles",
    handler: roleUserListHandler,
  });

  registerCommand({
    name: 'role:create',
    description: 'Create a new role',
    handler: roleCreateHandler,
  });

  registerCommand({
    name: 'role:delete',
    description: 'Delete a role',
    handler: roleDeleteHandler,
  });

  registerCommand({
    name: 'role:grant',
    description: 'Grant permissions to a role',
    handler: roleGrantHandler,
  });

  registerCommand({
    name: 'role:revoke',
    description: 'Revoke permissions from a role',
    handler: roleRevokeHandler,
  });

  registerCommand({
    name: 'role:grants',
    description: 'List grants for a role',
    handler: roleGrantsHandler,
  });

  registerCommand({
    name: 'role:list',
    description: 'List roles',
    handler: roleListHandler,
  });
};
