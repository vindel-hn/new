// Crear un archivo seed.js en la raíz del proyecto
const mongoose = require('mongoose');
const Producto = require('./models/Producto');

mongoose.connect('mongodb://localhost:27017/cosmern_pos', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const productosEjemplo = [
  {
    codigo: 'ARROZ-001',
    nombre: 'Arroz 5 lbs',
    cantidad: 50,
    linea: 'Granos',
    unidadMedida: 'Bolsa',
    marca: 'Sula',
    precioPublico: 85.00,
    impuesto: 15,
    costo: 65.00
  },
  {
    codigo: 'FRIJ-002',
    nombre: 'Frijoles 2 lbs',
    cantidad: 30,
    linea: 'Granos',
    unidadMedida: 'Bolsa',
    marca: 'El Patrón',
    precioPublico: 60.50,
    impuesto: 15,
    costo: 45.00
  }
];

Producto.insertMany(productosEjemplo)
  .then(() => {
    console.log('Productos de ejemplo creados');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error al crear productos:', err);
    process.exit(1);
  });