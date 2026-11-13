import { generateDmTurn, type TurnRequestBody } from '../_lib/dm.js';

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => { json: (data: unknown) => void };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = (req.body || {}) as TurnRequestBody;
  const result = await generateDmTurn(body);
  res.status(result.status).json(result.payload);
}
