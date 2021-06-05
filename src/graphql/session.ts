import {
  Mutation,
  Resolver,
  ObjectType,
  Field,
  Query,
  Ctx,
} from 'type-graphql';
import { prisma } from '../prisma';
import { Authorized } from './authorization';

@ObjectType()
class Session {
  @Field()
  id!: number;
  @Field()
  sessionToken!: string;
  @Field()
  loginToken!: string;
  @Field(() => String, { nullable: true })
  discordUserId?: string | null;
}

@Resolver(() => Session)
export class SessionResolver {
  @Mutation(() => Session)
  async createSession(): Promise<Session> {
    const session = await prisma.session.create({ data: {} });
    return session;
  }

  @Authorized({ preliminarySession: true })
  @Query(() => Session)
  async session(@Ctx('session') session: Session): Promise<Session> {
    return session;
  }
}
