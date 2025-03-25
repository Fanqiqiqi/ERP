// receivables.js
let receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');

const tbody = document.getElementById('receivables-body');
const addBtn = document.querySelector('.add-btn');
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

const itemsPerPage = 9;
let currentPage = 1;
let filteredData = [...receivablesData];

document.addEventListener('DOMContentLoaded', function() {
  updateTable();

  addBtn.addEventListener('click', () => {
    window.location.href = 'receivableslist.html';
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

  bindActionEvents();
});

function applyFilters(formData) {
  const filters = {
    customerName: formData.get('customerName')?.toLowerCase().trim(),
    invoiceDateFrom: formData.get('invoiceDateFrom'),
    invoiceDateTo: formData.get('invoiceDateTo'),
    dueDateFrom: formData.get('dueDateFrom'),
    dueDateTo: formData.get('dueDateTo'),
    status: formData.get('status')
  };

  filteredData = receivablesData.filter(item => {
    let matches = true;

    if (filters.customerName) {
      matches = matches && (item.customerName || '').toLowerCase().includes(filters.customerName);
    }

    if (filters.invoiceDateFrom || filters.invoiceDateTo) {
      const invoiceDate = new Date(item.invoiceDate);
      if (filters.invoiceDateFrom) {
        matches = matches && invoiceDate >= new Date(filters.invoiceDateFrom);
      }
      if (filters.invoiceDateTo) {
        matches = matches && invoiceDate <= new Date(filters.invoiceDateTo);
      }
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      const dueDate = new Date(item.dueDate);
      if (filters.dueDateFrom) {
        matches = matches && dueDate >= new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        matches = matches && dueDate <= new Date(filters.dueDateTo);
      }
    }

    if (filters.status) {
      matches = matches && item.status === filters.status;
    }

    return matches;
  });
}

function updateTable() {
  // 重新加载 receivablesData，确保与 salesinvoicelist 同步
  receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
  filteredData = [...receivablesData];

  filteredData.sort((a, b) => {
    const invoiceComparison = String(b.receivableNo).localeCompare(String(a.receivableNo));
    if (invoiceComparison !== 0) {
      return invoiceComparison;
    }
    const dateA = new Date(a.invoiceDate);
    const dateB = new Date(b.invoiceDate);
    return dateB - dateA;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((item, pageIndex) => {
    const globalIndex = receivablesData.indexOf(item);
    const formattedAmount = parseFloat(item.amount).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const displayInvoiceNo = (item.receivableNo || 'N/A').replace('REC-', '');

    const tr = document.createElement('tr'); // 创建 tr 元素
    tr.innerHTML = `
      <td>${displayInvoiceNo}</td>
      <td>${item.customerName || 'N/A'}</td>
      <td>${item.invoiceDate}</td>
      <td>${item.dueDate}</td>
      <td>${formattedAmount} ${item.currency || '€'}</td>
      <td class="${item.status === 'Pagado' ? 'status-paid' : item.status === 'Parcial' ? 'status-partial' : 'status-unpaid'}">${item.status || 'No Pagado'}</td>
      <td>
        <span class="action-icon adjust-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updatePagination(totalPages);
  bindActionEvents();
}

function updatePagination(totalPages) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
    <span>Pág. ${currentPage} / Total ${totalPages}</span>
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

function bindActionEvents() {
  document.querySelectorAll('.adjust-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const receivableNo = receivablesData[index].receivableNo;
      window.location.href = `receivableslist.html?receivableNo=${encodeURIComponent(receivableNo)}&edit=true`;
    });
  });
}

function toggleFilterPanel() {
  filterPanel.classList.toggle('active');
}

function closeFilterPanel() {
  filterPanel.classList.remove('active');
}

function resetFilterForm() {
  filterForm.reset();
  filteredData = [...receivablesData];
  currentPage = 1;
  updateTable();
}