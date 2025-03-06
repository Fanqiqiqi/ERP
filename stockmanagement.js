// stockmanagement.js
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
      if (menu !== dropdownMenu) {
        menu.style.display = 'none';
      }
    });

    dropdownMenu.style.display = isOpen ? 'none' : 'block';

    if (!isOpen) {
      const togglePosition = toggle.getBoundingClientRect().top;
      const sidebarPosition = sidebar.getBoundingClientRect().top;
      const offset = togglePosition - sidebarPosition;
      sidebar.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  });
});

document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', function(e) {
    if (this.classList.contains('dropdown-toggle')) return;
    e.preventDefault();
    const page = this.getAttribute('data-page');
    if (page) {
      window.location.href = page;
    } else {
      const section = this.textContent;
      const content = document.querySelector('.content');
      content.innerHTML = `
          <h2>${section}</h2>
          <p>这里是${section}的内容区域。</p>
        `;
    }
  });
});

document.querySelector('.top-bar h1').addEventListener('click', function() {
  window.location.href = 'index.html';
});

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

const itemsPerPage = 9;
let currentPage = 1;
let filteredData = [...stockData]; // 用于筛选的数据副本

function updateTable() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((item, pageIndex) => {
    const globalIndex = stockData.indexOf(item); // 使用原始数据中的索引
    const tr = document.createElement('tr');
    const formattedAmount = parseFloat(item.amount || '0.00').toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    tr.innerHTML = `
      <td>${item.productCode}</td>
      <td>${item.productName}</td>
      <td>${item.supplierName || '未指定'}</td> <!-- 新增供应商名称 -->
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

  updatePagination(totalPages);
  bindActionEvents();
}

function updatePagination(totalPages) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
    <span>第 ${currentPage} 页 / 共 ${totalPages} 页</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
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
}

function bindActionEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      alert(`查看库存详情: ${stockData[index].productName}`);
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
      if (confirm(`确定要删除 ${stockData[index].productName} 吗？`)) {
        stockData.splice(index, 1);
        saveStockData();
        filteredData = [...stockData]; // 同步更新筛选数据
        updateTable();
      }
    });
  });
}

// 新增筛选功能：应用筛选条件
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

// 显示/隐藏筛选框
function toggleFilterPanel() {
  filterPanel.classList.toggle('active');
}

// 关闭筛选框
function closeFilterPanel() {
  filterPanel.classList.remove('active');
}

// 重置筛选表单
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
        productName: `未知产品_${productCode}`,
        quantity: adjustQuantity,
        lote: '',
        amount: '0.00',
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }

    saveStockData();
    filteredData = [...stockData]; // 同步更新筛选数据
    updateTable();
    modal.style.display = 'none';
  });

  // 新增筛选功能的事件绑定
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
}

document.addEventListener('DOMContentLoaded', init);