const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // Always production in deployed app
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '8080', 10);

// In standalone mode, Next.js is in the current directory
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

console.log('Starting Next.js server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', port);
console.log('__dirname:', __dirname);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});
