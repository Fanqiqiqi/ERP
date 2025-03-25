let stockData = JSON.parse(localStorage.getItem('stockData')) || [];

const tbody = document.getElementById('stockTableBody');
const adjustBtn = document.querySelector('.adjust-btn');
const searchBtn = document.querySelector('.search-btn');
const modal = document.getElementById('adjustStockModal');
const form = document.getElementById('adjustStockForm');
const cancelBtn = document.querySelector('.cancel-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');
const totalStockValue = document.getElementById('totalStockValue'); // 新增：获取总金额元素

const itemsPerPage = 9;
let currentPage = 1;
let filteredData = [...stockData];

// 新增：计算库存总金额
function calculateTotalStockValue(data) {
  const total = data.reduce((sum, item) => {
    const amount = parseFloat(item.amount || '0.00');
    return sum + amount;
  }, 0);
  return total.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function updateTable() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((item, pageIndex) => {
    const globalIndex = stockData.indexOf(item);
    const formattedAmount = parseFloat(item.amount || '0.00').toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.productCode}</td>
      <td>${item.productName}</td>
      <td>${item.supplierName || 'No especificado'}</td>
      <td>${item.quantity}</td>
      <td>${item.lote || ''}</td>
      <td>${formattedAmount} €</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon adjust-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash"></i></span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 更新总金额显示
  totalStockValue.textContent = `Total: ${calculateTotalStockValue(filteredData)} €`;

  updatePagination(totalPages);
  bindActionEvents();
}

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

function saveStockData() {
  localStorage.setItem('stockData', JSON.stringify(stockData));
  console.log('StockData guardado:', stockData);
}

function bindActionEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      alert(`Ver detalles del inventario: ${stockData[index].productName}`);
    });
  });

  document.querySelectorAll('.adjust-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      document.getElementById('productCode').value = stockData[index].productCode;
      document.getElementById('adjustQuantity').value = '';
      modal.style.display = 'flex';
    });
  });

  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      if (confirm(`¿Seguro que desea eliminar ${stockData[index].productName}?`)) {
        stockData.splice(index, 1);
        saveStockData();
        filteredData = [...stockData];
        updateTable();
      }
    });
  });
}

function applyFilters(formData) {
  const filters = {
    productCode: formData.get('productCode')?.toLowerCase().trim(),
    productName: formData.get('productName')?.toLowerCase().trim(),
    lote: formData.get('lote')?.toLowerCase().trim()
  };

  filteredData = stockData.filter(item => {
    let matches = true;

    if (filters.productCode) {
      matches = matches && item.productCode.toLowerCase().includes(filters.productCode);
    }

    if (filters.productName) {
      matches = matches && item.productName.toLowerCase().includes(filters.productName);
    }

    if (filters.lote) {
      matches = matches && (item.lote || '').toLowerCase().includes(filters.lote);
    }

    return matches;
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
  filteredData = [...stockData];
  currentPage = 1;
  updateTable();
}

function init() {
  updateTable();

  adjustBtn.addEventListener('click', () => {
    document.getElementById('productCode').value = '';
    document.getElementById('adjustQuantity').value = '';
    modal.style.display = 'flex';
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const productCode = document.getElementById('productCode').value.trim();
    const adjustQuantity = parseInt(document.getElementById('adjustQuantity').value);

    const index = stockData.findIndex(item => item.productCode === productCode);
    if (index !== -1) {
      stockData[index].quantity += adjustQuantity;
      stockData[index].lastUpdated = new Date().toISOString().split('T')[0];
    } else {
      stockData.push({
        productCode,
        productName: `Producto desconocido_${productCode}`,
        quantity: adjustQuantity,
        lote: '',
        amount: '0.00',
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }

    saveStockData();
    filteredData = [...stockData];
    updateTable();
    modal.style.display = 'none';
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

  window.addEventListener('storage', function() {
    stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    filteredData = [...stockData];
    updateTable();
    console.log('StockData actualizado en tiempo real:', stockData);
  });
}

document.addEventListener('DOMContentLoaded', init);