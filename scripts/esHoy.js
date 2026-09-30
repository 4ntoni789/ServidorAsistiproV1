const esHoy = (fecha) => {
    const hoy = new Date();
    const fechaComparar = new Date(fecha);

    return (
        hoy.getFullYear() === fechaComparar.getFullYear() &&
        hoy.getMonth() === fechaComparar.getMonth() &&
        hoy.getDate() === fechaComparar.getDate()
    );
}


module.exports = esHoy;