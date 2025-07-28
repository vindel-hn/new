require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');

const app = express();

// Configuración
const PUERTO = process.env.PUERTO || 3000;
const USUARIO_MAESTRO = process.env.USUARIO_MAESTRO || 'admin';
const CONTRASENA_MAESTRA = process.env.CONTRASENA_MAESTRA || 'COSMERN54';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secreto_cosmern_pos',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Esto es lo importante:
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
    if (req.session.sesionIniciada) {
        res.redirect('/panel');
    } else {
        res.redirect('/inicio-sesion');
    }
});

app.get('/inicio-sesion', (req, res) => {
    if (req.session.sesionIniciada) {
        res.redirect('/panel');
    } else {
        res.render('inicio-sesion', { error: null });
    }
});

app.post('/inicio-sesion', (req, res) => {
    const { usuario, contrasena } = req.body;
    
    if (usuario === USUARIO_MAESTRO && contrasena === CONTRASENA_MAESTRA) {
        req.session.sesionIniciada = true;
        req.session.usuario = usuario;
        res.redirect('/panel');
    } else {
        res.render('inicio-sesion', { error: 'Credenciales inválidas' });
    }
});
// Ruta del panel
app.get('/panel', (req, res) => {
    if (req.session.sesionIniciada) {
        res.render('panel', { 
            usuario: req.session.usuario,
            rutaActual: '/panel'
        });
    } else {
        res.redirect('/inicio-sesion');
    }
});

// Ruta del inventario
// Elimina o comenta esta ruta, ya que la manejas en inventarioRoutes
// app.get('/inventario', (req, res) => {
//     if (req.session.sesionIniciada) {
//         res.render('inventario/lista', {
//             usuario: req.session.usuario,
//             rutaActual: '/inventario',
//             productos: [] // Asegúrate de pasar los productos aquí
//         });
//     } else {
//         res.redirect('/inicio-sesion');
//     }
// });


app.get('/cerrar-sesion', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/inicio-sesion');
    });
});

// Configurar method-override para PUT/DELETE
app.use(methodOverride('_method'));

// Importar rutas de inventario
const inventarioRoutes = require('./routes/inventarioRoutes');
app.use('/inventario', inventarioRoutes);

app.post('/inventario/eliminar/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    // Aquí va la lógica para eliminar el producto de la base de datos
    // Si no tienes base de datos, solo haz:
    res.sendStatus(200);
});

// Iniciar servidor
app.listen(PUERTO, () => {
    console.log(`Cosmern POS ejecutándose en http://localhost:${PUERTO}`);
});

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_SERVER:', process.env.DB_SERVER);