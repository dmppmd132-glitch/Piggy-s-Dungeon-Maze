interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status: (code: number) => { json: (data: unknown) => void };
}

export default function handler(_req: ApiRequest, res: ApiResponse) {
  res.status(200).json({ ok: true });
}
