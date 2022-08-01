import {
  Resolver,
  ObjectType,
  Field,
  Query,
  Arg,
  FieldResolver,
  Root,
} from 'type-graphql';
import { hasPermission } from '../global/permissions';
import { prisma } from '../prisma';
import { Authorized } from './authorization';
import { LedgerMessage } from './ledgerMessage';
import { LedgerVoiceSnippet } from './ledgerVoiceSnippet';

@ObjectType()
export class LedgerChannel {
  @Field()
  id!: number;
  @Field()
  discordId!: string;
  @Field()
  name!: string;
}

@Resolver(() => LedgerChannel)
export class LedgerChannelResolver {
  @Authorized({
    custom: async ({ args, session }) => {
      const server = await prisma.ledgerChannel.findUnique({
        where: { discordId: args['channelDiscordId'] },
        select: { guild: { select: { discordId: true } } },
      });
      if (!server) return false;
      return await hasPermission(
        session.discordUserId!,
        `ledger:read:${server.guild.discordId}`
      );
    },
  })
  @Query(() => [LedgerMessage])
  async messages(
    @Arg('channelDiscordId') channelDiscordId: string,
    @Arg('before', { nullable: true }) before: Date,
    @Arg('pinned', () => Boolean, { nullable: true }) pinned: boolean | null
  ): Promise<LedgerMessage[]> {
    const beforeArg = before ? before : undefined;
    const ledgerChannel = await prisma.ledgerChannel.findUnique({
      where: { discordId: channelDiscordId },
    });
    if (!ledgerChannel) return [];

    return await prisma.ledgerMessage.findMany({
      take: 50,
      where: {
        ledgerChannelId: ledgerChannel.id,
        timestamp: { lt: beforeArg },
        pinned: pinned ? true : undefined,
      },
      orderBy: { timestamp: 'desc' },
      include: { user: true, attachments: true },
    });
  }

  @Query(() => [LedgerVoiceSnippet])
  async voice_snippets(
    @Arg('channelDiscordId') channelDiscordId: string,
    @Arg('before', { nullable: true }) before: Date
  ): Promise<LedgerVoiceSnippet[]> {
    const beforeArg = before ? before : undefined;
    const ledgerChannel = await prisma.ledgerChannel.findUnique({
      where: { discordId: channelDiscordId },
    });
    if (!ledgerChannel) return [];

    return await prisma.ledgerVoiceSnippet.findMany({
      take: 50,
      where: {
        ledgerChannelId: ledgerChannel.id,
        startDate: { lt: beforeArg },
      },
      orderBy: { startDate: 'desc' },
      include: { user: true },
    });
  }

  @Authorized({
    custom: async ({ args, session }) => {
      const server = await prisma.ledgerChannel.findUnique({
        where: { discordId: args['discordId'] },
        select: { guild: { select: { discordId: true } } },
      });
      if (!server) return false;
      return await hasPermission(
        session.discordUserId!,
        `ledger:read:${server.guild.discordId}`
      );
    },
  })
  @Query(() => LedgerChannel, { nullable: true })
  async channel(
    @Arg('discordId') discordId: string
  ): Promise<LedgerChannel | null> {
    return await prisma.ledgerChannel.findUnique({ where: { discordId } });
  }

  @FieldResolver(() => Number)
  async messageCount(@Root('id') ledgerChannelId: number): Promise<number> {
    return await prisma.ledgerMessage.count({
      where: { ledgerChannelId },
    });
  }
}
