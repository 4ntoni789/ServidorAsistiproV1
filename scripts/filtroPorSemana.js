const getSemanaISO=(fechaStr)=> {
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return null;

  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + 3 - ((fecha.getDay() + 6) % 7));
  const semana1 = new Date(fecha.getFullYear(), 0, 4);
  const diferencia = (fecha - semana1) / 86400000;
  const semana = Math.floor((diferencia + ((semana1.getDay() + 6) % 7)) / 7) + 1;

  return {
    anio: fecha.getFullYear(),
    semana
  };
}

const agruparPorSemana=(registrosPorDia)=> {
  const semanas = {};

  registrosPorDia.forEach(dia => {
    const fechaISO = dia.fecha ?? ""; // debería ser tipo '2025-05-21'
    const semanaInfo = getSemanaISO(fechaISO);

    if (!semanaInfo) {
      console.warn("Fecha inválida encontrada:", dia);
      return;
    }

    const key = `${dia.numero_empleado}-${semanaInfo.anio}-W${semanaInfo.semana}`;

    if (!semanas[key]) {
      semanas[key] = {
        numero_empleado: dia.numero_empleado,
        nombre_persona: dia.nombre_persona,
        anio: semanaInfo.anio,
        semana: semanaInfo.semana,
        registros: []
      };
    }

    semanas[key].registros.push({
      fecha: dia.fecha,
      registros: dia.registros
    });
  });

  return Object.values(semanas);
}


module.exports = agruparPorSemana;