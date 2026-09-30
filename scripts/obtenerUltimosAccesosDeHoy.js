const formatearHoraLocal = require('./formatearHora')

const obtenerUltimosAccesosDeHoy = (registros) => {
  const hoy = new Date();

  
  const esHoy = (fecha) =>
    fecha.getDate() === hoy.getDate() &&
  fecha.getMonth() === hoy.getMonth() &&
  fecha.getFullYear() === hoy.getFullYear();
  
  return registros
  .filter((registro) => {
    if (!registro.fecha_hora_autenticacion) return false;
    
    const fecha = new Date(registro.fecha_hora_autenticacion);
    
      return esHoy(fecha);
    })
    .sort((a, b) =>
      new Date(b.fecha_hora_autenticacion) - new Date(a.fecha_hora_autenticacion)
    )
    .slice(0, 30)
    .map((registro) => {
      const fecha = new Date(registro.fecha_hora_autenticacion);
      // console.log(fecha.toLocaleDateString("es-CO"));
      return {
        ...registro,
        fecha: fecha.toLocaleDateString("es-CO"), // opcional, puedes dejar YYYY-MM-DD si prefieres
        hora: formatearHoraLocal(fecha), // HH:MM:SS
      };
    });
};

module.exports = obtenerUltimosAccesosDeHoy;
