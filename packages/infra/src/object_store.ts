import fs from 'node:fs';
import path from 'node:path';
import { hashObject, sha256Hex } from '@dp/utils';

export interface ObjectStorePut {
  data: Buffer | string;
  contentType?: string;
}

export interface ObjectStore {
  put(key: string, input: ObjectStorePut): Promise<{ key: string; sha256: string }>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  resolvePath(key: string): string;
}

export class LocalFSObjectStore implements ObjectStore {
  constructor(private baseDir: string) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  resolvePath(key: string): string {
    return path.join(this.baseDir, key);
  }

  async put(key: string, input: ObjectStorePut): Promise<{ key: string; sha256: string }> {
    const resolved = this.resolvePath(key);
    const dir = path.dirname(resolved);
    fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.isBuffer(input.data) ? input.data : Buffer.from(input.data);
    fs.writeFileSync(resolved, buffer);
    const sha256 = sha256Hex(buffer.toString('utf-8'));
    return { key, sha256 };
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFileSync(this.resolvePath(key));
  }

  async exists(key: string): Promise<boolean> {
    return fs.existsSync(this.resolvePath(key));
  }
}
