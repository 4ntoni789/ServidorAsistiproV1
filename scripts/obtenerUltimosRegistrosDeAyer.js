const formatearHoraLocal = require('./formatearHora');

const obtenerUltimosAccesosDeAyer = (registros) => {
   const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);

  const esMismoDia = (fecha1, fecha2) =>
    fecha1.getDate() === fecha2.getDate() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getFullYear() === fecha2.getFullYear();

  return registros
    .filter((registro) => {
      if (!registro.fecha_hora_autenticacion) return false;

      const fecha = new Date(registro.fecha_hora_autenticacion);
      return esMismoDia(fecha, ayer);
    })
    .sort((a, b) =>
      new Date(b.fecha_hora_autenticacion) - new Date(a.fecha_hora_autenticacion)
    )
    .slice(0, 30)
    .map((registro) => {
      const fecha = new Date(registro.fecha_hora_autenticacion);
      return {
        ...registro,
        fecha: fecha.toLocaleDateString("es-CO"),
        hora: formatearHoraLocal(fecha),
      };
    });
};

module.exports = obtenerUltimosAccesosDeAyer;
