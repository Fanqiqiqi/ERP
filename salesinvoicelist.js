// salesinvoicelist.js
// 初始化发票数据
let invoiceData = JSON.parse(localStorage.getItem('invoiceData')) || [];

// DOM 元素
const tbody = document.getElementById('invoiceTableBody');
const createBtn = document.querySelector('.create-btn');
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码
let filteredData = [...invoiceData]; // 用于存储筛选后的数据

// 格式化金额为千位制
function formatNumber(number) {
  return Number(number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 应用筛选条件
function applyFilters(formData) {
  const filters = {
    invoiceNumber: formData.get('invoiceNumber')?.toLowerCase().trim(),
    customerName: formData.get('customerName')?.toLowerCase().trim(),
    invoiceDateFrom: formData.get('invoiceDateFrom'),
    invoiceDateTo: formData.get('invoiceDateTo'),
    dueDateFrom: formData.get('dueDateFrom'),
    dueDateTo: formData.get('dueDateTo'),
    invoiceAmount: formData.get('invoiceAmount') ? Number(formData.get('invoiceAmount')) : null
  };

  filteredData = invoiceData.filter(item => {
    let matches = true;

    if (filters.invoiceNumber) {
      matches = matches && item.invoiceNumber.toLowerCase().includes(filters.invoiceNumber);
    }

    if (filters.customerName) {
      matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
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

    if (filters.invoiceAmount !== null) {
      matches = matches && Number(item.invoiceAmount) === filters.invoiceAmount;
    }

    return matches;
  });
}

// 更新表格（带分页）
function updateTable() {
  filteredData.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((item, pageIndex) => {
    const globalIndex = invoiceData.indexOf(item); // 使用原始数据中的索引
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.invoiceNumber}</td>
      <td>${item.customerName}</td>
      <td>${item.invoiceDate}</td>
      <td>${item.dueDate}</td>
      <td>${formatNumber(item.invoiceAmount)} €</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updatePagination(totalPages);
  bindActionEvents();
}

// 更新分页控件
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

// 保存到 localStorage
function saveInvoiceData() {
  localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
}

// 获取客户数据
function getCustomers() {
  return JSON.parse(localStorage.getItem('customers') || '[]');
}

// 显示发票详情的模态框
function showInvoiceDetails(index) {
  const invoice = invoiceData[index];
  const invoiceList = JSON.parse(localStorage.getItem('invoiceList') || '[]');
  const details = invoiceList.filter(item => item.invoiceNumber === invoice.invoiceNumber);
  const customers = getCustomers();
  const customer = customers.find(c => c.name === invoice.customerName) || {};

  let detailsHTML = `
    <h3>发票详情 - ${invoice.invoiceNumber}</h3>
    <div class="invoice-info-section">
      <h4>基本信息</h4>
      <p><strong>发票号码:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>发票日期:</strong> ${invoice.invoiceDate}</p>
      <p><strong>到期日期:</strong> ${invoice.dueDate}</p>
      <p><strong>发票金额:</strong> ${invoice.invoiceAmount}</p>
    </div>
    <div class="customer-info-section">
      <h4>客户公司信息</h4>
      <p><strong>公司名称:</strong> ${customer.name || invoice.customerName || '未知'}</p>
      <p><strong>税号:</strong> ${customer.taxNumber || '未提供'}</p>
      <p><strong>地址:</strong> ${customer.address || '未提供'}</p>
      <p><strong>城市:</strong> ${customer.city || '未提供'}</p>
      <p><strong>省份:</strong> ${customer.province || '未提供'}</p>
      <p><strong>电话:</strong> ${customer.phone || '未提供'}</p>
    </div>
    <div class="product-details-section">
      <h4>产品明细</h4>
      <table class="detail-table">
        <thead>
          <tr>
            <th>产品代码</th>
            <th>产品名称</th>
            <th>LOTE</th>
            <th>数量</th>
            <th>销售价格</th>
            <th>税率</th>
            <th>总价</th>
            <th>货币单位</th>
          </tr>
        </thead>
        <tbody>
  `;

  details.forEach(item => {
    detailsHTML += `
      <tr>
        <td>${item.productCode || '未知'}</td>
        <td>${item.productName || '未知'}</td>
        <td>${item.lote || '无'}</td>
        <td>${item.quantity || '0'}</td>
        <td>${item.salePrice || '0.00'}</td>
        <td>${item.taxRate || '0'}%</td>
        <td>${item.totalPrice || '0.00'}</td>
        <td>${item.currency || '未知'}</td>
      </tr>
    `;
  });

  detailsHTML += `
        </tbody>
      </table>
    </div>
    <div class="modal-buttons">
      <button class="close-btn">关闭</button>
    </div>
  `;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `<div class="modal-content">${detailsHTML}</div>`;
  document.body.appendChild(modal);

  modal.querySelector('.close-btn').addEventListener('click', () => {
    modal.remove();
  });
}

// 绑定操作事件
function bindActionEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      showInvoiceDetails(index);
    });
  });

  document.querySelectorAll('.edit-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      window.location.href = `createinvoice.html?invoiceNumber=${encodeURIComponent(invoiceData[index].invoiceNumber)}&edit=true`;
    });
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
  filteredData = [...invoiceData];
  currentPage = 1;
  updateTable();
}

// 初始化页面
function init() {
  updateTable();

  createBtn.addEventListener('click', () => {
    window.location.href = 'createinvoice.html';
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
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);