import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import express from 'express';

import { log } from '../log';
import {
  SessionResolver,
  authChecker,
  LedgerGuildResolver,
  LedgerChannelResolver,
  LedgerAttachmentResolver,
} from '../graphql';
import { prisma } from '../prisma';
import { subDays, subMinutes } from 'date-fns';

const sweepSessions = async () => {
  await prisma.session.deleteMany({
    where: { createdAt: { lt: subDays(new Date(), 3) } },
  });
  await prisma.session.deleteMany({
    where: {
      createdAt: { lt: subMinutes(new Date(), 5) },
      discordUserId: { equals: null },
    },
  });
};

export const setup = async () => {
  sweepSessions();
  setInterval(sweepSessions, 1000 * 60 * 5);

  const schema = await buildSchema({
    resolvers: [
      SessionResolver,
      LedgerGuildResolver,
      LedgerChannelResolver,
      LedgerAttachmentResolver,
    ],
    authChecker,
  });

  const server = new ApolloServer({
    schema,
    introspection: true,
    context: async ({ req }) => {
      const token = req.header('X-Session-Token');
      if (!token) return null;
      const resolvedSession = await prisma.session.findUnique({
        where: { sessionToken: token },
      });
      if (!resolvedSession) return null;

      return { session: resolvedSession };
    },
  });
  await server.start();

  const app = express();
  server.applyMiddleware({
    app,
    cors: { allowedHeaders: ['Content-Type', 'X-Session-Token'], origin: '*' },
  });

  app.listen(3000, () => log.info('Now listening on port 3000'));
};
