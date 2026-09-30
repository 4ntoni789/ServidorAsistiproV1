const { sql, config, poolPromise } = require('../config/db.js');

exports.getPuntosVenta = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM PuntosVenta');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    } 
}

exports.postPuntoVenta = async (req, res) => {
  const { nombre, direccion, numero_serie_dispositivo, reqUser } = req.body;

  if (!nombre || !direccion || !numero_serie_dispositivo) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('direccion', sql.NVarChar, direccion)
      .input('numero', sql.NVarChar, numero_serie_dispositivo)
      .query(`
        INSERT INTO PuntosVenta (nombre, direccion, numero_serie_dispositivo)
        VALUES (@nombre, @direccion, @numero)
      `);

    res.status(201).json({ message: 'Punto de venta agregado correctamente' });

  } catch (error) {
    console.error('Error al insertar punto de venta:', error);
    res.status(500).json({ error: 'Error al insertar este Punto' });
  }
};

exports.putPuntoVenta = async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, numero_serie_dispositivo, reqUser } = req.body;

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar, nombre)
      .input('direccion', sql.NVarChar, direccion)
      .input('numero', sql.NVarChar, numero_serie_dispositivo)
      .query(`
        UPDATE PuntosVenta
        SET nombre = @nombre,
            direccion = @direccion,
            numero_serie_dispositivo = @numero
        WHERE id_pv = @id
      `);

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: 'Punto de venta actualizado exitosamente' });
    } else {
      res.status(404).json({ success: false, message: 'Punto de venta no encontrado' });
    }

  } catch (err) {
    console.error('Error al actualizar punto de venta:', err);
    res.status(500).json({ success: false, message: err.message || 'Error en el servidor' });
  }
};

exports.deletePuntoVenta = async (req, res) => {
  const { id } = req.params;
  const { reqUser } = req.body;

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM PuntosVenta WHERE id_pv = @id');

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: 'Punto de venta eliminado correctamente' });
    } else {
      res.status(404).json({ success: false, message: 'Punto de venta no encontrado' });
    }

  } catch (error) {
    console.error('Error al eliminar punto de venta:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};
