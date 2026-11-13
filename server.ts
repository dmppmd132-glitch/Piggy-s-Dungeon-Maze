import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateDmEpitaph,
  generateDmTurn,
  type EpitaphRequestBody,
  type TurnRequestBody,
} from './api/_lib/dm.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/dm/turn', async (req, res) => {
    const body = (req.body || {}) as TurnRequestBody;
    const result = await generateDmTurn(body);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/dm/epitaph', async (req, res) => {
    const body = (req.body || {}) as EpitaphRequestBody;
    const payload = await generateDmEpitaph(body);
    res.json(payload);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mud Kingdom RPG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
