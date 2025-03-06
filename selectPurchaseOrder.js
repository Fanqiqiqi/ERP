// selectPurchaseOrder.js
const orderTableBody = document.getElementById('orderTableBody');
const confirmBtn = document.querySelector('.confirm-btn');
let selectedOrder = null;

// 从 localStorage 获取采购订单数据
function getPurchaseOrders() {
    return JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
}

// 获取供应商名字
function getSupplierName(supplierCode) {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplier = suppliers.find(s => s.code === supplierCode);
    return supplier ? supplier.name : '未知供应商';
}

// 从 purchaseOrderList 获取订单明细
function getOrderItems(orderCode) {
    const orderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    return orderList.filter(item => item.orderCode === orderCode);
}

// 加载采购订单列表
function loadOrderList() {
    const orders = getPurchaseOrders();
    orderTableBody.innerHTML = '';
    confirmBtn.disabled = true; // 初始禁用确认按钮

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        const items = getOrderItems(order.orderCode); // 获取订单明细
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

    // 为小圆圈添加点击事件
    document.querySelectorAll('.radio-circle').forEach(circle => {
        circle.addEventListener('click', function() {
            document.querySelectorAll('.radio-circle').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedOrder = orders[this.getAttribute('data-index')];
            selectedOrder.items = getOrderItems(selectedOrder.orderCode); // 添加订单明细到 selectedOrder
            confirmBtn.disabled = false; // 启用确认按钮
        });
    });
}

// 确认按钮点击事件
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
        console.log('Sending message from selectPurchaseOrder:', message); // 调试日志
        window.opener.postMessage(message, '*');
        window.close();
    }
});

document.addEventListener('DOMContentLoaded', loadOrderList);