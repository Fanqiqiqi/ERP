// order.js

// 初始化下拉菜单为隐藏状态
document.querySelectorAll('.dropdown-menu').forEach(menu => {
  menu.style.display = 'none';
});

// 下拉菜单切换功能 - 绑定所有下拉菜单
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

// 点击菜单项跳转或切换内容
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

// 点击顶部标题跳转到主页
document.querySelector('.top-bar h1').addEventListener('click', function() {
  window.location.href = 'index.html';
});

// 模态框相关元素
const modal = document.getElementById('addOrderModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const orderForm = document.getElementById('orderForm');
const orderCodeInput = document.getElementById('orderCode');
const customerNameSelect = document.getElementById('customerName');
const totalAmountInput = document.getElementById('totalAmount');
const orderDateInput = document.getElementById('orderDate');
const tbody = document.querySelector('.order-table tbody');

let isEditing = false;
let editingRow = null;

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 加载客户到下拉框
function loadCustomersIntoSelect() {
  const customers = JSON.parse(localStorage.getItem('customers')) || [];
  customerNameSelect.innerHTML = '<option value="">请选择客户</option>';
  customers.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.name;
    option.textContent = customer.name;
    customerNameSelect.appendChild(option);
  });
}

// 更新表格函数（带分页）
function loadOrders() {
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];

  // 计算总页数
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, orders.length);
  
  // Sort orders by date in descending order (latest first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  
  const currentData = sortedOrders.slice(startIndex, endIndex);
  
  tbody.innerHTML = '';
  currentData.forEach((order, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // 计算全局索引
    const orderList = JSON.parse(localStorage.getItem('orderList')) || [];
    const orderItems = orderList.filter(item => item.orderCode === order.code);
    const firstItem = orderItems[0];
    const product = firstItem ? products.find(p => p.code === firstItem.productCode) : null;
    const currency = product ? product.currency || '' : '';

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${order.code}</td>
        <td>${order.customerName}</td>
        <td>${order.totalAmount} ${currency}</td>
        <td>${order.date}</td>
        <td>
            <span class="action-icon view-icon" data-code="${order.code}"><i class="fas fa-eye"></i></span>
            <span class="action-icon edit-icon" data-code="${order.code}"><i class="fas fa-edit"></i></span>
            <span class="action-icon delete-icon" data-code="${order.code}"><i class="fas fa-trash-alt"></i></span>
        </td>
    `;
    tbody.appendChild(row);
  });
  
  // 更新分页控件
  updatePagination(totalPages);
  bindIconEvents();
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
      loadOrders();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadOrders();
    }
  });
}

// 保存订单数据到 localStorage
function saveOrderData(orderData) {
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const orderIndex = orders.findIndex(o => o.code === orderData.code);
  if (orderIndex >= 0) {
    orders[orderIndex] = orderData;
  } else {
    orders.push(orderData);
  }
  localStorage.setItem('orders', JSON.stringify(orders));
}

// 添加订单 - 跳转到新页面
addBtn.addEventListener('click', function() {
  window.location.href = 'add-order.html';
});

// 取消按钮 - 关闭模态框
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  orderForm.reset();
  isEditing = false;
  editingRow = null;
});

// 保存或更新订单（仅用于编辑模式）
orderForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const code = orderCodeInput.value.trim();
  const customerName = customerNameSelect.value;
  const totalAmount = totalAmountInput.value.trim();
  const date = orderDateInput.value;

  if (code && customerName && totalAmount && date) {
    const orderData = {
      code,
      customerName,
      totalAmount,
      date
    };

    if (isEditing && editingRow) {
      editingRow.cells[0].textContent = code;
      editingRow.cells[1].textContent = customerName;
      editingRow.cells[2].textContent = totalAmount;
      editingRow.cells[3].textContent = date;
      saveOrderData(orderData);
    } else {
      const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
      if (existingCodes.includes(code)) {
        alert('订单编号已存在，请使用唯一的编号！');
        return;
      }
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
          <td>${code}</td>
          <td>${customerName}</td>
          <td>${totalAmount}</td>
          <td>${date}</td>
          <td>
              <span class="action-icon view-icon"><i class="fas fa-eye"></i></span>
              <span class="action-icon edit-icon"><i class="fas fa-edit"></i></span>
              <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
          </td>
      `;
      tbody.appendChild(newRow);
      saveOrderData(orderData);
    }

    modal.style.display = 'none';
    orderForm.reset();
    isEditing = false;
    editingRow = null;
    loadOrders(); // 更新表格和分页
  }
});

// 操作图标事件绑定
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

// 查看事件 - 跳转到 add-order.html
const viewHandler = function() {
  const code = this.getAttribute('data-code');
  window.open(`add-order.html?code=${encodeURIComponent(code)}&view=true`, '_blank');
};

// 编辑事件 - 跳转到 add-order.html
const editHandler = function() {
  const code = this.getAttribute('data-code');
  window.open(`add-order.html?code=${encodeURIComponent(code)}&edit=true`, '_blank');
};

// 删除事件
const deleteHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  if (confirm(`确定删除订单：${code} 吗？`)) {
    row.remove();
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const updatedOrders = orders.filter(o => o.code !== code);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    const orderList = JSON.parse(localStorage.getItem('orderList')) || [];
    const updatedOrderList = orderList.filter(item => item.orderCode !== code);
    localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
    loadOrders(); // 更新表格和分页
  }
};

// --- 新增筛选功能 ---
// DOM 元素
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

// 筛选后的数据
let filteredData = JSON.parse(localStorage.getItem('orders') || '[]');

// 应用筛选条件
function applyFilters(formData) {
  const filters = {
    orderCode: formData.get('orderCode')?.toLowerCase().trim(),
    customerName: formData.get('customerName')?.toLowerCase().trim(),
    orderDateFrom: formData.get('orderDateFrom'),
    orderDateTo: formData.get('orderDateTo'),
    totalAmount: formData.get('totalAmount') ? Number(formData.get('totalAmount')) : null,
    status: formData.get('status') // 如果订单没有状态字段，可以忽略此项
  };

  filteredData = JSON.parse(localStorage.getItem('orders') || '[]').filter(item => {
    let matches = true;

    if (filters.orderCode) {
      matches = matches && item.code.toLowerCase().includes(filters.orderCode);
    }

    if (filters.customerName) {
      matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
    }

    if (filters.orderDateFrom || filters.orderDateTo) {
      const orderDate = new Date(item.date);
      if (filters.orderDateFrom) {
        matches = matches && orderDate >= new Date(filters.orderDateFrom);
      }
      if (filters.orderDateTo) {
        matches = matches && orderDate <= new Date(filters.orderDateTo);
      }
    }

    if (filters.totalAmount !== null) {
      matches = matches && Number(item.totalAmount) === filters.totalAmount;
    }

    if (filters.status) {
      // 如果订单数据中没有状态字段，此条件将始终为 false，除非添加状态逻辑
      matches = matches && item.status === filters.status;
    }

    return matches;
  });
}

// 更新表格（使用筛选数据）
function updateTableWithFilter() {
  const products = JSON.parse(localStorage.getItem('products') || '[]');

  // 按日期降序排序
  filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 计算总页数
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  // 清空表格并填充当前页数据
  tbody.innerHTML = '';
  currentData.forEach((order, pageIndex) => {
    const globalIndex = startIndex + pageIndex;
    const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
    const orderItems = orderList.filter(item => item.orderCode === order.code);
    const firstItem = orderItems[0];
    const product = firstItem ? products.find(p => p.code === firstItem.productCode) : null;
    const currency = product ? product.currency || '' : '';

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${order.code}</td>
        <td>${order.customerName}</td>
        <td>${order.totalAmount} ${currency}</td>
        <td>${order.date}</td>
        <td>
            <span class="action-icon view-icon" data-code="${order.code}"><i class="fas fa-eye"></i></span>
            <span class="action-icon edit-icon" data-code="${order.code}"><i class="fas fa-edit"></i></span>
            <span class="action-icon delete-icon" data-code="${order.code}"><i class="fas fa-trash-alt"></i></span>
        </td>
    `;
    tbody.appendChild(row);
  });

  // 更新分页控件
  updatePagination(totalPages);
  bindIconEvents();
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
  filteredData = JSON.parse(localStorage.getItem('orders') || '[]');
  currentPage = 1;
  updateTableWithFilter();
}

// 初始化筛选功能
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadCustomersIntoSelect();
  loadOrders(); // 初始加载使用原始 loadOrders
  initFilter(); // 初始化筛选功能
});

// 监听 storage 事件以实时更新
window.addEventListener('storage', function() {
  loadOrders();
});