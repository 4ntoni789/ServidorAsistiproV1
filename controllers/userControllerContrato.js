const { sql, config, poolPromise } = require('../config/db.js');
const GenerarContratoPDF = require('../utils/generarContratoPdf.js');
const { NumerosALetras } = require('numero-a-letras');
const partirTextoEnDos = require('../scripts/partirNumeroLetras.js');
const contratosAVencer = require('../globals/contratosAVencer.js');
const prorrogaContrato = require('../utils/prorrogaContrato.js');
const revisarContratosAVencer = require('../events/pollingContratosAVencer.js');

exports.getContratos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
         SELECT 
            c.id_contrato,
            c.fecha_inicio,
            c.fecha_fin,
            c.estado,
            c.tipo_contrato,
            c.id_cargo,
            NULLIF(c.meses, 0) AS meses,
            ca.nombre_cargo,
            c.id_empleado,
            c.salario,
            e.nombres,
            emp.nombre_empleador,
            emp.id_empleador,
            c.cantidad_prorrogas,
            CASE 
                WHEN GETDATE() > c.fecha_fin THEN 'VENCIDO'
                ELSE 'VIGENTE'
            END AS estado_contrato
        FROM contratos c
        JOIN Cargos ca ON c.id_cargo = ca.id_cargo
        JOIN Empleados e ON c.id_empleado = e.id_empleado
        JOIN Empleadores emp ON c.id_empleador = emp.id_empleador;`);

        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la base de datos');
    }
}

exports.getContratosPorVencer = async (req, res) => {
    try {
        res.json(contratosAVencer.get(1));
    } catch (error) {
        console.log('Error al traer esta informacion.')
    }
}

exports.postContrato = async (req, res) => {
    const { tipo_contrato, fecha_inicio, fecha_fin, meses, cantidad_prorrogas, estado, id_empleado, id_cargo, salario, empleador, reqUser } = req.body;

    if (!tipo_contrato || !fecha_inicio || !estado || !id_empleado || !id_cargo || !empleador) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    try {
        if (reqUser.id_rol === 1 || reqUser.id_rol === 2) {
            const pool = await poolPromise;
            await pool.request()
                .input('tipo_contrato', sql.VarChar, tipo_contrato)
                .input('fecha_inicio', sql.Date, fecha_inicio)
                .input('fecha_fin', sql.Date, fecha_fin)
                .input('meses', sql.Int, meses)
                .input('cantidad_prorrogas', sql.Int, cantidad_prorrogas)
                .input('estado', sql.VarChar, estado)
                .input('id_empleado', sql.Int, id_empleado)
                .input('id_cargo', sql.Int, id_cargo)
                .input('salario', sql.Money, salario)
                .input('id_empleador', sql.Int, empleador)
                .query(`
                    INSERT INTO Contratos (tipo_contrato, fecha_inicio, fecha_fin, meses, cantidad_prorrogas, estado, id_empleado, id_cargo, salario, id_empleador)
                    VALUES (@tipo_contrato, @fecha_inicio, @fecha_fin, @meses, @cantidad_prorrogas, @estado, @id_empleado, @id_cargo, @salario, @id_empleador)
                `);

            res.status(201).json({ message: 'Contrato agregado correctamente' });
        } else {
            res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al insertar este contrato' });
    }
};

exports.postGenerarContrato = async (req, res) => {
    const {
        nombre, cedula, direccion, cargo, correo, salario, fecha_inicio, fecha_fin,
        fechaNacimiento, lugarNacimiento, gentilicio, nombre_empleador, tipo_contrato, nit,
        direccion_empleador, reqUser
    } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    try {
        if (gentilicio === ' colombiano') {
            lugarNacimiento.pop();
        }

        if (reqUser.id_rol === 1 || reqUser.id_rol === 2) {
            let newSalario = salario.replace(/\./g, '');
            const letrasSalario = NumerosALetras(Number(newSalario)).replace(/00\/100.*$/, "").trim().toUpperCase();
            const [salarioText, salarioText2] = partirTextoEnDos(letrasSalario);

            const datos = {
                nombre: nombre.toUpperCase(),
                cedula: String(cedula),
                direccion: direccion.toUpperCase(),
                cargo: cargo.toUpperCase(),
                correo: correo.toUpperCase(),
                salarioText,
                salarioText2,
                salario: `($${salario})`,
                fechaInicio: String(fecha_inicio),
                fechaNacimiento,
                nacionalidad: gentilicio.toUpperCase(),
                lugarNacimiento: lugarNacimiento.join(', ').toUpperCase(),
                nombreEmpleador: nombre_empleador,
                nit,
                tipo_contrato,
                direccionEmpleador: direccion_empleador,
                fechaFin: String(fecha_fin)
            };

            const pdfBuffer = await GenerarContratoPDF(datos);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=contrato.pdf',
            });

            return res.send(pdfBuffer);
        } else {
            return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al generar el contrato');
    }
};

exports.putContratoDesactivate = async (req, res) => {
    const { id } = req.params;
    const { estado, reqUser } = req.body;

    const fechaActual = new Date();
    const fechaFinContrato = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')}`;

    try {
        if (reqUser.id_rol === 1 || reqUser.id_rol === 2) {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('estado', sql.VarChar, estado)
                .input('id_usuario_contrato_terminado', sql.Int, reqUser.id_usuario)
                .input('fecha_fin_contrato', sql.Date, fechaFinContrato)
                .input('id_contrato', sql.Int, id)
                .query(`
                    UPDATE Contratos
                    SET estado = @estado,
                        id_usuario_contrato_terminado = @id_usuario_contrato_terminado,
                        fecha_fin_contrato = @fecha_fin_contrato
                    WHERE id_contrato = @id_contrato
                `);

            if (result.rowsAffected[0] > 0) {
                revisarContratosAVencer();
                res.json({ success: true, message: 'Contrato desactivado exitosamente' });
            } else {
                res.status(404).json({ success: false, message: 'Este contrato ya está desactivado' });
            }
        } else {
            res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
        }
    } catch (err) {
        console.error('Error al desactivar este contrato:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

exports.putProrrogaContrato = async (req, res) => {
    const { id } = req.params;
    const { reqUser } = req.body;

    try {
        if (reqUser.id_rol !== 1) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
        }
        prorrogaContrato(id, res);
    } catch (error) {
        res.status(500).json({ error: 'Error al prorrogar este contrato' });
    }
}