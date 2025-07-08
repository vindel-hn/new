const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Rutas para el inventario
router.get('/', inventarioController.listarProductos);
router.get('/nuevo', inventarioController.mostrarFormularioNuevo);
router.post('/', inventarioController.crearProducto);
router.get('/:id/editar', inventarioController.mostrarFormularioEditar);
router.put('/:id', inventarioController.actualizarProducto);
router.delete('/:id', inventarioController.eliminarProducto);


// Formularios y acciones para pedidos
router.get('/pedidos', inventarioController.listarPedidos);
router.get('/nuevo-pedido', inventarioController.mostrarFormularioNuevoPedido);
router.post('/pedidos', inventarioController.crearPedido);
router.get('/pedidos/:id/editar', inventarioController.mostrarFormularioEditarPedido);
router.put('/pedidos/:id', inventarioController.actualizarPedido);
router.delete('/pedidos/:id', inventarioController.eliminarPedido); // Agrega este para eliminar

// API para el dashboard
router.get('/api/productos', inventarioController.apiListarProductos);

module.exports = router;