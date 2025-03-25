// purchaseorderinstocklist_es.js
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Inicializar datos de entradas de compra
let purchaseInstocks = JSON.parse(localStorage.getItem('purchaseInstocks')) || [];

// Variables relacionadas con la paginación
const itemsPerPage = 9; // 9 ítems por página
let currentPage = 1; // Página actual
let filteredData = [...purchaseInstocks]; // Almacenar datos filtrados

// Guardar en localStorage
function savePurchaseInstocks() {
    localStorage.setItem('purchaseInstocks', JSON.stringify(purchaseInstocks));
}

// Aplicar condiciones de filtrado
function applyFilters(formData) {
    const filters = {
        instockCode: formData.get('instockCode')?.toLowerCase().trim(),
        instockDateFrom: formData.get('instockDateFrom'),
        instockDateTo: formData.get('instockDateTo'),
        supplierName: formData.get('supplierName')?.toLowerCase().trim(),
        totalPrice: formData.get('totalPrice') ? Number(formData.get('totalPrice')) : null
    };

    filteredData = purchaseInstocks.filter(item => {
        let matches = true;

        if (filters.instockCode) {
            matches = matches && item.instockCode.toLowerCase().includes(filters.instockCode);
        }

        if (filters.instockDateFrom || filters.instockDateTo) {
            const instockDate = new Date(item.instockDate);
            if (filters.instockDateFrom) {
                matches = matches && instockDate >= new Date(filters.instockDateFrom);
            }
            if (filters.instockDateTo) {
                matches = matches && instockDate <= new Date(filters.instockDateTo);
            }
        }

        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        const supplier = suppliers.find(s => s.code === item.supplierCode);
        const supplierName = supplier ? supplier.name : 'Proveedor desconocido';
        if (filters.supplierName) {
            matches = matches && supplierName.toLowerCase().includes(filters.supplierName);
        }

        if (filters.totalPrice !== null) {
            matches = matches && Number(item.totalPrice) === filters.totalPrice;
        }

        return matches;
    });
}

// Actualizar tabla (con paginación)
function updateTable() {
    const tbody = document.querySelector('.purchaseorderinstock-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ordenar por fecha de entrada descendente
    filteredData.sort((a, b) => new Date(b.instockDate) - new Date(a.instockDate));

    // Calcular total de páginas
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Asegurar que la página actual sea válida
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Calcular el rango de datos de la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const currentData = filteredData.slice(startIndex, endIndex);

    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');

    currentData.forEach((instock, pageIndex) => {
        const globalIndex = purchaseInstocks.indexOf(instock); // Usar índice de datos originales
        const supplier = suppliers.find(s => s.code === instock.supplierCode);
        const supplierName = supplier ? supplier.name : 'Proveedor desconocido';

        // Formatear monto con separadores de miles y dos decimales
        const formattedPrice = Number(instock.totalPrice).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${instock.instockCode}</td>
            <td>${instock.instockDate}</td>
            <td>${supplierName}</td>
            <td>${formattedPrice} €</td>
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

// Restablecer formulario de filtros
function resetFilterForm() {
    document.getElementById('filterForm').reset();
    filteredData = [...purchaseInstocks];
    currentPage = 1;
    updateTable();
}

// Mostrar/Ocultar panel de filtros
function toggleFilterPanel() {
    document.getElementById('filterPanel').classList.toggle('active');
}

// Cerrar panel de filtros
function closeFilterPanel() {
    document.getElementById('filterPanel').classList.remove('active');
}

function init() {
    const addBtn = document.querySelector('.add-btn');
    const searchBtn = document.querySelector('.search-btn');
    const filterPanel = document.getElementById('filterPanel');
    const closeFilter = filterPanel.querySelector('.close-filter');
    const filterForm = document.getElementById('filterForm');
    const resetBtn = filterForm.querySelector('.reset-btn');

    if (!addBtn || !searchBtn || !filterPanel || !closeFilter || !filterForm || !resetBtn) {
        console.error('Elemento DOM requerido no encontrado');
        return;
    }

    addBtn.addEventListener('click', function() {
        const newWindow = window.open('purchaseinstock.html', '_blank');
        newWindow.onload = function() {
            const docEl = newWindow.document.documentElement;
            requestFullscreen(docEl);
        };
    });

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
        updateTable();
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

    document.querySelector('.purchaseorderinstock-table').addEventListener('click', (e) => {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const instockCode = purchaseInstocks[index].instockCode;

        if (target.classList.contains('view-icon')) {
            const viewWindow = window.open(`purchaseinstock.html?instockCode=${instockCode}`, '_blank');
            viewWindow.onload = function() {
                const docEl = viewWindow.document.documentElement;
                requestFullscreen(docEl);
            };
        } else if (target.classList.contains('edit-icon')) {
            const editWindow = window.open(`purchaseinstock.html?instockCode=${instockCode}&edit=true`, '_blank');
            editWindow.onload = function() {
                const docEl = editWindow.document.documentElement;
                requestFullscreen(docEl);
            };
        } else if (target.classList.contains('delete-icon')) {
            if (confirm(`¿Seguro que desea eliminar la entrada de compra: ${instockCode}?`)) {
                purchaseInstocks.splice(index, 1);
                savePurchaseInstocks();
                filteredData = [...purchaseInstocks]; // Actualizar datos filtrados
                updateTable();
            }
        }
    });

    updateTable();
}

// Función encapsulada para solicitud de pantalla completa
function requestFullscreen(docEl) {
    if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => {
            console.error('No se puede entrar en modo pantalla completa:', err);
        });
    } else if (docEl.webkitRequestFullscreen) { // Safari
        docEl.webkitRequestFullscreen().catch(err => {
            console.error('No se puede entrar en modo pantalla completa:', err);
        });
    } else if (docEl.mozRequestFullScreen) { // Firefox
        docEl.mozRequestFullScreen().catch(err => {
            console.error('No se puede entrar en modo pantalla completa:', err);
        });
    } else if (docEl.msRequestFullscreen) { // IE/Edge
        docEl.msRequestFullscreen().catch(err => {
            console.error('No se puede entrar en modo pantalla completa:', err);
        });
    }
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
    purchaseInstocks = JSON.parse(localStorage.getItem('purchaseInstocks')) || [];
    filteredData = [...purchaseInstocks];
    updateTable();
});