import path from 'node:path';
import { APP_VERSION } from '../shared/constants';

export { APP_VERSION };

export function resolveDataDir(): string {
  return process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(process.cwd(), 'data');
}
