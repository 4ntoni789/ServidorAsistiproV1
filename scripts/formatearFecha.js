const obtenerFecha = (fechaHora)=>{
    const fechaCompleta = new Date(fechaHora);
    const fecha = fechaCompleta.toISOString().split('T')[0];
    return fecha;
}

module.exports = obtenerFecha;