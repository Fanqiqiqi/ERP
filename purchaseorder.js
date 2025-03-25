// Inicializar datos de órdenes de compra
let purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders')) || [];

// Definir valores de estado permitidos
const validStatuses = ['No procesado', 'En proceso', 'Procesado'];

// Variables relacionadas con la paginación
const itemsPerPage = 9; // 9 ítems por página
let currentPage = 1; // Página actual

// Obtener nombre del proveedor
function getSupplierName(supplierCode) {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplier = suppliers.find(s => s.code === supplierCode);
    return supplier ? supplier.name : supplierCode;
}

// Calcular el total de la orden y devolverlo con el símbolo de euro
function getOrderTotal(orderCode) {
    const orderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    const orderItems = orderList.filter(item => item.orderCode === orderCode);
    let total = 0;
    orderItems.forEach(item => {
        total += parseFloat(item.totalPrice) || 0;
    });
    return `${total.toFixed(2)} €`; // Usar símbolo de euro fijo
}

// Actualizar tabla (con paginación)
function updateTable() {
    const tbody = document.querySelector('.purchaseorder-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ordenar por fecha de orden descendente
    purchaseOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    // Calcular total de páginas
    const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);

    // Asegurar que la página actual sea válida
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Calcular el rango de datos de la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, purchaseOrders.length);
    const currentData = purchaseOrders.slice(startIndex, endIndex);

    currentData.forEach((order, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // Calcular índice global
        const tr = document.createElement('tr');
        const totalPrice = getOrderTotal(order.orderCode);
        // Asegurar que el estado sea válido, de lo contrario usar "No procesado"
        const status = validStatuses.includes(order.status) ? order.status : 'No procesado';
        const statusClass = status === 'No procesado' ? 'unprocessed' : status === 'En proceso' ? 'processing' : 'processed';
        tr.innerHTML = `
            <td>${order.orderCode}</td>
            <td>${getSupplierName(order.supplierCode)}</td>
            <td>${totalPrice}</td>
            <td>${order.orderDate}</td>
            <td>${order.expectedArrivalDate || ''}</td>
            <td class="status-column ${statusClass}">${status}</td>
            <td>
                <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar controles de paginación
    updatePagination(totalPages);

    bindIconEvents();
}

// Actualizar controles de paginación
function updatePagination(totalPages) {
    let pagination = document.querySelector('.pagination');
    if (!pagination) {
        pagination = document.createElement('div');
        pagination.className = 'pagination';
        document.querySelector('.content-wrapper').appendChild(pagination);
    }

    pagination.innerHTML = `
        <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Página Anterior</button>
        <span>Página ${currentPage} / Total ${totalPages}</span>
        <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Página Siguiente</button>
    `;

    pagination.querySelector('.prev-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    pagination.querySelector('.next-btn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });
}

// Guardar en localStorage
function savePurchaseOrders() {
    localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
}

// Inicializar
function init() {
    const addBtn = document.querySelector('.add-btn');

    if (!addBtn) {
        console.error('Elemento DOM requerido no encontrado');
        return;
    }

    addBtn.addEventListener('click', function() {
        const newWindow = window.open('purchaseorderlist.html', '_blank');
        newWindow.onload = function() {
            // Enviar estado predeterminado "No procesado" mediante postMessage
            newWindow.postMessage({ defaultStatus: 'No procesado' }, '*');
            const docEl = newWindow.document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
            } else if (docEl.mozRequestFullScreen) {
                docEl.mozRequestFullScreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
            } else if (docEl.msRequestFullscreen) {
                docEl.msRequestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
            }
        };
    });

    document.querySelector('.purchaseorder-table').addEventListener('click', (e) => {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const orderCode = purchaseOrders[index].orderCode;

        if (target.classList.contains('view-icon')) {
            const viewWindow = window.open(`purchaseorderlist.html?orderCode=${orderCode}`, '_blank');
            viewWindow.onload = function() {
                const docEl = viewWindow.document.documentElement;
                if (docEl.requestFullscreen) {
                    docEl.requestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                } else if (docEl.webkitRequestFullscreen) {
                    docEl.webkitRequestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                } else if (docEl.mozRequestFullScreen) {
                    docEl.mozRequestFullScreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                } else if (docEl.msRequestFullscreen) {
                    docEl.msRequestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                }
            };
        } else if (target.classList.contains('edit-icon')) {
            const editWindow = window.open(`purchaseorderlist.html?orderCode=${orderCode}&edit=true`, '_blank');
            editWindow.onload = function() {
                const docEl = editWindow.document.documentElement;
                if (docEl.requestFullscreen) {
                    docEl.requestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                } else if (docEl.webkitRequestFullscreen) {
                    docEl.webkitRequestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                } else if (docEl.mozRequestFullScreen) {
                    docEl.mozRequestFullScreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                } else if (docEl.msRequestFullscreen) {
                    docEl.msRequestFullscreen().catch(err => console.error('No se puede entrar en modo pantalla completa:', err));
                }
            };
        } else if (target.classList.contains('delete-icon')) {
            if (confirm(`¿Seguro que desea eliminar la orden de compra: ${orderCode}?`)) {
                purchaseOrders.splice(index, 1);
                savePurchaseOrders();
                updateTable();
            }
        }
    });

    updateTable();
}

// Vincular eventos de iconos de acción
function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.removeEventListener('click', () => {});
        icon.addEventListener('click', () => {});
    });
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.removeEventListener('click', () => {});
        icon.addEventListener('click', () => {});
    });
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', () => {});
        icon.addEventListener('click', () => {});
    });
}

// Escuchar eventos de almacenamiento para actualización en tiempo real
window.addEventListener('storage', function() {
    purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders')) || [];
    updateTable();
});

document.addEventListener('DOMContentLoaded', init);