import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Short content hash of a file in website/, used as ?v= so a browser that cached an older copy fetches the new one.
// The build runs from content-site/, one level below website/.
export function assetVersion(file: string): string {
  const full = path.resolve(process.cwd(), '..', 'website', file.replace(/^\//, ''));
  return createHash('sha1').update(fs.readFileSync(full)).digest('hex').slice(0, 8);
}

export const asset = (file: string): string => `/${file.replace(/^\//, '')}?v=${assetVersion(file)}`;
