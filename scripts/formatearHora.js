function formatearHoraLocal(fecha) {
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return "";

  return fecha.toISOString().substring(11, 19); // HH:MM:SS sin cambiar la zona
}

module.exports = formatearHoraLocal;