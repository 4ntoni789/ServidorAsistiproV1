const jwt = require('jsonwebtoken');
const conexionesActivas = require('../globals/conexionesActivas');
const normalizarIP = require('../scripts/normalizarIp');
const enviarNotificacion = require('../utils/envioNotificacionSse');

const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_secreta_segura';

// Lista blanca de IPs (si decides mantenerla)
const ipPermitidas = [
  '127.0.0.1',
  '::1',
  '10.147.17.37',
  '10.147.17.144',
  '10.147.17.11',
  '192.168.2.94',
  '192.168.2.74',
  '10.147.17.104',
  '10.147.17.82',
  '192.168.10.4',
  '192.168.21.242',
  '192.168.21.240',
  '192.168.10.2',
  '192.168.21.238',
  '192.168.21.237',
  '192.168.21.246',
  '192.168.21.3',
  '192.168.21.2',
  '192.168.21.232',
  '192.168.21.231',
  '192.168.21.235',
  '192.168.21.247',
  '10.147.17.251'
];

function authSSE(req, res, next) {
  const ip = normalizarIP(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  const userAgent = req.headers['user-agent'];

  // 1. Validamos IP primero
  if (!ipPermitidas.includes(ip)) {
    console.log(`
        🚫 Acceso denegado por IP:
    🌐 IP: ${ip}
    💻 User-Agent: ${userAgent}
    🕒 Fecha/Hora: ${new Date().toLocaleString()}
    `);
    return res.status(403).json({ error: 'IP no autorizada.' });
  }

  // 2. Validamos JWT
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no enviado.' });
  }

  const token = authHeader.split(' ')[1]; // formato: Bearer <token>
  const decoded = jwt.verify(token, SECRET_KEY);
  req.user = decoded;
  try {
    if (!conexionesActivas.has(String(decoded.userId))) {
      return res.status(401).json({ error: 'Sesión no activa.' });
    }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      enviarNotificacion(decoded.userId, "login", {
        texto: "¡Sesión expirada, inicia sesión nuevamente!",
        fecha: new Date().toISOString()
      });
      return res.status(401).json({ error: "Token expirado." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido." });
    }
    return res.status(401).json({ error: "Error en la autenticación." });
  }
}

module.exports = authSSE;
