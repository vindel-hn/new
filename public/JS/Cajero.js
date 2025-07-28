document.addEventListener('DOMContentLoaded', async function() {
  let carrito = [];
    
    // Elementos del DOM
    const cuadriculaProductos = document.getElementById('cuadriculaProductos');
    const itemsCarrito = document.getElementById('itemsCarrito');
    const totalCarrito = document.getElementById('totalCarrito');
    const botonFinalizar = document.getElementById('botonFinalizar');
    const formularioAgregarProducto = document.getElementById('formularioAgregarProducto');
    
 // Obtener productos desde la API
  async function obtenerProductos() {
    try {
      const response = await fetch('/api/productos');
      if (!response.ok) throw new Error('Error al obtener productos');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

   const productos = await obtenerProductos()

    // Mostrar productos
   function mostrarProductos() {
    cuadriculaProductos.innerHTML = '';
    productos.forEach(producto => {
        const tarjetaProducto = document.createElement('div');
        tarjetaProducto.className = 'tarjeta-producto';
        tarjetaProducto.innerHTML = `
            <h4>${producto.nombre}</h4>
            <p>L ${producto.precio.toFixed(2)}</p>  <!-- Cambiado $ por L -->
        `;
        tarjetaProducto.addEventListener('click', () => agregarAlCarrito(producto));
        cuadriculaProductos.appendChild(tarjetaProducto);
    });
}

function mostrarCarrito() {
    itemsCarrito.innerHTML = '';
    let total = 0;
    
    carrito.forEach(item => {
        const totalItem = item.precio * item.cantidad;
        total += totalItem;
        
        const itemCarrito = document.createElement('div');
        itemCarrito.className = 'item-carrito';
        itemCarrito.innerHTML = `
            <span>${item.nombre} x${item.cantidad}</span>
            <span>L ${totalItem.toFixed(2)}</span>  <!-- Cambiado $ por L -->
        `;
        itemsCarrito.appendChild(itemCarrito);
    });
    
    totalCarrito.textContent = `L ${total.toFixed(2)}`;
}

function finalizarVenta() {
    if (carrito.length === 0) {
        alert('¡El carrito está vacío!');
        return;
    }
    
    const total = carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
    alert(`¡Venta completada! Total: L ${total.toFixed(2)}`);
    
    carrito = [];
    mostrarCarrito();
}
    
    // Agregar al carrito
    function agregarAlCarrito(producto) {
        const itemExistente = carrito.find(item => item.id === producto.id);
        
        if (itemExistente) {
            itemExistente.cantidad += 1;
        } else {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1
            });
        }
        
        mostrarCarrito();
    }
    
    // Mostrar carrito
    function mostrarCarrito() {
        itemsCarrito.innerHTML = '';
        let total = 0;
        
        carrito.forEach(item => {
            const totalItem = item.precio * item.cantidad;
            total += totalItem;
            
            const itemCarrito = document.createElement('div');
            itemCarrito.className = 'item-carrito';
            itemCarrito.innerHTML = `
                <span>${item.nombre} x${item.cantidad}</span>
                <span>$${totalItem.toFixed(2)}</span>
            `;
            itemsCarrito.appendChild(itemCarrito);
        });
        
        totalCarrito.textContent = `$${total.toFixed(2)}`;
    }
    
    // Finalizar venta
    function finalizarVenta() {
        if (carrito.length === 0) {
            alert('¡El carrito está vacío!');
            return;
        }
        
        const total = carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
        alert(`¡Venta completada! Total: $${total.toFixed(2)}`);
        
        // En una aplicación real, enviaríamos estos datos al servidor
        carrito = [];
        mostrarCarrito();
    }
    
    
    
    // Eventos
    botonFinalizar.addEventListener('click', finalizarVenta);
    
   
    
    // Mostrar productos al cargar
    mostrarProductos();
});

app.use(express.static('public'));