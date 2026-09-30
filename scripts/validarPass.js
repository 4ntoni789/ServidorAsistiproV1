const validarPassword = (password) => {
    const errores = []

    if (password.length < 8) {
        errores.push('La contraseña debe tener al menos 8 caracteres.')
    }
    if (!/[A-Z]/.test(password)) {
        errores.push('Debe incluir al menos una letra mayúscula.')
    }
    if (!/[a-z]/.test(password)) {
        errores.push('Debe incluir al menos una letra minúscula.')
    }
    if (!/[0-9]/.test(password)) {
        errores.push('Debe incluir al menos un número.')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errores.push('Debe incluir al menos un carácter especial.')
    }
    if (!/^\S*$/.test(password)) {
        errores.push('No debe contener espacios.')
    }

    return errores
}

module.exports = validarPassword