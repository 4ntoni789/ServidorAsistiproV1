const convertirHoraMinutos = require('../scripts/convertirHoraMinutos');
const formatearHoraLocal = require('../scripts/formatearHora');
const obtenerFecha = require('../scripts/formatearFecha');
const esHoy = require('../scripts/esHoy');
const enviarEmail = require('./envioEmail');

/**
 * Clasifica una marcación individual en base a:
 * - su mejorCoincidencia detectada previamente (valorHorario, ventanas, etc.)
 * - su posición cronológica dentro de marcacionesCompletas (ordenadas por totalMin)
 * - el objeto integridadMarcaciones (opcional) para evitar duplicados por tipo dentro del mismo grupo
 *
 * NOTA: Para que la integridad persista entre marcaciones del mismo día/empleado,
 * debes crear `integridadMarcaciones` UNA VEZ por grupo en agruparRegistrosPorDia y pasarla
 * como último parámetro a esta función. Si no se pasa, se crea uno local (no persistente).
 */
const clasificarMarcaciones = (
    registro,
    dia,
    horarioResult,
    marcacionesCompletas,
    correoEnviado,
    informacionEmpleado,
    integridadMarcaciones // opcional: debe ser el mismo objeto por grupo para persistencia
) => {
    const pv = registro.id_pv;
    const cargo = registro.id_cargo;
    const min = registro.totalMin;
    const hora = registro.hora;
    const fecha = registro.horaCompleta;
    let diferenciaRest;

    if (!marcacionesCompletas || !marcacionesCompletas[0] || !marcacionesCompletas[0].totalMin) {
        return {
            hora,
            tipo: 'Sin horario',
            turno: null
        };
    }

    // asegurar integridad si no viene (compatibilidad)
    if (!integridadMarcaciones) {
        integridadMarcaciones = {
            entrada: null,
            salidaDescanso: null,
            entradaDescanso: null,
            salida: null
        };
    }

    // filtro horarios del día
    const horariosDelDia = horarioResult.filter(h =>
        h.id_pv == pv &&
        h.id_cargo == cargo &&
        h.dia_semana == dia
    );

    if (horariosDelDia.length === 0) {
        return {
            hora,
            tipo: 'Sin horario',
            turno: null
        };
    }

    const minPrimera = marcacionesCompletas[0].totalMin;
    const minUltima = marcacionesCompletas[marcacionesCompletas.length - 1].totalMin;
    let turnoDetectado = null;
    let menorDiferenciaTurno = Infinity;

    // detecto turno
    for (const h of horariosDelDia) {
        const entradaMin = convertirHoraMinutos(formatearHoraLocal(h.hora_entrada)).totalMin;
        const entradaValida = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_entrada)).totalMin;

        const salidaMin = convertirHoraMinutos(formatearHoraLocal(h.hora_salida)).totalMin;
        const salidaValida = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_salida)).totalMin;

        const diferencia = Math.abs(minPrimera - entradaMin);
        const entradaValidaDiferencia = Math.abs(minPrimera - entradaValida);

        const diferenciaSalida = Math.abs(minUltima - salidaMin);
        const salidaValidaDiferencia = Math.abs(minUltima - salidaValida);

        if ((entradaValidaDiferencia >= diferencia && diferencia < menorDiferenciaTurno)
            || (salidaValidaDiferencia >= diferenciaSalida && diferenciaSalida < menorDiferenciaTurno)) {
            menorDiferenciaTurno = diferencia;
            turnoDetectado = h.turno;
        } else if (diferencia >= entradaValidaDiferencia && turnoDetectado === null) {
            menorDiferenciaTurno = diferencia;
            turnoDetectado = h.turno;
        }
    }

    const horariosDelTurno = horariosDelDia.filter(h => h.turno === turnoDetectado);
    let horarioFormateado;

    // busco mejorCoincidencia (igual que antes)
    let mejorCoincidencia = null;
    let menorDiferencia = Infinity;

    for (const h of horariosDelTurno) {
        const margen = h.margen;
        const entradaValida = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_entrada)).totalMin;
        const entradaValidaHasta = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_entrada_hasta)).totalMin;
        const salidaValida = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_salida)).totalMin;
        const salidaValidaHasta = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_salida_hasta)).totalMin;

        const salidaAlmuerzo = convertirHoraMinutos(formatearHoraLocal(h.hora_salida_descanso)).totalMin;
        const salidaValidaDescanso = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_salida_descanso)).totalMin;
        const salidaValidaDescansoHasta = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_salida_descanso_hasta)).totalMin;

        const entradaAlmuerzo = convertirHoraMinutos(formatearHoraLocal(h.hora_regreso_descanso)).totalMin;
        const entradaValidaDescanso = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_regreso_descanso)).totalMin;
        const entradaValidaDescansoHasta = convertirHoraMinutos(formatearHoraLocal(h.hora_valida_regreso_descanso_hasta)).totalMin;

        horarioFormateado = {
            dia_semana: h.dia_semana,
            margen: h.margen,
            entrada: formatearHoraLocal(h.hora_entrada),
            entradaValida: formatearHoraLocal(h.hora_valida_entrada),
            entradaValidaHasta: formatearHoraLocal(h.hora_valida_entrada_hasta),
            salida: formatearHoraLocal(h.hora_salida),
            salidaValida: formatearHoraLocal(h.hora_valida_salida),
            salidaValidaHasta: formatearHoraLocal(h.hora_valida_salida_hasta),
            salidaAlmuerzo: formatearHoraLocal(h.hora_salida_descanso),
            salidaValidaDescanso: formatearHoraLocal(h.hora_valida_salida_descanso),
            salidaValidaDescansoHasta: formatearHoraLocal(h.hora_valida_salida_descanso_hasta),
            entradaAlmuerzo: formatearHoraLocal(h.hora_regreso_descanso),
            entradaValidaDescanso: formatearHoraLocal(h.hora_valida_regreso_descanso),
            entradaValidaDescansoHasta: formatearHoraLocal(h.hora_valida_regreso_descanso_hasta)
        };

        const puntos = [
            { tipo: 'Entrada', valor: convertirHoraMinutos(formatearHoraLocal(h.hora_entrada)).totalMin },
            { tipo: 'Salida de almuerzo', valor: convertirHoraMinutos(formatearHoraLocal(h.hora_salida_descanso)).totalMin },
            { tipo: 'Entrada de almuerzo', valor: convertirHoraMinutos(formatearHoraLocal(h.hora_regreso_descanso)).totalMin },
            { tipo: 'Salida', valor: convertirHoraMinutos(formatearHoraLocal(h.hora_salida)).totalMin }
        ];

        for (const p of puntos) {
            const diferencia = Math.abs(min - p.valor);

            if (diferencia < menorDiferencia) {
                menorDiferencia = diferencia;
                diferenciaRest = diferencia;

                // caso especial primera marcación
                if (marcacionesCompletas[0].horaCompleta.getTime() === registro.horaCompleta.getTime()) {
                    const entradaMin = convertirHoraMinutos(formatearHoraLocal(h.hora_entrada)).totalMin;
                    diferenciaRest = Math.abs(minPrimera - entradaMin);
                    mejorCoincidencia = {
                        tipo: 'Entrada',
                        valorHorario: convertirHoraMinutos(formatearHoraLocal(h.hora_entrada)).totalMin,
                        margen,
                        entradaValida,
                        entradaValidaHasta,
                        salidaValida,
                        salidaValidaHasta,
                        salidaAlmuerzo,
                        salidaValidaDescanso,
                        salidaValidaDescansoHasta,
                        entradaAlmuerzo,
                        entradaValidaDescanso,
                        entradaValidaDescansoHasta,
                        turno: h.turno,
                        fecha: registro.horaCompleta,
                        id_registro: registro.id_registro
                    };
                } else {
                    mejorCoincidencia = {
                        tipo: p.tipo,
                        valorHorario: p.valor,
                        margen,
                        entradaValida,
                        entradaValidaHasta,
                        salidaValida,
                        salidaValidaHasta,
                        salidaAlmuerzo,
                        salidaValidaDescanso,
                        salidaValidaDescansoHasta,
                        entradaAlmuerzo,
                        entradaValidaDescanso,
                        entradaValidaDescansoHasta,
                        turno: h.turno,
                        fecha: registro.horaCompleta,
                        id_registro: registro.id_registro
                    };
                }
            }
        }
    } // end for horariosDelTurno

    // Si hay mejorCoincidencia, aplico clasificación por posición + ventanas + integridad
    if (mejorCoincidencia) {
        let tipoFinal = mejorCoincidencia.tipo;

        // chequeo rápido fuera de horario general
        if (min < mejorCoincidencia.entradaValida || min > mejorCoincidencia.salidaValidaHasta) {
            tipoFinal = 'fuera de horario';
        } else {
            // Ordeno temporalmente las marcaciones por totalMin para obtener posición cronológica
            const ordenadas = [...marcacionesCompletas].sort((a, b) => a.totalMin - b.totalMin);

            // busco índice exacto del registro actual dentro de ordenadas (id_registro + horaCompleta)
            const idx = ordenadas.findIndex(m => {
                const sameId = String(m.id_registro) === String(registro.id_registro);
                const timeA = m.horaCompleta && m.horaCompleta.getTime ? m.horaCompleta.getTime() : String(m.horaCompleta);
                const timeB = registro.horaCompleta && registro.horaCompleta.getTime ? registro.horaCompleta.getTime() : String(registro.horaCompleta);
                return sameId && timeA === timeB;
            });

            const len = ordenadas.length;

            // helper ventana
            const inWindow = (val, from, to) => (typeof from === 'number' && typeof to === 'number') ? (val >= from && val <= to) : false;

            // determino candidato basado en posición
            let candidato = null; // 'entrada'|'salida'|'salidaDescanso'|'entradaDescanso'|null

            if (idx === 0) {
                candidato = 'entrada';
            } else if (idx === len - 1 && min >= mejorCoincidencia.salidaValida) {
                // candidato salida, pero validar que no sea un descanso previamente detectado
                candidato = 'salida';
            } else if (idx > 0) {
                // prioridad a ventanas de descanso/regreso
                if (inWindow(min, mejorCoincidencia.salidaValidaDescanso, mejorCoincidencia.salidaValidaDescansoHasta)) {
                    candidato = 'salidaDescanso';
                } else if (inWindow(min, mejorCoincidencia.entradaValidaDescanso, mejorCoincidencia.entradaValidaDescansoHasta)) {
                    candidato = 'entradaDescanso';
                } else {
                    // decidir por proximidad a salidaAlmuerzo vs entradaAlmuerzo
                    const diffSalidaAlm = Math.abs(min - (mejorCoincidencia.salidaAlmuerzo || Infinity));
                    const diffEntradaAlm = Math.abs(min - (mejorCoincidencia.entradaAlmuerzo || Infinity));
                    candidato = diffSalidaAlm <= diffEntradaAlm ? 'salidaDescanso' : 'entradaDescanso';
                }
            } else {
                candidato = null;
            }

            // si no se pudo decidir, marcar desconocida
            if (!candidato) {
                tipoFinal = 'Desconocida';
            } else {
                // si ya existe una marcación guardada para ese tipo en integridad -> duplicado
                if (integridadMarcaciones[candidato] !== null) {
                    tipoFinal = 'Desconocida';
                } else {
                    // Primera vez para este tipo → aplico validaciones y guardo en integridad
                    if (candidato === 'entrada') {
                        integridadMarcaciones.entrada = { i: idx, id: registro.id_registro, registro };
                        if (min < mejorCoincidencia.valorHorario - mejorCoincidencia.margen) {
                            tipoFinal = 'Entrada temprano';
                        } else if (min > mejorCoincidencia.valorHorario + mejorCoincidencia.margen) {
                            tipoFinal = 'Entrada tarde';
                            if (esHoy(fecha) && correoEnviado == 0) {
                                enviarEmail(informacionEmpleado, registro, horarioFormateado, 'entradar-tarde');
                            }
                        } else {
                            tipoFinal = 'Entrada normal';
                        }
                    } else if (candidato === 'salida') {
                        // importante: si esta marca ya corresponde a un descanso (por posicion intermedia
                        // anteriormente) no la sobreescribimos; aquí candidato === 'salida' solo cuando idx === len-1
                        // guardamos y validamos temprana/normal
                        integridadMarcaciones.salida = { i: idx, id: registro.id_registro, registro };

                        if (min < mejorCoincidencia.valorHorario - mejorCoincidencia.margen) {
                            tipoFinal = 'Salida temprana';
                        } else {
                            tipoFinal = 'Salida';
                        }

                    } else if (candidato === 'salidaDescanso') {
                        // ventana valida?
                        if (mejorCoincidencia.salidaValidaDescanso !== undefined && mejorCoincidencia.salidaValidaDescansoHasta !== undefined) {
                            if (inWindow(min, mejorCoincidencia.salidaValidaDescanso, mejorCoincidencia.salidaValidaDescansoHasta)) {
                                integridadMarcaciones.salidaDescanso = { i: idx, id: registro.id_registro, registro };
                                tipoFinal = 'Salida de almuerzo';
                            } else {
                                tipoFinal = 'Desconocida';
                            }
                        } else {
                            integridadMarcaciones.salidaDescanso = { i: idx, id: registro.id_registro, registro };
                            tipoFinal = 'Salida de almuerzo';
                        }
                    } else if (candidato === 'entradaDescanso') {
                        if (mejorCoincidencia.entradaValidaDescanso !== undefined && mejorCoincidencia.entradaValidaDescansoHasta !== undefined) {
                            if (inWindow(min, mejorCoincidencia.entradaValidaDescanso, mejorCoincidencia.entradaValidaDescansoHasta)) {
                                integridadMarcaciones.entradaDescanso = { i: idx, id: registro.id_registro, registro };
                                tipoFinal = 'Entrada de almuerzo';
                            } else {
                                tipoFinal = 'Desconocida';
                            }
                        } else {
                            integridadMarcaciones.entradaDescanso = { i: idx, id: registro.id_registro, registro };
                            tipoFinal = 'Entrada de almuerzo';
                        }
                    }
                } // end else primera vez para tipo
            } // end else candidato existente
        } // end else fuera de horario check

        // última verificación: si por chequeo inicial quedó fuera de horario, mantenerlo
        if (min < mejorCoincidencia.entradaValida || min > mejorCoincidencia.salidaValidaHasta) {
            tipoFinal = 'fuera de horario';
        }

        return {
            diferenciaRest,
            hora,
            tipo: tipoFinal,
            turno: mejorCoincidencia.turno,
            horario: horarioFormateado
        };
    } // end if mejorCoincidencia

    return {
        hora,
        tipo: 'No clasificado',
        turno: turnoDetectado
    };
};

module.exports = clasificarMarcaciones;
