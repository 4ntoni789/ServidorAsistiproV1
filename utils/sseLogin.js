const conexionesActivas = require('../globals/conexionesActivas');
const { enviarNotificacion } = require('./envioNotificacionSse');

function registrarCliente(req, res) {
  const idRaw = req.query.id_usuario;
  const token = req.query.token;
  if (!idRaw) return res.status(400).end('Falta id_usuario');

  const id_usuario = String(idRaw);

  // Headers SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  // Guarda la conexión con más datos
  conexionesActivas.set(id_usuario, { res, token, id_usuario });

  enviarNotificacion(id_usuario, "login", {
    texto: "¡Sesión iniciada!",
    fecha: new Date().toISOString()
  });

  // Keep-alive
  const ka = setInterval(() => {
    if (res.writableEnded) return clearInterval(ka);
    res.write(`event: ping\n`);
    res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  }, 3000);

  // Log
  const conexiones = [];
  for (const [id, info] of conexionesActivas) {
    conexiones.push({
      '🆔 ID Usuario': id,
      '📡 Estado': info.res.writableEnded ? '❌ Cerrada' : '✅ Activa',
      '🔑 Token': info.token ? '✅' : '❌',
    });
  }
  console.log('\n📡 Conexiones activas actualmente:');
  if (conexiones.length === 0) console.log('🔕 No hay conexiones activas');
  else console.table(conexiones);

  // Cleanup
  req.on('close', () => {
    clearInterval(ka);
    conexionesActivas.delete(id_usuario);
    console.log(`🔴 Usuario ${id_usuario} desconectado`);
  });
}

module.exports = { registrarCliente };
