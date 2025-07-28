const { poolPromise } = require('../db');

async function obtenerProductos() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                P.COD_PROD,
                P.DESCR,
                P.UNI_ME,
                P.COD_LINE,
                PL.DESCR AS LINEA_DESCR,
                P.COST_PROM,
                P.PRICE_PUB,           
                P.COD_TAX,
                P.DATE_LSALE,
                P.STOCK,
                T.RATE AS TAX_PERCENT
            FROM PRODUCTS P
            LEFT JOIN TAXLIST T ON P.COD_TAX = T.COD_TAX
            LEFT JOIN PRODLINE PL ON P.COD_LINE = PL.COD_LINE
        `);
        return result.recordset;
    } catch (err) {
        console.error('Error al obtener productos:', err);
        return [];
    }
}

module.exports = { obtenerProductos };