import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
let mongo;
if (!process.env.MONGODB_URI) {
  const dbPath = resolve('.local-data/mongo');
  await mkdir(dbPath, { recursive: true });
  console.log('Starting a local MongoDB replica set (first run downloads MongoDB)...');
  mongo = await MongoMemoryReplSet.create({
    binary: { version: '8.0.12' },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ dbPath }],
  });
  process.env.MONGODB_URI = mongo.getUri('equiptrack');
  console.log('Local MongoDB ready. Data persists in .local-data/mongo.');
}
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1'], { stdio: 'inherit', env: process.env });
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  child.kill();
  if (mongo) await mongo.stop({ doCleanup: false });
  process.exit(code);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
child.on('exit', code => stop(code ?? 0));
