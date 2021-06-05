import { Request, Response } from 'express';
import { Session } from '@prisma/client';

export type Context = { req: Request; res: Response; session: Session | null };
