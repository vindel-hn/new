const mongoose = require('mongoose');

const productoPedidoSchema = new mongoose.Schema({
  codigo: { type: String, required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precio: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 }
});

const pedidoSchema = new mongoose.Schema({
  numeroFactura: { type: String, required: true, unique: true },
  proveedor: { type: String, required: true },
  fecha: { type: Date, required: true },
  subTotal: { type: Number, required: true, min: 0 },
  isv: { type: String, enum: ['Exento', '12%', '15%', '18%'], required: true },
  totalFactura: { type: Number, required: true, min: 0 },
  productos: [productoPedidoSchema],
  creadoPor: { type: String }, // puedes guardar el usuario si lo deseas
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', pedidoSchema);