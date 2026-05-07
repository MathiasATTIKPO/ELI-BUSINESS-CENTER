#!/usr/bin/env node

/**
 * Simple HTTP Proxy Tunneling Server
 * Expose local API on a specific port
 * Utile pour les tests locaux sans dépendre d'outils externes comme ngrok
 */

const http = require('http');
const httpProxy = require('http-proxy');

const TARGET_PORT = process.env.PORT || 4001;
const TUNNEL_PORT = process.env.TUNNEL_PORT || 8080;

// Créer un proxy
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${TARGET_PORT}`,
  changeOrigin: true
});

// Créer un serveur HTTP qui utilise le proxy
const server = http.createServer((req, res) => {
  // Ajouter les headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  proxy.web(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway' }));
    }
  });
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bad Gateway' }));
});

// Démarrer le serveur
server.listen(TUNNEL_PORT, () => {
  console.log(`\n✅ Tunnel Server running!`);
  console.log(`📍 Local API: http://localhost:${TARGET_PORT}`);
  console.log(`🔗 Tunnel URL: http://localhost:${TUNNEL_PORT}`);
  //console.log(`\nUse VITE_API_BASE_URL=http://localhost:${TUNNEL_PORT} in your .env\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${TUNNEL_PORT} is already in use`);
    console.error(`   Try: npx kill-port ${TUNNEL_PORT}`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
