const { sql, config, poolPromise } = require('../config/db.js');
const bcrypt = require('bcrypt');
const validarPassword = require('../scripts/validarPass.js');
const jwt = require('jsonwebtoken');
const conexionesActivas = require('../globals/conexionesActivas');
const crypto = require("crypto");
const enviarEmail = require('../utils/envioEmail.js');

exports.validateUser = async (req, res) => {
    const { nombre_usuario, contrasena } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('identificador', sql.VarChar, nombre_usuario.trim());

        const result = await request.query(`
            SELECT * FROM Usuarios 
            WHERE nombre_usuario = @identificador OR LOWER(correo) = LOWER(@identificador)
            `);
        const usuario = result.recordset[0];

        if (usuario) {
            request.input('id_usuario', sql.Int, usuario.id_usuario);
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

            if (result.recordset.length === 0) {
                return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
            }

            const coincide = await bcrypt.compare(contrasena, usuario.contrasena);

            if (!coincide) {
                return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
            }

            if (usuario.estado !== 'activo') {
                return res.status(401).json({ succsess: false, message: 'Usuario inactivo' });
            }

            // Guardamos inicio de sesión
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
            const plataforma = req.headers['user-agent'] || 'Navegador desconocido';

            const logRequest = pool.request();
            logRequest.input('id_usuario', sql.Int, usuario.id_usuario);
            logRequest.input('nombre_usuario', sql.NVarChar, usuario.nombre_usuario);
            logRequest.input('fecha_hora_inicio', sql.DateTime, new Date());
            logRequest.input('ip', sql.VarChar, ip);
            logRequest.input('plataforma', sql.VarChar, plataforma);

            await logRequest.query(`
                INSERT INTO Inicio_sesion (id_usuario, nombre_usuario, fecha_hora_inicio, ip, plataforma)
                VALUES (@id_usuario, @nombre_usuario, @fecha_hora_inicio, @ip, @plataforma)
            `);

            // Datos que irán dentro del token
            const userData = {
                id_usuario: usuario.id_usuario,
                nombre_usuario: usuario.nombre_usuario,
                estado: usuario.estado,
                id_rol: usuario.id_rol,
                correo: usuario.correo,
                type_role: usuario.id_rol === 2 ? 'Recursos humanos' : 'Administrador',
                ultimo_inicio_sesion: inicioSesion
            };

            // Generamos el token con expiración
            const token = jwt.sign(
                { userId: usuario.id_usuario, role: usuario.id_rol },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            return res.json({
                success: true,
                user: userData,
                token
            });
        } else {
            return res.json({
                success: false
            })
        }

    } catch (err) {
        console.error('Error al validar usuario:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

exports.getUsers = async (req, res) => {

    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Usuarios');

        const newAction = [];

        result.recordset.map((item, i) => {
            newAction.push({
                id_usuario: item['id_usuario'],
                nombre_usuario: item['nombre_usuario'],
                estado: item['estado'],
                id_rol: item['id_rol'],
                correo: item['correo'],
                type_role: item['id_rol'] == 2 ? 'Recursos humanos' : 'Administrador',
                enlinea: conexionesActivas.get(String(item['id_usuario']))?.id_usuario == item['id_usuario'] ? true : false
            })
        })
        res.json(newAction);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
}

exports.postUsers = async (req, res) => {
    const { nombre_usuario, password, estado, id_rol, email, reqUser } = req.body;

    if (!nombre_usuario || !password || id_rol == null) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const errores = validarPassword(password);

    try {
        if (reqUser.id_rol == 1) {
            if (errores.length == 0) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const pool = await poolPromise;
                await pool.request()
                    .input('nombre_usuario', sql.VarChar, nombre_usuario)
                    .input('contrasena', sql.VarChar, hashedPassword)
                    .input('estado', sql.VarChar, estado || 'activo')
                    .input('id_rol', sql.Int, id_rol)
                    .input('correo', sql.VarChar, email || '')
                    .query(`
                        INSERT INTO Usuarios (nombre_usuario, contrasena, estado, id_rol, correo)
                        VALUES (@nombre_usuario, @contrasena, @estado, @id_rol, @correo)
                    `);

                res.status(201).json({ message: 'Usuario agregado correctamente' });
            } else {
                res.status(400).json({ message: errores[0] });
            }
        } else {
            res.status(403).json({ message: 'No tienes permiso para hacer esto' });
        }
    } catch (err) {
        console.error('Error al insertar usuario:', err);
        res.status(500).json({ error: 'Error al insertar usuario' });
    }
};

exports.deleteUsers = async (req, res) => {
    const { id } = req.params;
    const { reqUser } = req.body;

    try {
        if (reqUser.id_rol == 1) {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Usuarios WHERE id_usuario = @id');

            if (result?.rowsAffected?.some(count => count > 0)) {
                res.json({ success: true, message: 'Usuario eliminado correctamente' });
            } else {
                res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
        } else {
            res.status(403).json({ message: 'No tienes permiso para hacer esto' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

exports.putUsers = async (req, res) => {
    const { id } = req.params;
    const { nombre_usuario, id_rol, email, reqUser } = req.body;

    try {
        if (reqUser.id_rol == 1) {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre_usuario', sql.VarChar, nombre_usuario)
                .input('id_rol', sql.Int, id_rol)
                .input('correo', sql.VarChar, email)
                .query(`
                    UPDATE Usuarios
                    SET nombre_usuario = @nombre_usuario, id_rol = @id_rol, correo = @correo
                    WHERE id_usuario = @id
                `);

            if (result.rowsAffected[0] > 0) {
                res.json({ success: true, message: 'Usuario actualizado correctamente' });
            } else {
                res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
        } else {
            res.status(403).json({ message: 'No tienes permisos para esto' });
        }
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

exports.putSingleUser = async (req, res) => {
    const { id } = req.params;
    const { nombre_usuario, email, reqUser } = req.body;

    try {
        if (id == reqUser.id_usuario) {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre_usuario', sql.VarChar, nombre_usuario)
                .input('correo', sql.VarChar, email)
                .query(`
                    UPDATE Usuarios
                    SET nombre_usuario = @nombre_usuario, correo = @correo
                    WHERE id_usuario = @id
                `);

            if (result.rowsAffected[0] > 0) {
                res.json({ message: 'Actualizaste tu usuario exitosamente' });
            } else {
                res.status(404).json({ message: 'Usuario no encontrado' });
            }
        } else {
            res.status(403).json({ message: 'No tienes permisos para esto' });
        }
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

exports.putPassUser = async (req, res) => {
    const { id } = req.params;
    const { password, reqUser } = req.body;

    let errores = validarPassword(password); // ya devuelve array de errores

    try {
        if (!password, !reqUser) {
            return res.status(403).json({ message: 'Faltan campos por completar.' });

        } else {
            if (!reqUser || !reqUser.nombre_usuario) {
                return res.status(403).json({ message: 'No tienes permisos para esto' });
            }

            const plainPassword = String(password).trim();
            const pool = await poolPromise;

            // 1) Traemos la contraseña actual
            const userResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT contrasena FROM Usuarios WHERE id_usuario = @id');

            if (!userResult.recordset || userResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            const currentHashedPassword = userResult.recordset[0].contrasena;

            // 2) Comparamos con bcrypt
            const isSame = await bcrypt.compare(plainPassword, String(currentHashedPassword));

            if (isSame) {
                errores = ['La nueva contraseña no puede ser igual a la anterior'];
            }

            // 3) Si hay errores acumulados -> responder
            if (errores.length > 0) {
                return res.status(400).json({ message: errores[0], errores });
            }

            // 4) Hasheamos y actualizamos
            const newHashed = await bcrypt.hash(plainPassword, 10);

            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('contrasena', sql.VarChar(100), newHashed)
                .query('UPDATE Usuarios SET contrasena = @contrasena WHERE id_usuario = @id');

            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                return res.json({ message: 'Actualizaste tu contraseña exitosamente' });
            } else {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
        }

    } catch (err) {
        console.error('Error en putPassUser:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

exports.fotgotPass = async (req, res) => {
    const { identificador } = req.body;

    try {
        if (!identificador) {
            return res.status(403).json({ message: 'Faltan campos por completar.' });
        } else {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('identificador', sql.VarChar, identificador)
                .query('SELECT id_usuario, correo FROM Usuarios WHERE nombre_usuario = @identificador OR LOWER(correo) = LOWER(@identificador)');
            if (result.recordset.length === 0) {
                return res.status(404).json({ message: "No hay ningún usuario creado con este nombre o correo." });
            } else {
                const token = crypto.randomInt(100000, 999999).toString(); // código de 6 dígitos
                const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

                await pool.request()
                    .input("identificador", sql.VarChar, identificador)
                    .input("token", sql.VarChar, token)
                    .input("expires", sql.DateTime, expires)
                    .query(`UPDATE Usuarios 
                            SET reset_token = @token, reset_expires = @expires 
                       WHERE nombre_usuario = @identificador OR LOWER(correo) = LOWER(@identificador)`);

                enviarEmail({
                    email: result.recordset[0].correo,
                    code: token
                }, null, null, 'restablecer-contrasena');
                console.log('Codigo generado exitosamente.');
                return res.status(201).json({ success: true, message: 'Código enviado a tu correo.' });
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
}

exports.verifyCodeForgot = async (req, res) => {
    const { email, code } = req.body;
    try {
        if (!email || !code) {
            return res.status(403).json({ message: 'Faltan campos por completar.' });
        } else {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .input('code', sql.VarChar, code)
                .query(`SELECT reset_expires FROM Usuarios
                        WHERE nombre_usuario = @email OR LOWER(correo) = @email AND reset_token = @code`);
            if (result.recordset.length === 0) {
                return res.status(400).json({ message: "Código inválido" });
            } else {
                const expires = result.recordset[0].reset_expires;
                if (new Date(expires) < new Date()) {
                    return res.status(400).json({ message: "El código ha expirado" });
                } else {
                    res.json({ success: true, message: "Verificación completada." });
                }
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al verificar el código" });
    }
}


exports.putUsersActivateState = async (req, res) => {
    const { id } = req.params;
    const { estado, reqUser } = req.body;

    try {
        if (reqUser.id_rol == 1) {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.VarChar, estado)
                .query('UPDATE Usuarios SET estado = @estado WHERE id_usuario = @id');

            if (result.rowsAffected[0] > 0) {
                res.json({ success: true, message: 'Usuario actualizado correctamente' });
            } else {
                res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
        } else {
            res.status(403).json({ success: false, message: 'No tienes permiso para hacer esto' });
        }
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};