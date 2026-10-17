import { getStorageStatus } from './prompts';

export default async function handler(_req: any, res: any) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  }

  const storage = getStorageStatus();

  const payload = {
    status: 'ok',
    runtime: 'vercel-serverless',
    storage: {
      driver: storage.driver,
      isPersistent: storage.isPersistent,
      connectionMode: storage.connectionMode,
      detectedVariables: storage.detectedVariables,
    },
    time: new Date().toISOString(),
  };

  if (typeof res.status === 'function') {
    return res.status(200).json(payload);
  }

  res.statusCode = 200;
  res.end(JSON.stringify(payload));
}
