document.addEventListener('DOMContentLoaded', function() {
    // Obtener tbody de la tabla
    const tbody = document.querySelector('.forecast-table tbody');
    
    // Obtener todos los datos relacionados
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const stockData = JSON.parse(localStorage.getItem('stockData') || '[]');
    const purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    const purchaseOrderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    const purchaseInstockList = JSON.parse(localStorage.getItem('purchaseInstockList') || '[]'); // Nuevo: obtener detalle entrada
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');

    // Llenar datos tabla
    function populateForecastTable() {
        tbody.innerHTML = ''; // Limpiar contenido actual
        
        products.forEach(product => {
            // Obtener cantidad inventario
            const stockItem = stockData.find(item => item.productCode === product.code);
            const stockQuantity = stockItem ? parseInt(stockItem.quantity) || 0 : 0;

            // Calcular cantidad compra (suma pedidos compra no completados)
            const purchaseItems = purchaseOrderList.filter(item => item.productCode === product.code);
            const totalPurchaseQuantity = purchaseItems.reduce((sum, item) => {
                return sum + (parseInt(item.quantity) || 0);
            }, 0);

            // Calcular cantidad ingresada (desde purchaseInstockList)
            const instockItems = purchaseInstockList.filter(item => item.productCode === product.code);
            const instockQuantity = instockItems.reduce((sum, item) => {
                return sum + (parseInt(item.quantity) || 0);
            }, 0);

            // Cantidad compra no ingresada = total compra - ingresada
            const purchaseQuantity = Math.max(0, totalPurchaseQuantity - instockQuantity);

            // Calcular cantidad ventas (suma de todos los pedidos)
            const salesItems = orderList.filter(item => item.productCode === product.code);
            const salesQuantity = salesItems.reduce((sum, item) => {
                return sum + (parseInt(item.quantity) || 0);
            }, 0);

            // Inventario seguro
            const safetyStock = parseInt(product.safetyStock) || 0;

            // Calcular necesidad compra = inventario seguro - inventario + ventas - compra no ingresada
            const needToPurchase = Math.max(0, safetyStock - stockQuantity + salesQuantity - purchaseQuantity);

            // Crear fila tabla
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${stockQuantity}</td>
                <td>${purchaseQuantity}</td> <!-- Mostrar compra no ingresada -->
                <td>${salesQuantity}</td>
                <td>${safetyStock}</td>
                <td class="${needToPurchase > 0 ? 'highlight' : ''}">${needToPurchase}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Escuchar clic en "Generar Pedido Compra" (generación total)
    document.getElementById('generatePurchaseOrder').addEventListener('click', function() {
        alert('¡Función generar todos los pedidos compra por implementar!');
        // Aquí puedes agregar lógica para ir a página pedidos compra o generarlos
    });

    // Inicializar tabla
    populateForecastTable();

    // Escuchar cambios storage para actualizar en tiempo real
    window.addEventListener('storage', function() {
        populateForecastTable();
    });
});