const { sql, config, poolPromise } = require('../config/db.js');
const empleadosMarcaciones = require('../globals/empleadosMarcaciones.js');


exports.getEmpleados = async (req, res) => {
  try {
    res.json(empleadosMarcaciones.get(1));

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al traer la infomación');
  }
}

exports.postEmpleados = async (req, res) => {
  const {
    nombre_usuario, apellido, cedula, telefono, email,
    reqUser, sexo, lugar_nacimiento, fecha_nacimiento, direccion
  } = req.body;

  if (!nombre_usuario || !apellido || !telefono || !cedula || !email || !sexo || !lugar_nacimiento || !fecha_nacimiento || !direccion) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  try {
    if (reqUser.id_rol == 1 || reqUser.id_rol == 2) {
      const pool = await poolPromise;
      await pool.request()
        .input('nombres', sql.NVarChar, nombre_usuario)
        .input('apellidos', sql.NVarChar, apellido)
        .input('cedula', sql.VarChar, cedula)
        .input('telefono', sql.VarChar, telefono)
        .input('correo', sql.VarChar, email)
        .input('sexo', sql.VarChar, sexo)
        .input('lugar_nacimiento', sql.VarChar, lugar_nacimiento)
        .input('fecha_nacimiento', sql.Date, fecha_nacimiento)
        .input('direccion', sql.NVarChar, direccion)
        .query(`
          INSERT INTO Empleados (nombres, apellidos, cedula, telefono, correo, sexo, lugar_nacimiento, fecha_nacimiento, direccion)
          VALUES (@nombres, @apellidos, @cedula, @telefono, @correo, @sexo, @lugar_nacimiento, @fecha_nacimiento, @direccion)
        `);

      res.status(201).json({ message: 'Usuario agregado correctamente' });
    } else {
      res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al insertar este empleado' });
  }
};


exports.deleteEmpleado = async (req, res) => {
  const { reqUser } = req.body;
  const { id } = req.params;

  try {
    if (reqUser.id_rol == 1) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Empleados WHERE id_empleado = @id');

      if (result?.rowsAffected?.some(count => count > 0)) {
        res.json({ success: true, message: 'Empleado eliminado correctamente', typeError: 'submit' });
      } else {
        res.status(404).json({ success: false, message: 'Empleado no encontrado', typeError: 'error' });
      }
    } else {
      res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto', typeError: 'error' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, typeError: 'error' });
  }
};


exports.putEmpleados = async (req, res) => {
  const { id } = req.params;
  const {
    nombres, apellidos, cedula, telefono, correo,
    sexo, reqUser, lugar_nacimiento, fecha_nacimiento, direccion
  } = req.body;

  try {
    if (reqUser.id_rol == 1 || reqUser.id_rol == 2) {
      const pool = await poolPromise;

      const result = await pool.request()
        .input('id_empleado', sql.Int, id)
        .input('nombres', sql.NVarChar, nombres)
        .input('apellidos', sql.NVarChar, apellidos)
        .input('cedula', sql.VarChar, cedula)
        .input('telefono', sql.VarChar, telefono)
        .input('correo', sql.VarChar, correo)
        .input('sexo', sql.VarChar, sexo)
        .input('lugar_nacimiento', sql.VarChar, lugar_nacimiento)
        .input('fecha_nacimiento', sql.Date, fecha_nacimiento)
        .input('direccion', sql.NVarChar, direccion)
        .query(`
          UPDATE Empleados
          SET nombres = @nombres,
              apellidos = @apellidos,
              cedula = @cedula,
              telefono = @telefono,
              correo = @correo,
              sexo = @sexo,
              lugar_nacimiento = @lugar_nacimiento,
              fecha_nacimiento = @fecha_nacimiento,
              direccion = @direccion
          WHERE id_empleado = @id_empleado
        `);

      if (result.rowsAffected[0] > 0) {
        res.json({ success: true, message: 'Empleado actualizado correctamente' });
      } else {
        res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      }
    } else {
      res.status(403).json({ success: false, message: 'No tienes permisos para esto' });
    }
  } catch (err) {
    console.error('Error al actualizar empleado:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

