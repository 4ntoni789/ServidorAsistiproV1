const prorrogaContrato = require('./prorrogaContrato');
const contratosPorVencer = (datos) => {
    const hoy = new Date();
    const diasAviso = 45;

    const contratos = datos
        .filter(c =>
            c.estado === 'Activo' &&
            c.fecha_fin &&
            c.tipo_contrato !== 'Indefinido'
        )
        .map(c => {
            const fechaFin = new Date(c.fecha_fin);
            const dias_restantes = Math.floor((fechaFin - hoy) / (1000 * 60 * 60 * 24)) + 1;
            return {
                ...c,
                dias_restantes
            };
        });

    const proximosAVencer = contratos.filter(c => {
        if (c.dias_restantes >= 0 && c.dias_restantes <= diasAviso) {
            if (c.dias_restantes === 0 && c.cantidad_prorrogas < 4) {
                prorrogaContrato(c.id_contrato, null);
            }
            return c
        }
    });
    const vencidos = contratos.filter(c => c.dias_restantes < 0);

    console.log('📌 Contratos activos próximos a vencer: ', proximosAVencer);
    console.log('📌 Contratos vencidos: ', vencidos);

    return {
        proximosAVencer,
        vencidos
    };
}

module.exports = contratosPorVencer;
