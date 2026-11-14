import {
  generateDmTurn,
  generateDmTurnStream,
  type TurnRequestBody,
} from '../_lib/dm.js';

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => { json: (data: unknown) => void };
  setHeader?: (name: string, value: string) => void;
  write?: (chunk: string) => void;
  end?: () => void;
  flushHeaders?: () => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = (req.body || {}) as TurnRequestBody;
  const acceptHeader = String(req.headers?.accept || '');
  const wantsStream =
    (Boolean(body.stream) || acceptHeader.includes('text/event-stream')) &&
    typeof res.setHeader === 'function' &&
    typeof res.write === 'function' &&
    typeof res.end === 'function';

  if (!wantsStream) {
    const result = await generateDmTurn(body);
    res.status(result.status).json(result.payload);
    return;
  }

  res.setHeader!('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader!('Cache-Control', 'no-cache, no-transform');
  res.setHeader!('Connection', 'keep-alive');
  res.setHeader!('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: unknown) => {
    res.write!(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const result = await generateDmTurnStream(body, (story) => {
    sendEvent('story', { story });
  });

  if (result.status === 200) {
    sendEvent('done', result.payload);
  } else {
    sendEvent('error', result.payload);
  }

  res.end!();
}
