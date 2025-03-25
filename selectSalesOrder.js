const orderTableBody = document.getElementById('orderListBody');
const confirmBtn = document.querySelector('.confirm-btn');
let selectedOrder = null;

// Obtener datos de órdenes de venta desde localStorage
function getSalesOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    console.log('Órdenes recuperadas de localStorage:', orders); // Depuración: revisar datos
    return orders;
}

// Obtener detalles de la orden desde orderList
function getOrderItems(orderCode) {
    const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
    return orderList.filter(item => item.orderCode === orderCode);
}

// Obtener unidad de moneda
function getCurrency(productCode) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
}

// Cargar lista de órdenes de venta, excluyendo las enviadas
function loadOrderList() {
    const orders = getSalesOrders().filter(order => order.status !== 'Enviado'); // Filtrar órdenes enviadas
    orderTableBody.innerHTML = '';
    confirmBtn.disabled = true; // Botón desactivado inicialmente

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        const items = getOrderItems(order.code);
        const firstItem = items[0];
        const currency = firstItem ? getCurrency(firstItem.productCode) : '';
        row.innerHTML = `
            <td>${order.code}</td>
            <td>${order.customerName}</td>
            <td>${order.totalAmount} ${currency}</td>
            <td>${order.date}</td>
            <td><span class="radio-circle" data-index="${index}"></span></td>
        `;
        orderTableBody.appendChild(row);
    });

    // Añadir evento de clic a los círculos
    document.querySelectorAll('.radio-circle').forEach(circle => {
        circle.addEventListener('click', function() {
            document.querySelectorAll('.radio-circle').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedOrder = orders[this.getAttribute('data-index')];
            selectedOrder.items = getOrderItems(selectedOrder.code); // Añadir detalles a selectedOrder
            console.log('Orden seleccionada:', selectedOrder); // Depuración: revisar orden seleccionada
            confirmBtn.disabled = false; // Activar botón
        });
    });
}

// Evento de clic en el botón Confirmar
confirmBtn.addEventListener('click', function() {
    if (selectedOrder) {
        const message = {
            orderCode: selectedOrder.code,
            items: selectedOrder.items.map(item => ({
                productCode: item.productCode,
                productName: item.productName,
                quantity: item.quantity || ''
            })),
            customerCode: selectedOrder.customerCode || '',
            customerName: selectedOrder.customerName || ''
        };
        console.log('Enviando mensaje desde selectSalesOrder:', message); // Depuración: revisar datos enviados
        window.opener.postMessage(message, '*');
        window.close();
    }
});

document.addEventListener('DOMContentLoaded', loadOrderList);