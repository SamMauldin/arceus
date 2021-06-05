import { register as registerConfigCommand } from './config';
import { register as registerHelpCommand } from './help';
import { register as registerEvalCommand } from './evaluate';
import { register as registerPruneCommand } from './prune';
import { register as registerAuthCommand } from './authenticate';
import { register as registerRoleCommand } from './roles';

export const registerCommands = () => {
  registerConfigCommand();
  registerHelpCommand();
  registerEvalCommand();
  registerPruneCommand();
  registerAuthCommand();
  registerRoleCommand();
};
