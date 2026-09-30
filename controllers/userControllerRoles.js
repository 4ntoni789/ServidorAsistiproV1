const { sql, config, poolPromise } = require('../config/db.js');

exports.getRoles = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Roles');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la base de datos');
  }
}

exports.postRole = async (req, res) => {
  const { nombre_rol, reqUser } = req.body;

  if (!nombre_rol) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  try {
    if (reqUser.id_rol == 1) {
      const pool = await poolPromise;
      await pool.request()
        .input('nombre_rol', sql.NVarChar, nombre_rol)
        .query('INSERT INTO Roles (nombre_rol) VALUES (@nombre_rol)');

      res.status(201).json({ message: 'Rol agregado correctamente' });
    } else {
      res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al insertar este rol' });
  }
};


exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  const { reqUser } = req.body;

  try {
    if (reqUser.id_rol == 1) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Roles WHERE id_rol = @id');

      if (result?.rowsAffected?.some(count => count > 0)) {
        res.json({ success: true, message: 'Rol eliminado correctamente' });
      } else {
        res.status(404).json({ success: false, message: 'Rol no encontrado' });
      }
    } else {
      res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

exports.putRole = async (req, res) => {
  const { id } = req.params;
  const { nombre_rol, reqUser } = req.body;

  try {
    if (reqUser.id_rol == 1) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('nombre_rol', sql.NVarChar, nombre_rol)
        .query(`
          UPDATE Roles
          SET nombre_rol = @nombre_rol
          WHERE id_rol = @id
        `);

      if (result.rowsAffected[0] > 0) {
        res.json({ success: true, message: 'Rol actualizado exitosamente' });
      } else {
        res.status(404).json({ success: false, message: 'Rol no encontrado' });
      }
    } else {
      res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (err) {
    console.error('Error al actualizar este rol:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar este rol' });
  }
};