const fs = require('fs');
const path = require('path');
const { MIME_TYPES, escapeHtml } = require('./httpUtils');

class StaticServer {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  serve(req, res, reqPath) {
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(this.rootDir, safePath);

    if (!filePath.startsWith(this.rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          `<h2>404 Not Found</h2><p>Cannot find path: ${escapeHtml(reqPath)}</p>` +
          `<p><a href="/">Return to Registry</a> | <a href="/backend-admin">Go to Backend Admin</a></p>`
        );
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
    });
  }
}

module.exports = StaticServer;
