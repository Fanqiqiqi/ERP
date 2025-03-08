

// 表单元素
const addBtn = document.querySelector('.add-btn');
const tbody = document.querySelector('.product-table tbody');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 从 localStorage 中加载产品类别
function loadProductCategories() {
  const categories = JSON.parse(localStorage.getItem('pcategories') || '[]');
  const productCategorySelect = document.getElementById('productCategory');
  if (productCategorySelect) { // 防止在 product.html 中报错
    productCategorySelect.innerHTML = '<option value="">请选择类别</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.code;
      option.textContent = category.name;
      productCategorySelect.appendChild(option);
    });
  }
}

// 计算总价（含税）
function calculateTotalPrice(price, taxRate) {
  const priceNum = parseFloat(price) || 0;
  const taxRateNum = parseFloat(taxRate) || 0;
  const totalPrice = priceNum * (1 + taxRateNum);
  return totalPrice.toFixed(2);
}

// 货币符号映射
const currencySymbols = {
  'EUR': '€',
  'USD': '$',
  'CNY': '¥',
  '': '' // 默认无符号
};

// 加载产品数据（带分页）
function loadProducts() {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  tbody.innerHTML = '';

  // 计算总页数
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const currentData = products.slice(startIndex, endIndex);

  currentData.forEach((product, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // 计算全局索引
    const totalPrice = calculateTotalPrice(product.purchasePrice, product.taxRate);
    const currencySymbol = currencySymbols[product.currency] || product.currency || '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.code}</td>
      <td>${product.name}</td>
      <td>${product.category || ''}</td>
      <td>${product.purchasePrice} ${currencySymbol}</td>
      <td>${totalPrice} ${currencySymbol}</td>
      <td>${product.description}</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
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
  let pagination = document.querySelector('.pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'pagination';
    document.querySelector('.content').appendChild(pagination);
  }

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
    <span>第 ${currentPage} 页 / 共 ${totalPages} 页</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
  `;

  pagination.querySelector('.prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadProducts();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadProducts();
    }
  });
}

// 保存产品数据
function saveProducts() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const products = rows.map(row => {
    const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const existingProduct = existingProducts.find(p => p.code === row.cells[0].textContent) || {};
    const priceText = row.cells[3].textContent.split(' ')[0]; // 提取价格部分
    const editedProduct = JSON.parse(sessionStorage.getItem('editProduct') || '{}');
    return {
      code: row.cells[0].textContent,
      name: row.cells[1].textContent,
      category: row.cells[2].textContent,
      purchasePrice: priceText,
      description: row.cells[5].textContent,
      supplierProductCode: existingProduct.supplierProductCode || '',
      supplierProductName: existingProduct.supplierProductName || '',
      unit: existingProduct.unit || '',
      specification: existingProduct.specification || '',
      price: priceText, // 兼容旧数据
      sellingPrice: existingProduct.sellingPrice || '',
      retailPrice: existingProduct.retailPrice || '',
      taxRate: existingProduct.taxRate || editedProduct.taxRate || '0%',
      currency: existingProduct.currency || '',
      safetyStock: existingProduct.safetyStock || '',
      photo: existingProduct.photo || ''
    };
  });
  localStorage.setItem('products', JSON.stringify(products));
}

// 打开添加产品页面
addBtn.addEventListener('click', function() {
  window.location.href = 'add-product.html';
});

// 绑定查看、编辑和删除图标事件
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

// 查看事件
const viewHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === code);
  sessionStorage.setItem('viewProduct', JSON.stringify(product));
  window.location.href = 'add-product.html?mode=view';
};

// 编辑事件
const editHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === code);
  sessionStorage.setItem('editProduct', JSON.stringify(product));
  window.location.href = 'add-product.html?mode=edit';
};

// 删除事件
const deleteHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  if (confirm(`确定删除产品：${code} 吗？`)) {
    row.remove();
    saveProducts();
    loadProducts(); // 刷新表格以更新分页
  }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadProductCategories();
  loadProducts();
});