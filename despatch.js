// despatch_es.js

const modal = document.getElementById('addDespatchModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const despatchForm = document.getElementById('despatchForm');
const despatchCodeInput = document.getElementById('despatchCode');
const customerNameSelect = document.getElementById('customerName');
const totalAmountInput = document.getElementById('totalAmount');
const despatchDateInput = document.getElementById('despatchDate');
const statusSelect = document.getElementById('status');
const tbody = document.querySelector('.order-table tbody');

const itemsPerPage = 9;
let currentPage = 1;

let isEditing = false;
let editingRow = null;

function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

function loadCustomersIntoSelect() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    customerNameSelect.innerHTML = '<option value="">Selecciona Cliente</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = customer.name;
        customerNameSelect.appendChild(option);
    });
}

function formatAmount(amount) {
    return Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function updateTable() {
    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    
    despatches.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPages = Math.ceil(despatches.length / itemsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, despatches.length);
    const currentData = despatches.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentData.forEach((despatch) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${despatch.code}</td>
            <td>${despatch.customerName}</td>
            <td>${formatAmount(despatch.totalAmount)}</td>
            <td>${despatch.date}</td>
            <td>${despatch.status === '未开票' ? 'No Facturado' : 'Facturado'}</td>
            <td>
                <span class="action-icon view-icon" data-code="${despatch.code}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-code="${despatch.code}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-code="${despatch.code}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination(totalPages);
    bindIconEvents();
}

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

function saveDespatchData(despatchData) {
    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    const despatchIndex = despatches.findIndex(d => d.code === despatchData.code);
    if (despatchIndex >= 0) {
        despatches[despatchIndex] = despatchData;
    } else {
        despatches.push(despatchData);
    }
    localStorage.setItem('despatches', JSON.stringify(despatches));
}

addBtn.addEventListener('click', function() {
    window.location.href = 'despatchout.html';
});

cancelBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    despatchForm.reset();
    isEditing = false;
    editingRow = null;
});

despatchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const code = despatchCodeInput.value.trim();
    const customerName = customerNameSelect.value;
    const totalAmount = totalAmountInput.value.trim();
    const date = despatchDateInput.value;
    const status = statusSelect.value === '未开票' ? '未开票' : '已开票';

    if (code && customerName && totalAmount && date && status) {
        const despatchData = { code, customerName, totalAmount, date, status };

        if (isEditing && editingRow) {
            editingRow.cells[0].textContent = code;
            editingRow.cells[1].textContent = customerName;
            editingRow.cells[2].textContent = formatAmount(totalAmount);
            editingRow.cells[3].textContent = date;
            editingRow.cells[4].textContent = status === '未开票' ? 'No Facturado' : 'Facturado';
            saveDespatchData(despatchData);
        } else {
            const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
            if (existingCodes.includes(code)) {
                alert('¡Nº de envío ya existe, usa uno único!');
                return;
            }
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${code}</td>
                <td>${customerName}</td>
                <td>${formatAmount(totalAmount)}</td>
                <td>${date}</td>
                <td>${status === '未开票' ? 'No Facturado' : 'Facturado'}</td>
                <td>
                    <span class="action-icon view-icon" data-code="${code}"><i class="fas fa-eye"></i></span>
                    <span class="action-icon edit-icon" data-code="${code}"><i class="fas fa-edit"></i></span>
                    <span class="action-icon delete-icon" data-code="${code}"><i class="fas fa-trash-alt"></i></span>
                </td>
            `;
            tbody.appendChild(newRow);
            saveDespatchData(despatchData);
        }

        modal.style.display = 'none';
        despatchForm.reset();
        isEditing = false;
        editingRow = null;
        updateTable();
    }
});

function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            window.open(`despatchout.html?code=${encodeURIComponent(code)}&view=true`, '_blank');
        });
    });

    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            window.open(`despatchout.html?code=${encodeURIComponent(code)}&edit=true`, '_blank');
        });
    });

    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
            const index = despatches.findIndex(d => d.code === code);
            if (index !== -1 && confirm(`¿Seguro de eliminar envío: ${code}?`)) {
                despatches.splice(index, 1);
                localStorage.setItem('despatches', JSON.stringify(despatches));
                const despatchList = JSON.parse(localStorage.getItem('despatchList') || '[]');
                const updatedDespatchList = despatchList.filter(item => item.despatchCode !== code);
                localStorage.setItem('despatchList', JSON.stringify(updatedDespatchList));
                updateTable();
            }
        });
    });
}

window.addEventListener('storage', function() {
    updateTable();
});

const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

let filteredData = JSON.parse(localStorage.getItem('despatches') || '[]');

function applyFilters(formData) {
    const filters = {
        despatchCode: formData.get('despatchCode')?.toLowerCase().trim(),
        customerName: formData.get('customerName')?.toLowerCase().trim(),
        despatchDateFrom: formData.get('despatchDateFrom'),
        despatchDateTo: formData.get('despatchDateTo'),
        totalAmount: formData.get('totalAmount') ? Number(formData.get('totalAmount')) : null,
        status: formData.get('status')
    };

    filteredData = JSON.parse(localStorage.getItem('despatches') || '[]').filter(item => {
        let matches = true;

        if (filters.despatchCode) matches = matches && item.code.toLowerCase().includes(filters.despatchCode);
        if (filters.customerName) matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
        if (filters.despatchDateFrom || filters.despatchDateTo) {
            const despatchDate = new Date(item.date);
            if (filters.despatchDateFrom) matches = matches && despatchDate >= new Date(filters.despatchDateFrom);
            if (filters.despatchDateTo) matches = matches && despatchDate <= new Date(filters.despatchDateTo);
        }
        if (filters.totalAmount !== null) matches = matches && Number(item.totalAmount) === filters.totalAmount;
        if (filters.status) matches = matches && item.status === filters.status;

        return matches;
    });
}

function updateTableWithFilter() {
    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const currentData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentData.forEach((despatch) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${despatch.code}</td>
            <td>${despatch.customerName}</td>
            <td>${formatAmount(despatch.totalAmount)}</td>
            <td>${despatch.date}</td>
            <td>${despatch.status === '未开票' ? 'No Facturado' : 'Facturado'}</td>
            <td>
                <span class="action-icon view-icon" data-code="${despatch.code}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-code="${despatch.code}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-code="${despatch.code}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination(totalPages);
    bindIconEvents();
}

function toggleFilterPanel() {
    filterPanel.classList.toggle('active');
}

function closeFilterPanel() {
    filterPanel.classList.remove('active');
}

function resetFilterForm() {
    filterForm.reset();
    filteredData = JSON.parse(localStorage.getItem('despatches') || '[]');
    currentPage = 1;
    updateTableWithFilter();
}

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

document.addEventListener('DOMContentLoaded', function() {
    loadCustomersIntoSelect();
    updateTable();
    initFilter();
});