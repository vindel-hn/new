const Producto = require('../models/Producto');

exports.listarProductos = async (req, res) => {
  try {
    const productos = await Producto.find().sort({ nombre: 1 });
    res.render('inventario/lista', { 
      productos, // Asegúrate de pasar este array
      usuario: req.session.usuario,
      rutaActual: '/inventario'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener productos');
  }
};

// En controllers/inventarioController.js
exports.mostrarFormularioNuevo = (req, res) => {
    if (!req.session.sesionIniciada) {
        return res.redirect('/inicio-sesion');
    }
    res.render('inventario/nuevo', { 
        usuario: req.session.usuario,
        rutaActual: '/inventario',
        error: null
    });
};



exports.crearProducto = async (req, res) => {
  if (!req.session.sesionIniciada) {
    return res.redirect('/inicio-sesion');
  }

  const { codigo, nombre, cantidad, linea, unidadMedida, marca, precioPublico, impuesto, costo } = req.body;
  
  try {
    const nuevoProducto = new Producto({
      codigo,
      nombre,
      cantidad: parseFloat(cantidad),
      linea,
      unidadMedida,
      marca,
      precioPublico: parseFloat(precioPublico),
      impuesto,
      costo: parseFloat(costo)
    });

    await nuevoProducto.save();
    
    // Redirigir a la lista con mensaje de éxito
    req.session.mensaje = {
      tipo: 'exito',
      texto: 'Producto creado correctamente'
    };
    res.redirect('/inventario');
    
  } catch (error) {
    console.error('Error al crear producto:', error);
    
    // Mostrar el formulario nuevamente con errores
    res.render('inventario/nuevo', {
      usuario: req.session.usuario,
      rutaActual: '/inventario',
      error: error.message || 'Error al guardar el producto',
      producto: req.body // Mantener los valores ingresados
    });
  }
};

exports.mostrarFormularioEditar = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    res.render('inventario/editar', { 
    producto,
    usuario: req.session.usuario,
    rutaActual: '/inventario'
});
  } catch (error) {
    console.error(error);
    res.redirect('/inventario');
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    await Producto.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/inventario');
  } catch (error) {
    console.error(error);
    res.render('inventario/editar', { 
      producto: req.body,
      error: 'Error al actualizar el producto'
    });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.redirect('/inventario');
  } catch (error) {
    console.error(error);
    res.redirect('/inventario');
  }
};

exports.apiListarProductos = async (req, res) => {
    const filtro = {};
    if (req.query.codigo) filtro.codigo = req.query.codigo;
    const productos = await Producto.find(filtro);
    res.json(productos);
};

const Pedido = require('../models/Pedido');

// Mostrar formulario de nuevo pedido
exports.mostrarFormularioNuevoPedido = (req, res) => {
    const fechaActual = new Date().toISOString().split('T')[0];
    res.render('inventario/nuevo-pedido', {
        usuario: req.session.usuario,
        rutaActual: '/pedidos',
        fechaActual
    });
};

// Crear pedido
exports.crearPedido = async (req, res) => {
    try {
        const pedido = new Pedido(req.body);
        await pedido.save();
        res.redirect('/inventario/pedidos');
    } catch (error) {
        console.error(error);
        res.render('inventario/pedidos', {
            usuario: req.session.usuario,
            rutaActual: '/pedidos',
            error: error.message,
            ...req.body
        });
    }
};
//Eliminar pedido
exports.eliminarPedido = async (req, res) => {
    try {
        await Pedido.findByIdAndDelete(req.params.id);
        res.status(200).send('Pedido eliminado');
    } catch (error) {
        res.status(500).send('Error al eliminar pedido');
    }
};
// Listar pedidos
exports.listarPedidos = async (req, res) => {
    const pedidos = await Pedido.find().sort({ fecha: -1 });
    res.render('inventario/listaPedidos', {
        usuario: req.session.usuario,
        rutaActual: '/pedidos', // <-- Así el menú "Pedidos" se activa
        pedidos
    });
};

// Mostrar formulario para editar pedido
exports.mostrarFormularioEditarPedido = async (req, res) => {
    const pedido = await Pedido.findById(req.params.id);
    res.render('inventario/pedidos', {
        usuario: req.session.usuario,
        rutaActual: '/pedidos', // <-- Aquí también
        ...pedido.toObject()
    });
};

// Actualizar pedido
exports.actualizarPedido = async (req, res) => {
    try {
        await Pedido.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/inventario/pedidos');
    } catch (error) {
        console.error(error);
        res.render('inventario/pedidos', {
            usuario: req.session.usuario,
            rutaActual: '/pedidos',
            error: error.message,
            ...req.body
        });
    }
};