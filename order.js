// order.js

// Elementos del modal
const modal = document.getElementById('addOrderModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const orderForm = document.getElementById('orderForm');
const orderCodeInput = document.getElementById('orderCode');
const customerNameSelect = document.getElementById('customerName');
const totalAmountInput = document.getElementById('totalAmount');
const orderDateInput = document.getElementById('orderDate');
const deliveryDateInput = document.getElementById('deliveryDate');
const statusSelect = document.getElementById('status');
const tbody = document.querySelector('.order-table tbody');

let isEditing = false;
let editingRow = null;

// Variables de paginación
const itemsPerPage = 9;
let currentPage = 1;

// Cargar clientes en el selector
function loadCustomersIntoSelect() {
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    customerNameSelect.innerHTML = '<option value="">Selecciona Cliente</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = customer.name;
        customerNameSelect.appendChild(option);
    });
}

// Actualizar tabla con paginación
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || [];

    const totalPages = Math.ceil(orders.length / itemsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, orders.length);
    
    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    const currentData = sortedOrders.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    currentData.forEach((order, pageIndex) => {
        const globalIndex = startIndex + pageIndex;
        const orderList = JSON.parse(localStorage.getItem('orderList')) || [];
        const orderItems = orderList.filter(item => item.orderCode === order.code);
        const firstItem = orderItems[0];
        const product = firstItem ? products.find(p => p.code === firstItem.productCode) : null;
        const currency = product ? product.currency || '€' : '€';
        
        const formattedAmount = Number(order.totalAmount).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const status = order.status || 'Pendiente';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.code}</td>
            <td>${order.customerName}</td>
            <td>${formattedAmount} ${currency}</td>
            <td>${order.date}</td>
            <td>${order.deliveryDate || 'No Establecido'}</td>
            <td class="${status === 'Enviado' ? 'status-enviado' : 'status-pendiente'}">${status}</td>
            <td>
                <span class="action-icon view-icon" data-code="${order.code}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-code="${order.code}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-code="${order.code}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updatePagination(totalPages);
    bindIconEvents();
}

// Actualizar controles de paginación
function updatePagination(totalPages) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = `
        <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
        <span>Pág ${currentPage} / Total ${totalPages}</span>
        <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
    `;

    pagination.querySelector('.prev-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadOrders();
        }
    });

    pagination.querySelector('.next-btn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadOrders();
        }
    });
}

// Guardar datos de pedido en localStorage
function saveOrderData(orderData) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(o => o.code === orderData.code);
    if (orderIndex >= 0) {
        orders[orderIndex] = {
            ...orders[orderIndex],
            ...orderData
        };
    } else {
        orders.push({
            ...orderData,
            status: orderData.status || 'Pendiente',
            deliveryDate: orderData.deliveryDate || ''
        });
    }
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Añadir pedido - Redirigir a nueva página
addBtn.addEventListener('click', function() {
    window.location.href = 'add-order.html';
});

// Cancelar - Cerrar modal
cancelBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    orderForm.reset();
    isEditing = false;
    editingRow = null;
});

// Guardar o actualizar pedido (solo en modo edición)
orderForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const code = orderCodeInput.value.trim();
    const customerName = customerNameSelect.value;
    const totalAmount = totalAmountInput.value.trim();
    const date = orderDateInput.value;
    const deliveryDate = deliveryDateInput.value;
    const status = statusSelect ? statusSelect.value : 'Pendiente';

    if (code && customerName && totalAmount && date) {
        const orderData = {
            code,
            customerName,
            totalAmount,
            date,
            deliveryDate: deliveryDate || '',
            status: status || 'Pendiente'
        };

        if (isEditing && editingRow) {
            editingRow.cells[0].textContent = code;
            editingRow.cells[1].textContent = customerName;
            editingRow.cells[2].textContent = totalAmount;
            editingRow.cells[3].textContent = date;
            editingRow.cells[4].textContent = deliveryDate || 'No Establecido';
            editingRow.cells[5].textContent = status;
            editingRow.cells[5].className = status === 'Enviado' ? 'status-enviado' : 'status-pendiente';
            saveOrderData(orderData);
        } else {
            const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
            if (existingCodes.includes(code)) {
                alert('¡El Nº de pedido ya existe, usa uno único!');
                return;
            }
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${code}</td>
                <td>${customerName}</td>
                <td>${totalAmount}</td>
                <td>${date}</td>
                <td>${deliveryDate || 'No Establecido'}</td>
                <td class="${status === 'Enviado' ? 'status-enviado' : 'status-pendiente'}">${status}</td>
                <td>
                    <span class="action-icon view-icon"><i class="fas fa-eye"></i></span>
                    <span class="action-icon edit-icon"><i class="fas fa-edit"></i></span>
                    <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
                </td>
            `;
            tbody.appendChild(newRow);
            saveOrderData(orderData);
        }

        modal.style.display = 'none';
        orderForm.reset();
        isEditing = false;
        editingRow = null;
        loadOrders();
    }
});

// Vincular eventos de íconos
function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.removeEventListener('click', viewHandler);
        icon.addEventListener('click', viewHandler);
    });
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.removeEventListener('click', editHandler);
        icon.addEventListener('click', editHandler);
    });
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

// Ver - Redirigir a add-order.html
const viewHandler = function() {
    const code = this.getAttribute('data-code');
    window.open(`add-order.html?code=${encodeURIComponent(code)}&view=true`, '_blank');
};

// Editar - Redirigir a add-order.html
const editHandler = function() {
    const code = this.getAttribute('data-code');
    window.open(`add-order.html?code=${encodeURIComponent(code)}&edit=true`, '_blank');
};

// Eliminar
const deleteHandler = function() {
    const row = this.closest('tr');
    const code = row.cells[0].textContent;
    if (confirm(`¿Seguro que deseas eliminar el pedido: ${code}?`)) {
        row.remove();
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const updatedOrders = orders.filter(o => o.code !== code);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        const orderList = JSON.parse(localStorage.getItem('orderList')) || [];
        const updatedOrderList = orderList.filter(item => item.orderCode !== code);
        localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
        loadOrders();
    }
};

// --- Funcionalidad de filtro ---
// Elementos DOM
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

let filteredData = JSON.parse(localStorage.getItem('orders') || '[]');

// Aplicar filtros
function applyFilters(formData) {
    const filters = {
        orderCode: formData.get('orderCode')?.toLowerCase().trim(),
        customerName: formData.get('customerName')?.toLowerCase().trim(),
        orderDateFrom: formData.get('orderDateFrom'),
        orderDateTo: formData.get('orderDateTo'),
        totalAmount: formData.get('totalAmount') ? Number(formData.get('totalAmount')) : null,
        status: formData.get('status')
    };

    filteredData = JSON.parse(localStorage.getItem('orders') || '[]').filter(item => {
        let matches = true;

        if (filters.orderCode) {
            matches = matches && item.code.toLowerCase().includes(filters.orderCode);
        }

        if (filters.customerName) {
            matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
        }

        if (filters.orderDateFrom || filters.orderDateTo) {
            const orderDate = new Date(item.date);
            if (filters.orderDateFrom) {
                matches = matches && orderDate >= new Date(filters.orderDateFrom);
            }
            if (filters.orderDateTo) {
                matches = matches && orderDate <= new Date(filters.orderDateTo);
            }
        }

        if (filters.totalAmount !== null) {
            matches = matches && Number(item.totalAmount) === filters.totalAmount;
        }

        if (filters.status) {
            matches = matches && item.status === filters.status;
        }

        return matches;
    });
}

// Actualizar tabla con datos filtrados
function updateTableWithFilter() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const currentData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentData.forEach((order, pageIndex) => {
        const globalIndex = startIndex + pageIndex;
        const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
        const orderItems = orderList.filter(item => item.orderCode === order.code);
        const firstItem = orderItems[0];
        const product = firstItem ? products.find(p => p.code === firstItem.productCode) : null;
        const currency = product ? product.currency || '€' : '€';
        
        const formattedAmount = Number(order.totalAmount).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const status = order.status || 'Pendiente';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.code}</td>
            <td>${order.customerName}</td>
            <td>${formattedAmount} ${currency}</td>
            <td>${order.date}</td>
            <td>${order.deliveryDate || 'No Establecido'}</td>
            <td class="${status === 'Enviado' ? 'status-enviado' : 'status-pendiente'}">${status}</td>
            <td>
                <span class="action-icon view-icon" data-code="${order.code}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-code="${order.code}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-code="${order.code}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination(totalPages);
    bindIconEvents();
}

// Mostrar/Ocultar panel de filtros
function toggleFilterPanel() {
    filterPanel.classList.toggle('active');
}

// Cerrar panel de filtros
function closeFilterPanel() {
    filterPanel.classList.remove('active');
}

// Resetear formulario de filtros
function resetFilterForm() {
    filterForm.reset();
    filteredData = JSON.parse(localStorage.getItem('orders') || '[]');
    currentPage = 1;
    updateTableWithFilter();
}

// Inicializar filtros
function initFilter() {
    searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFilterPanel();
    });

    closeFilter.addEventListener('click', () => {
        closeFilterPanel();
    });

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filterForm);
        applyFilters(formData);
        currentPage = 1;
        updateTableWithFilter();
        closeFilterPanel();
    });

    resetBtn.addEventListener('click', () => {
        resetFilterForm();
    });

    document.addEventListener('click', (e) => {
        if (filterPanel.classList.contains('active') && 
            !filterPanel.contains(e.target) && 
            e.target !== searchBtn) {
            closeFilterPanel();
        }
    });

    filterPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Inicialización al cargar página
document.addEventListener('DOMContentLoaded', function() {
    loadCustomersIntoSelect();
    loadOrders();
    initFilter();
});

// Actualizar en tiempo real con eventos de storage
window.addEventListener('storage', function() {
    loadOrders();
});