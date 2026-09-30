require('dotenv').config();
const sql = require('mssql');


const config = {
    user: `${process.env.USER}`,
    password: `${process.env.PASS}`,
    server: `${process.env.SERVER}`,
    database: `${process.env.DATA_BASE}`,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('🟢 Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error al conectar a SQL Server', err);
    });

module.exports = {
    sql,
    config,
    poolPromise
};