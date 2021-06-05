import { Session } from '@prisma/client';
import {
  Resolver,
  ObjectType,
  Field,
  Query,
  Arg,
  FieldResolver,
  Root,
  Ctx,
} from 'type-graphql';
import { hasPermission } from '../global/permissions';
import { prisma } from '../prisma';
import { Authorized } from './authorization';
import { LedgerChannel } from './ledgerChannel';

@ObjectType()
class LedgerGuild {
  @Field()
  id!: number;
  @Field()
  discordId!: string;
  @Field()
  name!: string;
}

@Resolver(() => LedgerGuild)
export class LedgerGuildResolver {
  @Authorized()
  @Query(() => [LedgerGuild])
  async guilds(@Ctx('session') session: Session): Promise<LedgerGuild[]> {
    const guilds = await prisma.ledgerGuild.findMany();
    const allowedGuilds: LedgerGuild[] = [];

    for (const guild of guilds) {
      const hasAccess = await hasPermission(
        session.discordUserId!,
        `ledger:read:${guild.discordId}`
      );

      if (hasAccess) allowedGuilds.push(guild);
    }

    return allowedGuilds;
  }

  @Authorized({
    custom: async ({ args, session }) => {
      return await hasPermission(
        session.discordUserId!,
        `ledger:read:${args['discordId']}`
      );
    },
  })
  @Query(() => LedgerGuild, { nullable: true })
  async guild(
    @Arg('discordId') discordId: string
  ): Promise<LedgerGuild | null> {
    return await prisma.ledgerGuild.findUnique({ where: { discordId } });
  }

  @FieldResolver(() => [LedgerChannel])
  async channels(@Root() ledgerGuild: LedgerGuild): Promise<LedgerChannel[]> {
    return await prisma.ledgerChannel.findMany({
      where: { guild: { discordId: ledgerGuild.discordId } },
    });
  }
}
