const { sql, config, poolPromise } = require('../config/db.js');


exports.getHorarios = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Horarios');
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la base de datos');
  }
}

exports.postHorario = async (req, res) => {
  const {
    hora_entrada,
    hora_valida_entrada,
    hora_valida_entrada_hasta,
    hora_salida_descanso,
    hora_valida_salida_descanso,
    hora_valida_salida_descanso_hasta,
    hora_regreso_descanso,
    hora_valida_regreso_descanso,
    hora_valida_regreso_descanso_hasta,
    hora_salida,
    hora_valida_salida,
    hora_valida_salida_hasta,
    margen,
    turno,
    cargo,
    id_pv,
    semana,
    reqUser
  } = req.body;

  try {
    // if (reqUser.id_rol !== 1) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'No tienes permiso para hacer esto'
    //   });
    // }

    const pool = await poolPromise;

    for (const dia of semana) {
      if (dia.check) {
        const checkQuery = await pool.request()
          .input('turno', sql.VarChar, turno)
          .input('dia', sql.VarChar, dia.diaSemana)
          .input('id_pv', sql.Int, id_pv)
          .input('id_cargo', sql.Int, cargo)
          .input('hora_valida_entrada', sql.VarChar, hora_valida_entrada)
          .query(`
            SELECT 1 FROM Horarios
            WHERE turno = @turno
              AND dia_semana = @dia
              AND id_pv = @id_pv
              AND id_cargo = @id_cargo
              AND hora_valida_entrada = @hora_valida_entrada
          `);

        if (checkQuery.recordset.length > 0) {
          return res.status(409).json({
            message: `Ya existe un horario para el turno ${turno}, el día ${dia.diaSemana} y el cargo ${cargo}`
          });
        }

        await pool.request()
          .input('hora_entrada', sql.VarChar, hora_entrada)
          .input('hora_salida_descanso', sql.VarChar, hora_salida_descanso)
          .input('hora_valida_salida_descanso', sql.VarChar, hora_valida_salida_descanso)
          .input('hora_valida_salida_descanso_hasta', sql.VarChar, hora_valida_salida_descanso_hasta)

          .input('hora_regreso_descanso', sql.VarChar, hora_regreso_descanso)
          .input('hora_valida_regreso_descanso', sql.VarChar, hora_valida_regreso_descanso)
          .input('hora_valida_regreso_descanso_hasta', sql.VarChar, hora_valida_regreso_descanso_hasta)

          .input('hora_salida', sql.VarChar, hora_salida)
          .input('margen', sql.Int, margen)
          .input('turno', sql.VarChar, turno)
          .input('id_cargo', sql.Int, cargo)
          .input('id_pv', sql.Int, id_pv)
          .input('dia_semana', sql.VarChar, dia.diaSemana)
          .input('hora_valida_entrada', sql.VarChar, hora_valida_entrada)
          .input('hora_valida_entrada_hasta', sql.VarChar, hora_valida_entrada_hasta)
          .input('hora_valida_salida', sql.VarChar, hora_valida_salida)
          .input('hora_valida_salida_hasta', sql.VarChar, hora_valida_salida_hasta)
          .query(`
            INSERT INTO Horarios (
              hora_entrada,
              hora_salida_descanso,
              hora_valida_salida_descanso,
              hora_valida_salida_descanso_hasta,
              hora_regreso_descanso,
              hora_valida_regreso_descanso,
              hora_valida_regreso_descanso_hasta,
              hora_salida,
              margen,
              turno,
              id_cargo,
              id_pv,
              dia_semana,
              hora_valida_entrada,
              hora_valida_entrada_hasta,
              hora_valida_salida,
              hora_valida_salida_hasta
            ) VALUES (
              @hora_entrada,
              @hora_salida_descanso,
              @hora_valida_salida_descanso,
              @hora_valida_salida_descanso_hasta,
              @hora_regreso_descanso,
              @hora_valida_regreso_descanso,
              @hora_valida_regreso_descanso_hasta,
              @hora_salida,
              @margen,
              @turno,
              @id_cargo,
              @id_pv,
              @dia_semana,
              @hora_valida_entrada,
              @hora_valida_entrada_hasta,
              @hora_valida_salida,
              @hora_valida_salida_hasta
            )
          `);
      }
    }

    return res.status(201).json({ message: 'Horario agregado correctamente' });

  } catch (error) {
    console.error('Error al insertar horario:', error);
    return res.status(500).json({ error: 'Error al insertar este horario' });
  }
};

exports.deleteHorario = async (req, res) => {
  const { id } = req.params;
  const { reqUser } = req.body;

  try {
    if (reqUser.id_rol !== 1) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
    }

    const pool = await poolPromise;
    const request = pool.request();

    request.input('id', sql.Int, id);
    const result = await request.query(`DELETE FROM Horarios WHERE id_horario = @id`);

    if (result.rowsAffected && result.rowsAffected[0] > 0) {
      return res.json({ success: true, message: 'Horario eliminado correctamente' });
    } else {
      return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    }

  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

