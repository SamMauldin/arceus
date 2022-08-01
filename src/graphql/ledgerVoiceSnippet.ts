import {
  ObjectType,
  Field,
  Root,
  Resolver,
  FieldResolver,
  Mutation,
  Arg,
} from 'type-graphql';
import { Authorized } from './authorization';
import { minio } from '../global/minio';
import { prisma } from '../prisma';
import { LedgerUser } from './ledgerMessage';
import { hasPermission } from '../global/permissions';
import { subMinutes } from 'date-fns';
import { displayMessage } from '../modules/jarvis';

@ObjectType()
export class LedgerVoiceSnippet {
  @Field()
  id!: number;
  @Field()
  startDate!: Date;
  @Field()
  snippetId!: string;
  @Field(() => Date, { nullable: true })
  transcriptionStartedAt?: Date | null;
  @Field(() => String, { nullable: true })
  transcription?: string | null;
  @Field()
  user!: LedgerUser;
}

@ObjectType()
export class LedgerTranscriptionJob {
  @Field()
  snippetId!: string;
  @Field()
  signedUrl!: string;
}

@Resolver(() => LedgerVoiceSnippet)
export class LedgerVoiceSnippetResolver {
  @FieldResolver(() => String)
  async signedUrl(
    @Root() ledgerVoiceSnippet: LedgerVoiceSnippet
  ): Promise<string> {
    const minioName = `snippets/${ledgerVoiceSnippet.snippetId}.mp3`;

    return await minio.presignedGetObject(
      process.env.MINIO_BUCKET_LEDGER!,
      minioName,
      3600
    );
  }

  @Authorized({
    custom: async ({ session }) => {
      return await hasPermission(session.discordUserId!, 'ledger:transcriber');
    },
  })
  @Mutation(() => LedgerTranscriptionJob, { nullable: true })
  async poll_transcription_job(): Promise<LedgerTranscriptionJob | null> {
    return await prisma.$transaction(async (prisma) => {
      const snippet = await prisma.ledgerVoiceSnippet.findFirst({
        where: {
          transcription: { equals: null },
          OR: [
            {
              transcriptionStartedAt: { equals: null },
            },
            {
              transcriptionStartedAt: { lt: subMinutes(new Date(), 1) },
            },
          ],
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      if (!snippet) return null;

      await prisma.ledgerVoiceSnippet.update({
        where: { id: snippet.id },
        data: {
          transcriptionStartedAt: new Date(),
        },
      });

      const minioName = `snippets/${snippet.snippetId}.wav`;

      const signedUrl = await minio.presignedGetObject(
        process.env.MINIO_BUCKET_LEDGER!,
        minioName,
        3600
      );

      return { snippetId: snippet.snippetId, signedUrl };
    });
  }

  @Authorized({
    custom: async ({ session }) => {
      return await hasPermission(session.discordUserId!, 'ledger:transcriber');
    },
  })
  @Mutation(() => Boolean)
  async submit_transcription(
    @Arg('snippetId') snippetId: string,
    @Arg('transcription') transcription: string
  ): Promise<boolean> {
    const snippet = await prisma.ledgerVoiceSnippet.update({
      where: { snippetId },
      data: { transcription },
      include: { channel: true },
    });

    await displayMessage(snippet.id);

    return true;
  }
}
