const agruparPorAnio = (datos) => {
  const grupos = {};

  datos.forEach((registro) => {
    const anio = new Date(registro.fecha).getFullYear();
    const key = `${registro.numero_empleado}-${anio}`;

    if (!grupos[key]) {
      grupos[key] = {
        anio,
        nombre_usuario: registro.nombre_usuario,
        numero_empleado: registro.numero_empleado,
        registros: [],
      };
    }

    grupos[key].registros.push({
      nombre_dispositivo: registro.nombre_dispositivo,
      fecha: registro.fecha,
      dia_semana: registro.dia_semana,
      registros: registro.registros,
    });
  });

  return Object.values(grupos);
};



module.exports = agruparPorAnio;