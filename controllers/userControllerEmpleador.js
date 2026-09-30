const { sql, config, poolPromise } = require('../config/db.js');

exports.getEmpleadores = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Empleadores');
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la base de datos');
  } 
}

exports.postEmpleadores = async (req, res) => {
  const { nombre_empleador, nit, direccion_empleador, reqUser } = req.body;

  if (!nombre_empleador || !nit || !direccion_empleador) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('nombre_empleador', sql.VarChar, nombre_empleador)
      .input('nit', sql.VarChar, nit)
      .input('direccion_empleador', sql.VarChar, direccion_empleador)
      .query(`
        INSERT INTO Empleadores (nombre_empleador, nit, direccion_empleador)
        VALUES (@nombre_empleador, @nit, @direccion_empleador)
      `);

    res.status(201).json({ message: 'Empleador agregado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al insertar este empleador' });
  }
};


exports.putEmpleador = async (req, res) => {
  const { id } = req.params;
  const { nombre_empleador, nit, direccion_empleador, reqUser } = req.body;

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre_empleador', sql.VarChar, nombre_empleador)
      .input('nit', sql.VarChar, nit)
      .input('direccion_empleador', sql.VarChar, direccion_empleador)
      .query(`
        UPDATE Empleadores
        SET nombre_empleador = @nombre_empleador,
            nit = @nit,
            direccion_empleador = @direccion_empleador
        WHERE id_empleador = @id
      `);

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: 'Empleador actualizado exitosamente' });
    } else {
      res.status(404).json({ success: false, message: 'Empleador no encontrado' });
    }

  } catch (err) {
    console.error('Error al actualizar este empleador:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar este empleador' });
  }
};


exports.deleteEmpleador = async (req, res) => {
  const { id } = req.params;
  const { reqUser } = req.body;

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Empleadores WHERE id_empleador = @id');

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: 'Empleador eliminado correctamente' });
    } else {
      res.status(404).json({ success: false, message: 'Empleador no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};
