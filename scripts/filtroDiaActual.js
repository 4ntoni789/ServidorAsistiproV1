const filtrarRegistrosDeHoy = (registros) => {
  const hoy = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
  const grupos = {};

  registros.forEach((registro) => {
    const fecha = new Date(registro.fecha_hora_autenticacion).toISOString().split("T")[0];
    if (fecha !== hoy) return;

    const key = `${registro.numero_empleado}-${fecha}`;

    if (!grupos[key]) {
      grupos[key] = {
        numero_empleado: registro.numero_empleado,
        nombre_persona: registro.nombre_persona,
        fecha,
        registros: [],
      };
    }

    grupos[key].registros.push({
      horaCompleta: registro.fecha_hora_autenticacion,
      nombre_control: registro.nombre_control, 
    });
  });

  return Object.values(grupos).map((grupo) => {
    grupo.registros.sort((a, b) => new Date(a.horaCompleta) - new Date(b.horaCompleta));

    grupo.registros = grupo.registros.map((r) => {
      const hora = new Date(r.horaCompleta).toISOString().split("T")[1].substring(0, 5);
      const [horaNum, minutos] = hora.split(":").map(Number);
      const totalMin = horaNum * 60 + minutos;

      let tipoFinal = "desconocido";
      if (totalMin >= 480 && totalMin <= 540) tipoFinal = "entrada";
      else if (totalMin >= 720 && totalMin <= 780) tipoFinal = "salida_almuerzo";
      else if (totalMin >= 780 && totalMin <= 840) tipoFinal = "entrada_almuerzo";
      else if (totalMin >= 1020 && totalMin <= 1080) tipoFinal = "salida";

      return {
        tipo: tipoFinal,
        hora,
        nombre_control: r.nombre_controli,
      };
    });

    return grupo;
  });
};


module.exports = filtrarRegistrosDeHoy;