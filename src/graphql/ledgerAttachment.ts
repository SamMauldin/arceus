import { Resolver, ObjectType, Field, FieldResolver, Root } from 'type-graphql';
import { minio } from '../global/minio';

@ObjectType()
export class LedgerAttachment {
  @Field()
  id!: number;
  @Field()
  discordId!: string;
  @Field()
  name!: string;
}

@Resolver(() => LedgerAttachment)
export class LedgerAttachmentResolver {
  @FieldResolver(() => String)
  async signedUrl(@Root() ledgerAttachment: LedgerAttachment): Promise<string> {
    const minioName = `attachments/${
      ledgerAttachment.discordId
    }-${encodeURIComponent(ledgerAttachment.name)}`;

    return await minio.presignedGetObject(
      process.env.MINIO_BUCKET_LEDGER!,
      minioName,
      3600
    );
  }
}
