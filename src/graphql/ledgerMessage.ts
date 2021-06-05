import { ObjectType, Field } from 'type-graphql';
import { LedgerAttachment } from './ledgerAttachment';

@ObjectType()
export class LedgerUser {
  @Field()
  id!: number;
  @Field()
  discordId!: string;
  @Field()
  tag!: string;
}

@ObjectType()
export class LedgerMessage {
  @Field()
  id!: number;
  @Field()
  discordId!: string;
  @Field()
  content!: string;
  @Field()
  timestamp!: Date;
  @Field()
  user!: LedgerUser;
  @Field(() => [LedgerAttachment])
  attachments!: LedgerAttachment[];
}
