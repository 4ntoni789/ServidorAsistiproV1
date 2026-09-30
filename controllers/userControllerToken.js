const { poolPromise, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

exports.getValidarToken = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, message: 'No hay token' });

    const token = auth.split(" ")[1];

    jwt.verify(token, SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ success: false, message: 'Token inválido o expirado' });

      const pool = await poolPromise;
      const request = pool.request();
      request.input('id_usuario', sql.Int, decoded.userId);

      const endLogin = await request.query(`
            SELECT top 1 
                fecha_hora_inicio,
                ip,
                plataforma
            FROM Inicio_sesion
            WHERE id_usuario = @id_usuario
            ORDER BY fecha_hora_inicio DESC
        `);

      const inicioSesion = endLogin.recordset[0];

      const result = await request.query(`
        SELECT * FROM Usuarios WHERE id_usuario = @id_usuario
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const usuario = result.recordset[0];

      if (usuario.estado !== 'activo') {
        return res.status(401).json({ success: false, message: 'Usuario inactivo' });
      }

      const userData = {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        estado: usuario.estado,
        id_rol: usuario.id_rol,
        correo: usuario.correo,
        type_role: usuario.id_rol === 2 ? 'Recursos humanos' : 'Administrador',
        ultimo_inicio_sesion: inicioSesion
      };

      return res.json({ success: true, user: userData });
    });

  } catch (error) {
    console.error('Error al validar token:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};
