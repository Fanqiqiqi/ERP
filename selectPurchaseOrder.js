// selectPurchaseOrder.js
const orderTableBody = document.getElementById('orderTableBody');
const confirmBtn = document.querySelector('.confirm-btn');
let selectedOrder = null;

// Obtener datos de órdenes de compra desde localStorage
function getPurchaseOrders() {
    return JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
}

// Obtener nombre del proveedor
function getSupplierName(supplierCode) {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplier = suppliers.find(s => s.code === supplierCode);
    return supplier ? supplier.name : 'Proveedor desconocido';
}

// Obtener detalles de la orden desde purchaseOrderList
function getOrderItems(orderCode) {
    const orderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    return orderList.filter(item => item.orderCode === orderCode);
}

// Cargar lista de órdenes de compra, filtrando las procesadas
function loadOrderList() {
    const orders = getPurchaseOrders().filter(order => order.status !== 'Procesado'); // Filtro de estado
    orderTableBody.innerHTML = '';
    confirmBtn.disabled = true; // Botón desactivado inicialmente

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        const items = getOrderItems(order.orderCode); // Obtener detalles
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0).toFixed(2);
        row.innerHTML = `
            <td>${order.orderCode || ''}</td>
            <td>${getSupplierName(order.supplierCode)}</td>
            <td>${totalAmount}</td>
            <td>${order.orderDate || ''}</td>
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
            selectedOrder.items = getOrderItems(selectedOrder.orderCode); // Añadir detalles a selectedOrder
            confirmBtn.disabled = false; // Activar botón
        });
    });
}

// Evento de clic en el botón Confirmar
confirmBtn.addEventListener('click', function() {
    if (selectedOrder) {
        const message = {
            orderCode: selectedOrder.orderCode,
            items: selectedOrder.items.map(item => ({
                productCode: item.productCode,
                productName: item.productName,
                purchasePrice: item.purchasePrice || '',
                purchaseQuantity: item.quantity || '',
                taxRate: item.taxRate || '0',
                totalPrice: item.totalPrice || ''
            })),
            supplierCode: selectedOrder.supplierCode
        };
        console.log('Enviando mensaje desde selectPurchaseOrder:', message); // Log de depuración
        window.opener.postMessage(message, '*');
        window.close();
    }
});

document.addEventListener('DOMContentLoaded', loadOrderList);