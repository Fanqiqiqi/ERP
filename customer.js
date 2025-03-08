
// 模态框相关元素
const modal = document.getElementById('addCustomerModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const customerForm = document.getElementById('customerForm');
const customerCodeInput = document.getElementById('customerCode');
const customerNameInput = document.getElementById('customerName');
const taxNumberInput = document.getElementById('taxNumber');
const customerAddressInput = document.getElementById('customerAddress');
const postalCodeInput = document.getElementById('postalCode');
const cityInput = document.getElementById('city');
const provinceInput = document.getElementById('province');
const countryInput = document.getElementById('country');
const emailInput = document.getElementById('email');
const customerPhoneInput = document.getElementById('customerPhone');
const customerCategorySelect = document.getElementById('customerCategory');
const priceCategorySelect = document.getElementById('priceCategory');
const statusSelect = document.getElementById('status');
const contactPersonInput = document.getElementById('contactPerson');
const contactPhoneInput = document.getElementById('contactPhone');
const paymentTermsInput = document.getElementById('paymentTerms');
const remarksInput = document.getElementById('remarks');
const tbody = document.querySelector('.customer-table tbody');
const generateCodeBtn = document.getElementById('generateCodeBtn');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

let isEditing = false;
let editingRow = null;

// 生成客户代码（仅生成候选代码，不更新计数器）
function generateCustomerCode() {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const customerRule = codeRules['customer'] || { prefix: 'CUS', digits: 3, suffix: '', counter: 0 };
  
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const existingCodes = customers.map(c => c.code);
  
  let counter = customerRule.counter || 0;
  let newCode;
  do {
    counter++;
    const number = String(counter).padStart(customerRule.digits, '0');
    newCode = `${customerRule.prefix}${number}${customerRule.suffix}`;
  } while (existingCodes.includes(newCode));
  
  // 不立即保存 counter，只返回候选代码
  return newCode;
}

// 更新计数器（在保存时调用）
function updateCustomerCodeCounter(code) {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const customerRule = codeRules['customer'] || { prefix: 'CUS', digits: 3, suffix: '', counter: 0 };
  
  const numberPart = parseInt(code.replace(customerRule.prefix, '').replace(customerRule.suffix, ''), 10);
  if (numberPart > customerRule.counter) {
    customerRule.counter = numberPart;
    codeRules['customer'] = customerRule;
    localStorage.setItem('codeRules', JSON.stringify(codeRules));
  }
}

// 加载客户类别到下拉框
function loadCategoriesIntoSelect() {
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  customerCategorySelect.innerHTML = '<option value="">请选择类别</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    customerCategorySelect.appendChild(option);
  });
}

// 加载价格表类别到下拉框
function loadPriceCategoriesIntoSelect() {
  const prices = JSON.parse(localStorage.getItem('prices') || '[]');
  priceCategorySelect.innerHTML = '<option value="">请选择价格表类别</option>';
  prices.forEach(price => {
    const option = document.createElement('option');
    option.value = price.category;
    option.textContent = price.category;
    priceCategorySelect.appendChild(option);
  });
}

// 设置表单字段只读状态
function setFormReadOnly(isReadOnly) {
  const inputs = document.querySelectorAll('#customerForm input, #customerForm select');
  inputs.forEach(input => {
    if (isReadOnly) {
      input.setAttribute('readonly', 'readonly');
      if (input.tagName === 'SELECT') input.setAttribute('disabled', 'disabled');
    } else {
      input.removeAttribute('readonly');
      if (input.tagName === 'SELECT') input.removeAttribute('disabled');
    }
  });
}

// 更新表格行
function updateTableRow(row, data) {
  row.cells[0].textContent = data.code;
  row.cells[1].textContent = data.name;
  row.cells[2].textContent = data.category;
  row.cells[3].textContent = data.address;
  row.cells[4].textContent = data.phone;
}

// 创建表格行
function createTableRow(data, index) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${data.code}</td>
    <td>${data.name}</td>
    <td>${data.category}</td>
    <td>${data.address}</td>
    <td>${data.phone}</td>
    <td>
      <span class="action-icon view-icon" data-index="${index}"><i class="fas fa-eye"></i></span>
      <span class="action-icon edit-icon" data-index="${index}"><i class="fas fa-edit"></i></span>
      <span class="action-icon delete-icon" data-index="${index}"><i class="fas fa-trash-alt"></i></span>
    </td>
  `;
  return row;
}

// 加载客户数据（带分页）
function loadCustomers() {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  tbody.innerHTML = '';

  // 计算总页数
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, customers.length);
  const currentData = customers.slice(startIndex, endIndex);

  currentData.forEach((customer, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // 计算全局索引
    const row = createTableRow(customer, globalIndex);
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
      loadCustomers();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCustomers();
    }
  });
}

// 保存客户数据到 localStorage
function saveCustomerData(customerData) {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customerIndex = customers.findIndex(c => c.code === customerData.code);
  if (customerIndex >= 0) {
    customers[customerIndex] = customerData;
  } else {
    customers.push(customerData);
  }
  localStorage.setItem('customers', JSON.stringify(customers));
}

// 添加客户
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = '添加新客户';
  customerForm.reset();
  customerCodeInput.removeAttribute('readonly');
  loadCategoriesIntoSelect();
  loadPriceCategoriesIntoSelect();
  setFormReadOnly(false);
  generateCodeBtn.style.display = 'block';
  modal.style.display = 'flex';
});

// 取消按钮
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  customerForm.reset();
  isEditing = false;
  editingRow = null;
});

// 保存或更新客户
customerForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const customerData = {
    code: customerCodeInput.value.trim(),
    name: customerNameInput.value.trim(),
    taxNumber: taxNumberInput.value.trim(),
    address: customerAddressInput.value.trim(),
    postalCode: postalCodeInput.value.trim(),
    city: cityInput.value.trim(),
    province: provinceInput.value.trim(),
    country: countryInput.value.trim(),
    email: emailInput.value.trim(),
    phone: customerPhoneInput.value.trim(),
    category: customerCategorySelect.value,
    priceCategory: priceCategorySelect.value,
    status: statusSelect.value,
    contactPerson: contactPersonInput.value.trim(),
    contactPhone: contactPhoneInput.value.trim(),
    paymentTerms: paymentTermsInput.value.trim(),
    remarks: remarksInput.value.trim()
  };

  const requiredFields = ['code', 'name', 'taxNumber', 'address', 'postalCode', 'city', 'province', 'country', 'email', 'phone', 'category', 'status'];
  if (requiredFields.every(field => customerData[field])) {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const existingCustomer = customers.find(c => c.taxNumber === customerData.taxNumber && c.code !== customerData.code);
    const existingSupplier = suppliers.find(s => s.taxNumber === customerData.taxNumber);

    if (existingCustomer || existingSupplier) {
      alert('此税号已存在，请使用唯一的税号！');
      return;
    }

    if (!isEditing && customers.map(c => c.code).includes(customerData.code)) {
      alert('客户代码已存在，请使用唯一的代码！');
      return;
    }

    // 如果是新增客户，保存时更新计数器
    if (!isEditing) {
      updateCustomerCodeCounter(customerData.code);
    }

    if (isEditing && editingRow) {
      updateTableRow(editingRow, customerData);
      saveCustomerData(customerData);
    } else {
      const newRow = createTableRow(customerData, customers.length); // 全局索引在 loadCustomers 中重新分配
      tbody.appendChild(newRow);
      saveCustomerData(customerData);
    }

    modal.style.display = 'none';
    customerForm.reset();
    isEditing = false;
    editingRow = null;
    loadCustomers();
    // window.location.href = 'customer.html'; // 移除刷新页面，直接通过 loadCustomers 更新
  } else {
    alert('请填写所有必填字段！');
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

// 查看事件
const viewHandler = function() {
  const index = this.dataset.index;
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customer = customers[index] || {};

  modalTitle.textContent = '查看客户';
  customerCodeInput.value = customer.code || '';
  customerNameInput.value = customer.name || '';
  taxNumberInput.value = customer.taxNumber || '';
  customerAddressInput.value = customer.address || '';
  postalCodeInput.value = customer.postalCode || '';
  cityInput.value = customer.city || '';
  provinceInput.value = customer.province || '';
  countryInput.value = customer.country || '';
  emailInput.value = customer.email || '';
  customerPhoneInput.value = customer.phone || '';
  contactPersonInput.value = customer.contactPerson || '';
  contactPhoneInput.value = customer.contactPhone || '';
  paymentTermsInput.value = customer.paymentTerms || '';
  remarksInput.value = customer.remarks || '';
  loadCategoriesIntoSelect();
  customerCategorySelect.value = customer.category || '';
  loadPriceCategoriesIntoSelect();
  priceCategorySelect.value = customer.priceCategory || '';
  statusSelect.value = customer.status || '启用';
  setFormReadOnly(true);
  generateCodeBtn.style.display = 'none';
  modal.style.display = 'flex';
};

// 编辑事件
const editHandler = function() {
  const index = this.dataset.index;
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customer = customers[index] || {};

  isEditing = true;
  editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage]; // 调整为当前页的相对索引
  modalTitle.textContent = '编辑客户';
  customerCodeInput.value = customer.code || '';
  customerNameInput.value = customer.name || '';
  taxNumberInput.value = customer.taxNumber || '';
  customerAddressInput.value = customer.address || '';
  postalCodeInput.value = customer.postalCode || '';
  cityInput.value = customer.city || '';
  provinceInput.value = customer.province || '';
  countryInput.value = customer.country || '';
  emailInput.value = customer.email || '';
  customerPhoneInput.value = customer.phone || '';
  contactPersonInput.value = customer.contactPerson || '';
  contactPhoneInput.value = customer.contactPhone || '';
  paymentTermsInput.value = customer.paymentTerms || '';
  remarksInput.value = customer.remarks || '';
  loadCategoriesIntoSelect();
  customerCategorySelect.value = customer.category || '';
  loadPriceCategoriesIntoSelect();
  priceCategorySelect.value = customer.priceCategory || '';
  statusSelect.value = customer.status || '启用';
  setFormReadOnly(false);
  customerCodeInput.setAttribute('readonly', 'readonly');
  generateCodeBtn.style.display = 'none';
  modal.style.display = 'flex';
};

// 删除事件
const deleteHandler = function() {
  const index = this.dataset.index;
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const code = customers[index].code;
  if (confirm(`确定删除客户：${code} 吗？`)) {
    customers.splice(index, 1);
    localStorage.setItem('customers', JSON.stringify(customers));
    loadCustomers();
  }
};

// 生成代码按钮事件
generateCodeBtn.addEventListener('click', function() {
  if (!isEditing) {
    const newCode = generateCustomerCode();
    customerCodeInput.value = newCode;
  }
});

// 监听 storage 事件
window.addEventListener('storage', function() {
  loadPriceCategoriesIntoSelect();
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadCategoriesIntoSelect();
  loadCustomers();
  loadPriceCategoriesIntoSelect();
});