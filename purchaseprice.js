// Inicializar datos cotizaciones compra
let purchasePrices = JSON.parse(localStorage.getItem('purchasePrices')) || [];

// Variables paginación
const itemsPerPage = 9; // 9 ítems por página
let currentPage = 1; // Página actual

// Obtener nombre proveedor
function getSupplierName(supplierCode) {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplier = suppliers.find(s => s.code === supplierCode);
    return supplier ? supplier.name : supplierCode;
}

// Obtener moneda producto
function getProductCurrency(productCode) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
}

// Actualizar tabla (con paginación)
function updateTable() {
    const tbody = document.querySelector('.purchaseprice-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ordenar por fecha cotización descendente
    purchasePrices.sort((a, b) => new Date(b.quoteDate) - new Date(a.quoteDate));

    // Calcular total páginas
    const totalPages = Math.ceil(purchasePrices.length / itemsPerPage);

    // Validar página actual
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Calcular rango datos página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, purchasePrices.length);
    const currentData = purchasePrices.slice(startIndex, endIndex);

    currentData.forEach((price, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // Índice global
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${price.code}</td>
            <td>${getSupplierName(price.supplierCode)}</td>
            <td>${price.quoteDate}</td>
            <td>${price.status === '确认' ? 'Confirmado' : 'No confirmado'}</td>
            <td>
                <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar paginación
    updatePagination(totalPages);

    bindIconEvents();
}

// Actualizar controles paginación
function updatePagination(totalPages) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

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
function savePurchasePrices() {
    localStorage.setItem('purchasePrices', JSON.stringify(purchasePrices));
}

// Inicializar
function init() {
    const addBtn = document.querySelector('.add-btn');

    if (!addBtn) {
        console.error('Elemento DOM necesario no encontrado');
        return;
    }

    // Crear tabla cotización compra (pantalla completa)
    addBtn.addEventListener('click', () => {
        const width = screen.width;
        const height = screen.height;
        const pricelistWindow = window.open(
            'purchasepricelist.html',
            '_blank',
            `width=${width},height=${height},top=0,left=0,fullscreen=yes`
        );
        if (pricelistWindow) {
            pricelistWindow.moveTo(0, 0);
            pricelistWindow.resizeTo(screen.width, screen.height);
        }
    });

    // Vincular eventos íconos acción
    document.querySelector('.purchaseprice-table').addEventListener('click', (e) => {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const priceCode = purchasePrices[index].code;

        if (target.classList.contains('view-icon')) {
            const pricelistWindow = window.open(`purchasepricelist.html?priceCode=${priceCode}`, '_blank', 'fullscreen=yes');
            if (pricelistWindow) {
                pricelistWindow.moveTo(0, 0);
                pricelistWindow.resizeTo(screen.width, screen.height);
            }
        } else if (target.classList.contains('edit-icon')) {
            const pricelistWindow = window.open(`purchasepricelist.html?priceCode=${priceCode}&edit=true`, '_blank', 'fullscreen=yes');
            if (pricelistWindow) {
                pricelistWindow.moveTo(0, 0);
                pricelistWindow.resizeTo(screen.width, screen.height);
            }
        } else if (target.classList.contains('delete-icon')) {
            if (confirm(`¿Seguro de eliminar la tabla cotización compra: ${priceCode}?`)) {
                purchasePrices.splice(index, 1);
                savePurchasePrices();
                updateTable();
            }
        }
    });

    updateTable();
}

// Vincular eventos íconos acción
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

// Escuchar evento storage para actualización en tiempo real
window.addEventListener('storage', function() {
    purchasePrices = JSON.parse(localStorage.getItem('purchasePrices')) || [];
    updateTable();
});

document.addEventListener('DOMContentLoaded', init);