const { sql, config, poolPromise } = require('../config/db.js');

exports.getCargo = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Cargos');
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la base de datos');
  }
}

exports.postCargos = async (req, res) => {
  const { nombre_cargo, reqUser } = req.body;

  if (!nombre_cargo) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  try {
    if (reqUser.id_rol === 1 || reqUser.id_rol === 2) {
      const pool = await poolPromise;
      await pool.request()
        .input('nombre_cargo', sql.VarChar, nombre_cargo)
        .query('INSERT INTO Cargos (nombre_cargo) VALUES (@nombre_cargo)');

      return res.status(201).json({ message: 'Cargo agregado correctamente' });
    } else {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al insertar este cargo' });
  }
};

exports.deleteCargo = async (req, res) => {
  const { id } = req.params;
  const { reqUser } = req.body;

  try {
    if (reqUser.id_rol === 1) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Cargos WHERE id_cargo = @id');

      if (result.rowsAffected[0] > 0) {
        return res.json({ success: true, message: 'Cargo eliminado correctamente' });
      } else {
        return res.status(404).json({ success: false, message: 'Cargo no encontrado' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

exports.putCargo = async (req, res) => {
  const { id } = req.params;
  const { nombre_cargo, reqUser } = req.body;
  try {
    if (reqUser.id_rol === 1 || reqUser.id_rol === 2) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('nombre_cargo', sql.VarChar, nombre_cargo)
        .query(`
          UPDATE Cargos
          SET nombre_cargo = @nombre_cargo
          WHERE id_cargo = @id
        `);
      if (result.rowsAffected[0] > 0) {
        return res.json({ success: true, message: 'Cargo actualizado exitosamente' });
      } else {
        return res.status(404).json({ success: false, message: 'Cargo no encontrado' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (err) {
    console.error('Error al actualizar este cargo:', err);
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};
