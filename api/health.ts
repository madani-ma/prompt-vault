export default async function handler(_req: any, res: any) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (typeof res.status === 'function') {
    return res.status(200).json({
      status: 'ok',
      runtime: 'vercel-serverless',
      time: new Date().toISOString(),
    });
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    status: 'ok',
    runtime: 'vercel-serverless',
    time: new Date().toISOString(),
  }));
}
