import { Grant } from '@prisma/client';
import { newTrie } from 'shiro-trie';
import { prisma } from '../prisma';

const grantsMatch = (grants: Grant[], node: string) => {
  const trie = newTrie();
  const nodes = grants.map(({ node }) => node);
  trie.add(...nodes);

  return trie.check(node);
};

export const DEFAULT_ROLE_NAME = 'default';

export const hasPermission = async (userId: string, node: string) => {
  const discordUser = await prisma.discordUser.upsert({
    create: {
      discordUserId: userId,
      roles: {
        connect: [{ name: DEFAULT_ROLE_NAME }],
      },
    },
    update: {},
    where: {
      discordUserId: userId,
    },
    select: {
      roles: { select: { grants: true } },
    },
  });

  const grants = discordUser.roles.flatMap(({ grants }) => grants);

  return grantsMatch(grants, node);
};
