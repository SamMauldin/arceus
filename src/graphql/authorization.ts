import { Session } from '.prisma/client';
import {
  ArgsDictionary,
  AuthChecker,
  Authorized as OriginalAuthorized,
} from 'type-graphql';
import { hasPermission } from '../global/permissions';
import { Context } from './types';

type AuthOptions = {
  // If Authorization should pass with only a preliminary session
  preliminarySession?: boolean;
  node?: string;
  custom?: (props: {
    args: ArgsDictionary;
    session: Session;
  }) => Promise<boolean>;
};

export const Authorized = (options?: AuthOptions) =>
  OriginalAuthorized<AuthOptions>(options ? [options] : []);

export const authChecker: AuthChecker<Context, AuthOptions> = async (
  { context: { session }, args },
  optionsArr
) => {
  const options = optionsArr[0] || {};
  if (!session) return false;

  if (options.preliminarySession) return true;
  if (!session.discordUserId) return false;

  if (options.node) {
    const permissionGranted = await hasPermission(
      session.discordUserId,
      options.node
    );
    if (!permissionGranted) return false;
  }

  if (options.custom) {
    const res = await options.custom({ args, session });
    if (!res) return false;
  }

  return true;
};
