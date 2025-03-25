const addBtn = document.querySelector('.add-btn');
const tbody = document.querySelector('.code-table tbody');

// Variables relacionadas con la paginación
const itemsPerPage = 9; // Mostrar 9 ítems por página
let currentPage = 1; // Página actual

function generateCodeFormat(category) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const rule = codeRules[category] || { prefix: '', digits: 0, suffix: '' };
    const number = '0'.repeat(rule.digits || 0);
    return `${rule.prefix}${number}${rule.suffix}` || 'Sin formato';
}

function loadCodes() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const categories = {
        'customer': 'Cliente',
        'supplier': 'Proveedor',
        'product': 'Producto',
        'price': 'Listado de Precios',
        'purchasequote': 'Cotización de Compra',
        'purchaseorder': 'Pedido de Compra',
        'instock': 'Albarán de compra',
        'salesquote': 'Cotización de Venta',
        'salesorder': 'Noº Pedido de Venta',
        'salesdespatch': 'Albarán de Venta',
        'salesinvoice': 'Noº Factura',
        'invoiceseries': 'Serie de Factura' // 新增 Serie de Factura
    };

    // Obtener las claves de categorías que tienen reglas y convertirlas en un arreglo
    const categoryKeys = Object.keys(categories).filter(category => codeRules[category]);
    const totalItems = categoryKeys.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Asegurar que la página actual sea válida
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Calcular el rango de datos para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentCategories = categoryKeys.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentCategories.forEach(category => {
        const codeFormat = generateCodeFormat(category);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${categories[category]}</td>
            <td>${codeFormat}</td>
            <td>
                <span class="action-icon view-icon" data-category="${category}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-category="${category}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-category="${category}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Actualizar controles de paginación
    updatePagination(totalPages);

    bindIconEvents();
}

function updatePagination(totalPages) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = `
        <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
        <span>Página ${currentPage} de ${totalPages}</span>
        <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
    `;

    pagination.querySelector('.prev-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadCodes();
        }
    });

    pagination.querySelector('.next-btn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadCodes();
        }
    });
}

addBtn.addEventListener('click', function() {
    const codeWindow = window.open('codeeditor.html', '_blank', 'fullscreen=yes');
    if (codeWindow) {
        codeWindow.moveTo(0, 0);
        codeWindow.resizeTo(screen.width, screen.height);
    }
});

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

const viewHandler = function() {
    const category = this.getAttribute('data-category');
    const categories = {
        'customer': 'Cliente',
        'supplier': 'Proveedor',
        'product': 'Producto',
        'price': 'Listado de Precios',
        'purchasequote': 'Cotización de Compra',
        'purchaseorder': 'Pedido de Compra',
        'instock': 'Albarán de compra',
        'salesquote': 'Cotización de Venta',
        'salesorder': 'Noº Pedido de Venta',
        'salesdespatch': 'Albarán de Venta',
        'salesinvoice': 'Noº Factura',
        'invoiceseries': 'Serie de Factura' // 新增 Serie de Factura
    };
    const item = categories[category];
    const codeWindow = window.open(`codeeditor.html?item=${item}`, '_blank', 'fullscreen=yes');
    if (codeWindow) {
        codeWindow.moveTo(0, 0);
        codeWindow.resizeTo(screen.width, screen.height);
    }
};

const editHandler = function() {
    const category = this.getAttribute('data-category');
    const categories = {
        'customer': 'Cliente',
        'supplier': 'Proveedor',
        'product': 'Producto',
        'price': 'Listado de Precios',
        'purchasequote': 'Cotización de Compra',
        'purchaseorder': 'Pedido de Compra',
        'instock': 'Albarán de compra',
        'salesquote': 'Cotización de Venta',
        'salesorder': 'Noº Pedido de Venta',
        'salesdespatch': 'Albarán de Venta',
        'salesinvoice': 'Noº Factura',
        'invoiceseries': 'Serie de Factura' // 新增 Serie de Factura
    };
    const item = categories[category];
    const codeWindow = window.open(`codeeditor.html?item=${item}&edit=true`, '_blank', 'fullscreen=yes');
    if (codeWindow) {
        codeWindow.moveTo(0, 0);
        codeWindow.resizeTo(screen.width, screen.height);
    }
};

const deleteHandler = function() {
    const category = this.getAttribute('data-category');
    const categories = {
        'customer': 'Cliente',
        'supplier': 'Proveedor',
        'product': 'Producto',
        'price': 'Listado de Precios',
        'purchasequote': 'Cotización de Compra',
        'purchaseorder': 'Pedido de Compra',
        'instock': 'Albarán de compra',
        'salesquote': 'Cotización de Venta',
        'salesorder': 'Noº Pedido de Venta',
        'salesdespatch': 'Albarán de Venta',
        'salesinvoice': 'Noº Factura',
        'invoiceseries': 'Serie de Factura' // 新增 Serie de Factura
    };
    const item = categories[category];
    if (confirm(`¿Está seguro de eliminar el código: ${item}?`)) {
        const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
        delete codeRules[category];
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
        loadCodes();
    }
};

window.addEventListener('storage', function() {
    loadCodes();
});

window.addEventListener('message', function(event) {
    if (event.data === 'update') {
        loadCodes();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadCodes();
});

document.querySelector('.top-bar h1').addEventListener('click', function() {
    window.location.href = 'index.html';
});