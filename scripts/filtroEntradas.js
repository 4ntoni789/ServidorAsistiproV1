const obtenerDiaDeLaSemana = require('./diaSemana');
const convertirHoraMinutos = require('./convertirHoraMinutos');
const formatearHoraLocal = require('./formatearHora');
const clasificarMarcaciones = require('../utils/clasificarMarcaciones');

const agruparRegistrosPorDia = (registros, horarios, informacionEmpleado) => {
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const totalRegistros = [];
  const grupos = {};
  const empleados = new Map();
  let fechaMinGlobal = null;
  let fechaMaxGlobal = null;

  registros.forEach((registro) => {
    const fechaObj = new Date(registro.fecha_hora_autenticacion);
    const fecha = fechaObj.toISOString().split("T")[0];

    if (!fechaMinGlobal || fechaObj < fechaMinGlobal) fechaMinGlobal = new Date(fecha);
    if (!fechaMaxGlobal || fechaObj > fechaMaxGlobal) fechaMaxGlobal = new Date(fecha);

    const dia_semana = diasSemana[fechaObj.getDay()];
    const key = `${registro.numero_empleado}-${fecha}-${registro.nombre_dispositivo}`;

    if (!grupos[key]) {
      grupos[key] = {
        numero_empleado: registro.numero_empleado,
        nombre_usuario: registro.nombre_persona,
        fecha,
        dia_semana,
        id_cargo: registro.id_cargo,
        id_pv: registro.id_pv,
        nombre_dispositivo: registro.nombre_dispositivo,
        registros: [],
        correo_enviado: registro.correo_enviado
        // id_registro: registro.id_registro
      };
    }

    grupos[key].registros.push({
      horaCompleta: registro.fecha_hora_autenticacion,
      id_registro: registro.id_registro
    });

    empleados.set(registro.numero_empleado, {
      numero_empleado: registro.numero_empleado,
      nombre_usuario: registro.nombre_persona,
      nombre_dispositivo: registro.nombre_dispositivo,
      id_cargo: registro.id_cargo,
      id_pv: registro.id_pv,
    });


    totalRegistros.push({
      numero_empleado: registro.numero_empleado,
      nombre_usuario: registro.nombre_persona,
      nombre_dispositivo: registro.nombre_dispositivo,
      id_cargo: registro.id_cargo,
      dia_semana: dia_semana,
      id_pv: registro.id_pv
    });
  });

  const resultadoFinal = [];
  empleados.forEach((infoEmpleado) => {
    const gruposEmpleado = [];
    const fechasExistentes = new Set();
    for (let fechaStr in grupos) {
      if (fechaStr.startsWith(infoEmpleado.numero_empleado + "-")) {
        const grupo = grupos[fechaStr];
        fechasExistentes.add(grupo.fecha);
        gruposEmpleado.push(grupo);
      }
    }

    const cursor = new Date(fechaMinGlobal);
    while (cursor <= fechaMaxGlobal) {
      const fechaStr = cursor.toISOString().split("T")[0];
      if (!fechasExistentes.has(fechaStr)) {
        gruposEmpleado.push({
          numero_empleado: infoEmpleado.numero_empleado,
          nombre_usuario: infoEmpleado.nombre_usuario,
          fecha: fechaStr,
          dia_semana: obtenerDiaDeLaSemana(fechaStr),
          id_pv: null,
          nombre_dispositivo: 'No marcado',
          registros: [{ tipo: "no_marcado", hora: "" }],
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    gruposEmpleado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    gruposEmpleado.forEach((grupo) => {
      const registrosConvertidos = grupo.registros
        .filter(r => r.horaCompleta)
        .map(r => {
          if (!r.horaCompleta) {
            console.error('Registro sin horaCompleta:', r);
            return r;
          }
          const { totalMin, hora } = convertirHoraMinutos(formatearHoraLocal(r.horaCompleta));
          return { ...r, totalMin, hora, id_pv: grupo.id_pv, id_cargo: grupo.id_cargo };
        });
      grupo.registros = registrosConvertidos.map((registro) => {
        const integridadMarcaciones = {
          entrada: null,
          salidaDescanso: null,
          entradaDescanso: null,
          salida: null
        };
        return clasificarMarcaciones(registro, grupo.dia_semana, horarios, registrosConvertidos,
          grupo.correo_enviado, informacionEmpleado, integridadMarcaciones)
      })
      resultadoFinal.push(grupo);
    });
  });


  return resultadoFinal;
};

module.exports = agruparRegistrosPorDia;