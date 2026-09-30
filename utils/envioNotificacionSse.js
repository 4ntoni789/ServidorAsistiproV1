const conexionesActivas = require('../globals/conexionesActivas');

function enviarNotificacion(id_usuario, tipo, data) {
    const payload = `event: ${tipo}\n` +
        `data: ${JSON.stringify(data)}\n\n`;

    if (id_usuario) {
        // Solo a un usuario específico
        const conexion = conexionesActivas.get(id_usuario);
        if (conexion && !conexion.res.writableEnded) {
            conexion.res.write(payload);
        }
    } else {
        // Broadcast a todos
        for (const [_, info] of conexionesActivas) {
            if (!info.res.writableEnded) {
                info.res.write(payload);
            }
        }
    }
}
module.exports = { enviarNotificacion };