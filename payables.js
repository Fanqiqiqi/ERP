// Datos (simula backend, usa localStorage)
let payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');

// Elementos DOM
const tbody = document.getElementById('payables-body');
const addBtn = document.querySelector('.add-btn');

// Variables de paginación
const itemsPerPage = 9;
let currentPage = 1;

// Carga inicial
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const dropdownMenu = this.nextElementSibling;
            const sidebar = document.querySelector('.sidebar');
            const isOpen = dropdownMenu.style.display === 'block';

            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdownMenu) menu.style.display = 'none';
            });

            dropdownMenu.style.display = isOpen ? 'none' : 'block';

            if (!isOpen) {
                const togglePosition = toggle.getBoundingClientRect().top;
                const sidebarPosition = sidebar.getBoundingClientRect().top;
                const offset = togglePosition - sidebarPosition;
                sidebar.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('dropdown-toggle')) return;
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) window.location.href = page;
        });
    });

    document.querySelector('.top-bar h1').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    updateTable();

    addBtn.addEventListener('click', () => {
        window.location.href = 'payableslist.html';
    });

    bindActionEvents();
});

// Actualizar tabla con paginación
function updateTable() {
    payablesData.sort((a, b) => {
        const invoiceComparison = String(b.payableNo).localeCompare(String(a.payableNo));
        if (invoiceComparison !== 0) {
            return invoiceComparison;
        }
        const dateA = new Date(a.invoiceDate);
        const dateB = new Date(b.invoiceDate);
        return dateB - dateA;
    });

    const totalPages = Math.ceil(payablesData.length / itemsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, payablesData.length);
    const currentData = payablesData.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentData.forEach((item, pageIndex) => {
        const globalIndex = startIndex + pageIndex;
        const formattedAmount = parseFloat(item.amount).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        const statusText = item.status === '已付款' ? 'Pagado' : item.status === '部分结账' ? 'Parcial' : 'No Pagado';
        
        tr.innerHTML = `
            <td>${item.payableNo || 'N/A'}</td>
            <td>${item.invoiceDate}</td>
            <td>${item.dueDate}</td>
            <td>${formattedAmount} €</td>
            <td class="${item.status === '已付款' ? 'status-paid' : item.status === '部分结账' ? 'status-partial' : 'status-unpaid'}">${statusText}</td>
            <td>
                <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
                <span class="action-icon adjust-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(totalPages);
    bindActionEvents();
}

// Actualizar paginación
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

// Vincular eventos de acción
function bindActionEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const invoiceNo = payablesData[index].payableNo;
            alert(`Ver detalles factura: ${invoiceNo}`);
        });
    });

    document.querySelectorAll('.adjust-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const payableNo = payablesData[index].payableNo;
            window.location.href = `payableslist.html?payableNo=${encodeURIComponent(payableNo)}&edit=true`;
        });
    });
}