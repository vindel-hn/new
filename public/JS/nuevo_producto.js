document.addEventListener('DOMContentLoaded', function() {
    // Espera a que el modal esté en el DOM
    const interval = setInterval(() => {
        const form = document.getElementById('form-nuevo-producto');
        const btnAgregar = document.getElementById('btnAgregarNuevoProducto');
        const btnGuardar = document.getElementById('btnGuardarNuevoProducto'); // <-- AQUÍ
        const tabla = document.getElementById('tablaNuevosProductos');
        if (form && btnAgregar && btnGuardar && tabla) {
            clearInterval(interval);
            const tbody = tabla.querySelector('tbody');

            // Agregar producto a la tabla
            btnAgregar.addEventListener('click', function() {
                const codigo = document.getElementById('codigo').value.trim();
                const nombre = document.getElementById('nombre').value.trim();
                const linea = document.getElementById('linea');
                const lineaText = linea.options[linea.selectedIndex].text;
                const isvSelect = document.getElementById('isv');
                const isvText = isvSelect.options[isvSelect.selectedIndex].text;
                const isvValue = isvSelect.value;
                const cantidad = document.getElementById('cantidad').value;
                const costo_unitario = document.getElementById('costo_unitario').value.trim();
                const precioVal = document.getElementById('precio').value.trim();

                // Validar que todos los campos tengan valor
                if (!codigo || !nombre || !linea.value || !isvValue || !costo_unitario || !precioVal) {
                    alert('Ingresa valor en todos los campos');
                    return;
                }

                // Agregar fila a la tabla
                const fila = document.createElement('tr');
                fila.classList.add('fila-producto'); // para consistencia
                fila.innerHTML = `
                    <td>${codigo}</td>
                    <td>${nombre}</td>
                    <td data-cod-linea="${linea.value}">${lineaText}</td>
                    <td data-cod-isv="${isvSelect.value}">${isvText}</td>
                    <td>${cantidad}</td>
                    <td>${costo_unitario}</td>
                    <td>${precioVal}</td>
                `;
                tbody.appendChild(fila);
                agregarListenersSeleccion();

                // Limpiar el formulario (excepto cantidad)
                form.reset();
                document.getElementById('cantidad').value = "0";
            });

            // Guardar todos los productos de la tabla
            btnGuardar.addEventListener('click', function() {
                const productos = [];
                tbody.querySelectorAll('tr').forEach(tr => {
                    const tds = tr.querySelectorAll('td');
                    productos.push({
                        codigo: tds[0].textContent,
                        nombre: tds[1].textContent,
                        linea: tds[2].getAttribute('data-cod-linea'),
                        isv: tds[3].getAttribute('data-cod-isv'),
                        cantidad: tds[4].textContent,
                        costo_unitario: tds[5].textContent,
                        precio: tds[6].textContent
                    });
                });
                if (productos.length === 0) {
                    alert('Agrega al menos un producto antes de guardar.');
                    return;
                }
                console.log(JSON.stringify({ productos }, null, 2));
                fetch('/inventario/guardar-nuevos-productos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productos })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.ok) {
                        alert('Productos guardados correctamente');
                        tbody.innerHTML = '';
                    } else {
                        alert('Error al guardar: ' + (data.error || ''));
                    }
                });
            });

            // --- DRAGGABLE VENTANA FLOTANTE ---
            const container = document.getElementById('nuevo-producto-container');
            const handler = container ? container.querySelector('.draggable-handler') : null;
            let isDragging = false, offsetX = 0, offsetY = 0;

            if (container && handler) {
                handler.addEventListener('mousedown', function(e) {
                    isDragging = true;
                    const rect = container.getBoundingClientRect();
                    offsetX = e.clientX - rect.left;
                    offsetY = e.clientY - rect.top;
                    container.style.transition = 'none';
                    document.body.style.userSelect = 'none';
                });
                document.addEventListener('mousemove', function(e) {
                    if (isDragging) {
                        container.style.left = (e.clientX - offsetX) + 'px';
                        container.style.top = (e.clientY - offsetY) + 'px';
                        container.style.transform = 'none';
                    }
                });
                document.addEventListener('mouseup', function() {
                    isDragging = false;
                    document.body.style.userSelect = '';
                });
            }

            // Validación de código único
            const codigoInput = document.getElementById('codigo');
            const codigoMsg = document.createElement('div');
            codigoMsg.style.color = 'red';
            codigoMsg.style.fontSize = '0.9em';
            codigoInput.parentNode.appendChild(codigoMsg);

            codigoInput.addEventListener('input', function() {
                const codigo = codigoInput.value.trim();
                if (!codigo) {
                    codigoMsg.textContent = '';
                    codigoInput.classList.remove('is-invalid');
                    btnAgregar.disabled = false;
                    return;
                }
                fetch(`/inventario/existe-codigo/${encodeURIComponent(codigo)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.existe) {
                            codigoMsg.textContent = 'El código ya existe en el inventario.';
                            codigoInput.classList.add('is-invalid');
                            btnAgregar.disabled = true;
                        } else {
                            codigoMsg.textContent = '';
                            codigoInput.classList.remove('is-invalid');
                            btnAgregar.disabled = false;
                        }
                    });
            });

            function agregarListenersSeleccion() {
                const filas = tbody.querySelectorAll('tr');
                filas.forEach(fila => {
                    fila.onclick = function() {
                        filas.forEach(f => f.classList.remove('selected'));
                        this.classList.add('selected');
                    };
                });
            }

            const btnEliminar = document.getElementById('btnEliminarNuevoProducto');
            btnEliminar.addEventListener('click', function() {
                const filaSeleccionada = tbody.querySelector('tr.selected');
                if (!filaSeleccionada) {
                    alert('Selecciona un producto de la tabla para eliminar.');
                    return;
                }
                filaSeleccionada.remove();
            });
        }
    }, 100);
});