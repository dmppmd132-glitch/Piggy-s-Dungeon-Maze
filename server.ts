import express from 'express';
import http from 'http';
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

const NOOP_VITE_CLIENT_ESM = `
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return \`\${pathname}?\${queryToInject}\${search ? '&' + search.slice(1) : ''}\${hash || ''}\`;
}
export class ErrorOverlay {}
`;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
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
    const hmrDisabled = process.env.DISABLE_HMR === 'true';

    if (hmrDisabled) {
      app.get('/@vite/client', (_req, res) => {
        res.type('application/javascript').send(NOOP_VITE_CLIENT_ESM);
      });
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(hmrDisabled
          ? { hmr: false, ws: false }
          : { ws: { server: httpServer, clientPort: null as unknown as number } }),
      },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Mud Kingdom RPG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
