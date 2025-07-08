const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, default: 0 },
  linea: { type: String, required: true },
  unidadMedida: { type: String, enum: ['Unidad', 'Caja'], required: true },
  marca: { type: String, required: true },
  precioPublico: { type: Number, required: true, min: 0 },
  impuesto: { type: String, enum: ['Exento','12%', '15%', '18%'], required: true },
  costo: { type: Number, required: true, min: 0 },
  margen: { type: Number },
  utilidad: { type: Number },
  fechaCreacion: { type: Date, default: Date.now }
});

// Calcular automáticamente margen y utilidad antes de guardar
productoSchema.pre('save', function(next) {
  if (this.precioPublico && this.costo) {
    this.utilidad = this.precioPublico - this.costo;
    this.margen = ((this.utilidad) / this.costo) * 100;
  }
  next();
});

module.exports = mongoose.model('Producto', productoSchema);