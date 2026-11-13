import { generateDmEpitaph, type EpitaphRequestBody } from '../_lib/dm.js';

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

  const body = (req.body || {}) as EpitaphRequestBody;
  const payload = await generateDmEpitaph(body);
  res.status(200).json(payload);
}
