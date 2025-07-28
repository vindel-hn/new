const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');
const sql = require('mssql');

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    const q = req.query.q ? req.query.q.trim() : '';

    try {
        const pool = await poolPromise;
        let where = '';
        if (q) {
            where = `WHERE 
                (P.COD_PROD LIKE '%${q.replace(/'/g, "''")}%'
                OR P.DESCR LIKE '%${q.replace(/'/g, "''")}%'
                OR PL.DESCR LIKE '%${q.replace(/'/g, "''")}%')`;
        }

        const totalResult = await pool.request().query(`
            SELECT COUNT(*) AS total
            FROM PRODUCTS P
            LEFT JOIN PRODLINE PL ON P.COD_LINE = PL.COD_LINE
            ${where}
        `);
        const total = totalResult.recordset[0].total;
        const totalPages = Math.ceil(total / limit);

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
                T.RATE AS TAX_PERCENT,
                P.PRECIO_FINAL
            FROM PRODUCTS P
            LEFT JOIN TAXLIST T ON P.COD_TAX = T.COD_TAX
            LEFT JOIN PRODLINE PL ON P.COD_LINE = PL.COD_LINE
            ORDER BY P.COD_PROD
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `);

        res.render('inventario/lista', {
            productos: result.recordset,
            usuario: req.session?.usuario || null,
            page,
            totalPages,
            q
        });
    } catch (err) {
        res.status(500).send('Error al obtener productos');
    }
});

router.get('/buscar', async (req, res) => {
    const q = req.query.q ? req.query.q.trim() : '';
    const limit = 50;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let where = '';
        if (q) {
            where = `WHERE 
                (P.COD_PROD LIKE '%${q.replace(/'/g, "''")}%'
                OR P.DESCR LIKE '%${q.replace(/'/g, "''")}%'
                OR PL.DESCR LIKE '%${q.replace(/'/g, "''")}%')`;
        }

        const result = await pool.request().query(`
            SELECT 
                P.COD_PROD,
                P.DESCR,
                PL.DESCR AS LINEA_DESCR,
                P.STOCK,
                P.COST_PROM,
                P.PRICE_PUB,
                T.RATE AS TAX_PERCENT,
                P.PRECIO_FINAL, 
                P.DATE_LSALE
            FROM PRODUCTS P
            LEFT JOIN TAXLIST T ON P.COD_TAX = T.COD_TAX
            LEFT JOIN PRODLINE PL ON P.COD_LINE = PL.COD_LINE
            ${where}
            ORDER BY P.COD_PROD
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
        `);

        res.json({ productos: result.recordset });
    } catch (err) {
        res.status(500).json({ error: 'Error al buscar productos' });
    }
});

// NUEVO PRODUCTO - ENVÍA lineas e isv
router.get('/nuevo', async (req, res) => {
    try {
        const pool = await poolPromise;
        const isvResult = await pool.request().query('SELECT COD_TAX, DESCR FROM TAXLIST');
        const lineasResult = await pool.request().query('SELECT COD_LINE, DESCR FROM PRODLINE');
        res.render('inventario/nuevo_parcial', {
            layout: false,
            isv: isvResult.recordset,
            lineas: lineasResult.recordset
        });
    } catch (err) {
        res.status(500).send('Error al cargar el formulario');
    }
});

// UNIFICADA: Solo una ruta para editar
router.get('/editar/:codigo', async (req, res) => {
    try {
        const pool = await poolPromise;
        const codigo = req.params.codigo;
        const productoResult = await pool.request().query(`
            SELECT P.*, T.RATE AS TAX_PERCENT
            FROM PRODUCTS P
            LEFT JOIN TAXLIST T ON P.COD_TAX = T.COD_TAX
            WHERE P.COD_PROD = '${codigo}'
        `);
        const taxResult = await pool.request().query('SELECT COD_TAX, DESCR FROM TAXLIST');
        const lineResult = await pool.request().query('SELECT COD_LINE, DESCR FROM PRODLINE');
        if (req.query.partial) {
            res.render('inventario/editar_parcial', {
                layout: false,
                producto: productoResult.recordset[0],
                taxList: taxResult.recordset,
                lineList: lineResult.recordset
            });
        } else {
            res.render('inventario/editar', {
                producto: productoResult.recordset[0],
                taxList: taxResult.recordset,
                lineList: lineResult.recordset
            });
        }
    } catch (err) {
        res.status(500).send('Error al cargar el producto');
    }
});

router.post('/editar/:codigo', async (req, res) => {
    try {
        const pool = await poolPromise;
        const codigo = req.params.codigo;
        const { nombre, linea, isv, cantidad, costo_unitario, precio } = req.body;

        const taxResult = await pool.request()
            .input('cod_tax', isv)
            .query('SELECT RATE FROM TAXLIST WHERE COD_TAX = @cod_tax');
        const isvPercent = taxResult.recordset[0]?.RATE || 0;

        const precioNum = Number(precio);
        const precioFinal = precioNum + (precioNum * isvPercent / 100);

        await pool.request()
            .input('nombre', nombre)
            .input('linea', linea)
            .input('isv', isv)
            .input('cantidad', cantidad)
            .input('costo_unitario', costo_unitario)
            .input('precio', precio)
            .input('precio_final', precioFinal)
            .input('codigo', codigo)
            .query(`
                UPDATE PRODUCTS
                SET DESCR = @nombre,
                    COD_LINE = @linea,
                    COD_TAX = @isv,
                    STOCK = @cantidad,
                    COST_PROM = @costo_unitario,
                    PRICE_PUB = @precio,
                    PRECIO_FINAL = @precio_final
                WHERE COD_PROD = @codigo
            `);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ ok: true });
        }

        res.redirect('/inventario');
    } catch (err) {
        res.status(500).send('Error al actualizar el producto');
    }
});

router.post('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { codigo, nombre, linea, isv, cantidad, costo_unitario, precio } = req.body;

        const numRegResult = await pool.request().query('SELECT ISNULL(MAX(NUM_REG), 0) + 1 AS nextNumReg FROM PRODUCTS');
        const nextNumReg = numRegResult.recordset[0].nextNumReg;

        const cantidadNum = Number(cantidad);
        const cantidadFinal = isNaN(cantidadNum) ? 0 : cantidadNum;

        const taxResult = await pool.request()
            .input('cod_tax', isv)
            .query('SELECT RATE FROM TAXLIST WHERE COD_TAX = @cod_tax');
        const isvPercent = taxResult.recordset[0]?.RATE || 0;

        const precioNum = Number(precio);
        const precioFinal = precioNum + (precioNum * isvPercent / 100);

        const existe = await pool.request()
            .input('codigo', codigo)
            .query('SELECT 1 FROM PRODUCTS WHERE COD_PROD = @codigo');
        if (existe.recordset.length > 0) {
            return res.status(400).json({ error: ' Oyoy! El código de producto ya existe.' });
        }

        await pool.request()
            .input('num_reg', nextNumReg)
            .input('codigo', codigo)
            .input('nombre', nombre)
            .input('linea', linea)
            .input('isv', isv)
            .input('cantidad', cantidadFinal)
            .input('costo_unitario', costo_unitario)
            .input('status', 'A')
            .input('precio', precio)
            .input('precio_final', precioFinal)
            .input('sdescr', '')
            .input('uni_me', '')
            .input('cod_tax_x', 0)
            .input('stock_min', 0)
            .input('stock_max', 0)
            .input('date_lsale', null)
            .input('type_prod', 'N')
            .input('weight', 0)
            .input('volum', 0)
            .input('acu_sale_c', 0)
            .input('acu_sale_m', 0)
            .input('unit', 0)
            .input('prt_idx', 0)
            .input('cod_msr', 0)
            .input('date_lpurc', null)
            .input('cod_msr_d', 0)
            .input('pict', sql.Image, null)
            .input('unit_d', 0)
            .input('str_pos', '')
            .input('usr_cre', 0)
            .input('usr_mod', 0)
            .input('cf_int_1', 0)
            .input('cf_int_2', 0)
            .input('cf_curr_1', 0)
            .input('cf_curr_2', 0)
            .input('cf_str_1', '')
            .input('cf_str_2', '')
            .input('cf_date_1', null)
            .input('cf_date_2', null)
            .input('comm_rate', 0)
            .input('cod_cat', 0)
            .input('prof_mrg', 0)
            .input('mov_int_o', 0)
            .query(`
                INSERT INTO PRODUCTS (
                    NUM_REG, COD_PROD, DESCR, COD_LINE, COD_TAX, STOCK, COST_PROM, PRICE_PUB, STATUS,
                    SDESCR, UNI_ME, COD_TAX_X, STOCK_MIN, STOCK_MAX, DATE_LSALE, TYPE_PROD, WEIGHT, VOLUM,
                    ACU_SALE_C, ACU_SALE_M, UNIT, PRT_IDX, COD_MSR, DATE_LPURC, COD_MSR_D, PICT, UNIT_D,
                    STR_POS, USR_CRE, USR_MOD, CF_INT_1, CF_INT_2, CF_CURR_1, CF_CURR_2, CF_STR_1, CF_STR_2,
                    CF_DATE_1, CF_DATE_2, COMM_RATE, COD_CAT, PROF_MRG, MOV_INT_O, PRECIO_FINAL
                ) VALUES (
                    @num_reg, @codigo, @nombre, @linea, @isv, @cantidad, @costo_unitario, @precio, @status,
                    @sdescr, @uni_me, @cod_tax_x, @stock_min, @stock_max, @date_lsale, @type_prod, @weight, @volum,
                    @acu_sale_c, @acu_sale_m, @unit, @prt_idx, @cod_msr, @date_lpurc, @cod_msr_d, @pict, @unit_d,
                    @str_pos, @usr_cre, @usr_mod, @cf_int_1, @cf_int_2, @cf_curr_1, @cf_curr_2, @cf_str_1, @cf_str_2,
                    @cf_date_1, @cf_date_2, @comm_rate, @cod_cat, @prof_mrg, @mov_int_o, @precio_final
                )
            `);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ ok: true });
        }

        res.redirect('/inventario');
    } catch (err) {
        console.error('Error al crear el producto:', err);
        res.status(500).send('Error al crear el producto');
    }
});

router.post('/eliminar/:codigo', async (req, res) => {
    const codigo = req.params.codigo;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('codigo', sql.VarChar, codigo)
            .query('DELETE FROM PRODUCTS WHERE COD_PROD = @codigo');
        res.sendStatus(200);
    } catch (err) {
        console.error('Error al eliminar:', err);
        res.status(500).send('Error al eliminar el producto');
    }
});

router.get('/buscar-productos', async (req, res) => {
    const q = req.query.q ? req.query.q.trim() : '';
    try {
        const pool = await poolPromise;
        let where = '';
        if (q) {
            where = `WHERE 
                (P.COD_PROD LIKE '%${q.replace(/'/g, "''")}%'
                OR P.DESCR LIKE '%${q.replace(/'/g, "''")}%')`;
        }
        const result = await pool.request().query(`
            SELECT TOP 10
                P.COD_PROD,
                P.DESCR
            FROM PRODUCTS P
            ${where}
            ORDER BY P.COD_PROD
        `);
        res.json({ productos: result.recordset });
    } catch (err) {
        res.status(500).json({ error: 'Error al buscar productos' });
    }
});

router.post('/guardar-nuevos-productos', async (req, res) => {
    const productos = req.body.productos;
    if (!Array.isArray(productos) || productos.length === 0) {
        return res.json({ ok: false, error: 'No hay productos para guardar.' });
    }
    try {
        const pool = await poolPromise;
        let numRegResult = await pool.request().query('SELECT ISNULL(MAX(NUM_REG), 0) AS lastNumReg FROM PRODUCTS');
        let nextNumReg = numRegResult.recordset[0].lastNumReg;

        for (const prod of productos) {
            nextNumReg++; // Incrementa para cada producto nuevo

            // Calcula el precio final
            const isvPercent = parseFloat(prod.isv) || 0;
            const precioPub = parseFloat(prod.precio) || 0;
            const precioFinal = precioPub + (precioPub * isvPercent / 100);

            await pool.request()
                .input('NUM_REG', nextNumReg)
                .input('COD_PROD', prod.codigo)
                .input('DESCR', prod.nombre)
                .input('COD_LINE', prod.linea)
                .input('COD_TAX', prod.isv)
                .input('STOCK', prod.cantidad)
                .input('COST_PROM', prod.costo_unitario)
                .input('PRICE_PUB', prod.precio)
                .input('PRECIO_FINAL', precioFinal) // <-- Nuevo campo
                .input('STATUS', 'A')
                .input('TYPE_PROD', 'N')
                .query(`
                    INSERT INTO PRODUCTS (NUM_REG, COD_PROD, DESCR, COD_LINE, COD_TAX, STOCK, COST_PROM, PRICE_PUB, PRECIO_FINAL, STATUS, TYPE_PROD)
                    VALUES (@NUM_REG, @COD_PROD, @DESCR, @COD_LINE, @COD_TAX, @STOCK, @COST_PROM, @PRICE_PUB, @PRECIO_FINAL, @STATUS, @TYPE_PROD)
                `);
        }
        res.json({ ok: true });
    } catch (err) {
        res.json({ ok: false, error: err.message });
    }
});

// Verifica si el código de producto ya existe
router.get('/existe-codigo/:codigo', async (req, res) => {
    const codigo = req.params.codigo;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('codigo', codigo)
            .query('SELECT 1 FROM PRODUCTS WHERE COD_PROD = @codigo');
        res.json({ existe: result.recordset.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Error al verificar código' });
    }
});

router.post('/guardar-ingresos', async (req, res) => {
    const ingresos = req.body.ingresos;
    if (!Array.isArray(ingresos) || ingresos.length === 0) {
        return res.json({ ok: false, error: 'No hay ingresos para guardar.' });
    }
    try {
        const pool = await poolPromise;
        for (const ing of ingresos) {
            console.log('Ingreso recibido:', ing); // <-- LOG
            const result = await pool.request()
                .input('cantidad', ing.cantidad)
                .input('codigo', ing.codigo)
                .query(`
                    UPDATE PRODUCTS
                    SET STOCK = STOCK + @cantidad
                    WHERE COD_PROD = @codigo
                `);
            console.log('Filas afectadas:', result.rowsAffected);
        }
        res.json({ ok: true });
    } catch (err) {
        res.json({ ok: false, error: err.message });
    }
});

module.exports = router;
