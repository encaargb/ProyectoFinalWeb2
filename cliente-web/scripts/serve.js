import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createServer } from 'node:http';

const rootDir = resolve(process.cwd());
const port = Number.parseInt(process.env.CLIENT_PORT ?? '5173', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function resolveRequestPath(url) {
  const { pathname } = new URL(url, `http://localhost:${port}`);
  const decodedPath = decodeURIComponent(pathname);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = normalize(join(rootDir, requestedPath));

  if (!filePath.startsWith(rootDir)) {
    return null;
  }

  return filePath;
}

const server = createServer((req, res) => {
  const filePath = resolveRequestPath(req.url);

  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Archivo no encontrado');
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream'
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Cliente disponible en http://localhost:${port}`);
});
