// supplier.js
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

      // 关闭所有其他下拉菜单
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
          if (menu !== dropdownMenu) {
              menu.style.display = 'none';
          }
      });

      // 切换当前下拉菜单的显示状态
      dropdownMenu.style.display = isOpen ? 'none' : 'block';

      // 如果是展开状态，调整 sidebar 的滚动位置
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

// 初始化供应商数据，从 localStorage 加载或设为空数组
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
let isEditing = false; // 添加编辑状态标志
let tempGeneratedCode = null; // 临时存储生成的代码

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 更新表格函数（带分页）
function updateTable() {
  const tbody = document.querySelector('.supplier-table tbody');
  if (!tbody) return;

  // 计算总页数
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, suppliers.length);
  const currentData = suppliers.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((supplier, pageIndex) => {
      const globalIndex = startIndex + pageIndex; // 计算全局索引
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${supplier.code}</td>
          <td>${supplier.name}</td>
          <td>${supplier.category}</td>
          <td>${supplier.address}</td>
          <td>${supplier.phone}</td>
          <td>
              <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
              <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
              <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
          </td>
      `;
      tbody.appendChild(tr);
  });

  // 更新分页控件
  updatePagination(totalPages);

  console.log('表格已更新，当前 suppliers:', suppliers); // 调试日志
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

// 保存供应商数据到 localStorage
function saveSuppliers() {
  localStorage.setItem('suppliers', JSON.stringify(suppliers));
  console.log('数据已保存到 localStorage:', suppliers); // 调试日志
}

// 从 localStorage 加载供应商类别
function loadSupplierCategories() {
  const categories = JSON.parse(localStorage.getItem('scategories') || '[]');
  const supplierCategorySelect = document.getElementById('supplierCategory');
  supplierCategorySelect.innerHTML = '<option value="">请选择类别</option>';
  categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.code;
      option.textContent = category.name;
      supplierCategorySelect.appendChild(option);
  });
}

// 设置表单字段只读状态
function setFormReadOnly(isReadOnly) {
  const inputs = document.querySelectorAll('#supplierForm input, #supplierForm select');
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

// 生成供应商代码（仅生成，不保存计数器）
function generateSupplierCode() {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const supplierRule = codeRules['supplier'] || { prefix: 'SUP', digits: 3, suffix: '', counter: 0 };
  
  const existingCodes = suppliers.map(s => s.code);
  
  let counter = supplierRule.counter || 0;
  let newCode;
  do {
      counter++;
      const number = String(counter).padStart(supplierRule.digits, '0');
      newCode = `${supplierRule.prefix}${number}${supplierRule.suffix}`;
  } while (existingCodes.includes(newCode));
  
  // 仅返回新代码，不更新 codeRules 到 localStorage
  tempGeneratedCode = { code: newCode, counter: counter }; // 临时存储代码和计数器
  return newCode;
}

// 保存计数器到 localStorage（在保存供应商时调用）
function saveSupplierCodeCounter(counter) {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const supplierRule = codeRules['supplier'] || { prefix: 'SUP', digits: 3, suffix: '', counter: 0 };
  supplierRule.counter = counter;
  codeRules['supplier'] = supplierRule;
  localStorage.setItem('codeRules', JSON.stringify(codeRules));
}

// 初始化函数
function init() {
  const addBtn = document.querySelector('.add-btn');
  const cancelBtn = document.querySelector('.cancel-btn');
  const supplierForm = document.getElementById('supplierForm');
  const modal = document.getElementById('addSupplierModal');
  const generateCodeBtn = document.getElementById('generateCodeBtn');

  if (!addBtn || !cancelBtn || !supplierForm || !modal || !generateCodeBtn) {
      console.error('所需 DOM 元素未找到');
      return;
  }

  // 添加供应商
  addBtn.addEventListener('click', () => {
      isEditing = false;
      loadSupplierCategories();
      supplierForm.reset();
      document.getElementById('supplierCode').removeAttribute('readonly');
      setFormReadOnly(false);
      document.querySelector('.modal-content h3').textContent = '添加新供应商';
      generateCodeBtn.style.display = 'block'; // 显示生成按钮
      tempGeneratedCode = null; // 重置临时代码
      modal.style.display = 'flex';
  });

  // 关闭模态框
  cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      supplierForm.reset();
      isEditing = false;
      tempGeneratedCode = null; // 取消时清空临时代码
  });

  // 生成代码按钮事件
  generateCodeBtn.addEventListener('click', () => {
      if (!isEditing) {
          const newCode = generateSupplierCode();
          document.getElementById('supplierCode').value = newCode;
      }
  });

  // 表单提交
  supplierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('表单提交触发'); // 调试日志

      const formData = new FormData(e.target);
      const newSupplier = {
          code: formData.get('supplierCode'),
          name: formData.get('supplierName'),
          category: formData.get('supplierCategory'),
          address: formData.get('supplierAddress'),
          phone: formData.get('supplierPhone'),
          taxNumber: formData.get('taxNumber'),
          postalCode: formData.get('postalCode'),
          city: formData.get('city'),
          province: formData.get('province'),
          country: formData.get('country'),
          email: formData.get('email'),
          status: formData.get('status')
      };

      // 检查必填字段
      const requiredFields = ['code', 'name', 'category', 'address', 'phone', 'taxNumber', 'postalCode', 'city', 'province', 'country', 'email', 'status'];
      if (!requiredFields.every(field => newSupplier[field])) {
          alert('请填写所有必填字段！');
          return;
      }

      // 检查税号是否在客户或供应商中已存在
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const existingCustomer = customers.find(c => c.taxNumber === newSupplier.taxNumber);
      const existingSupplier = suppliers.find(s => s.taxNumber === newSupplier.taxNumber && s.code !== newSupplier.code);

      if (existingCustomer || existingSupplier) {
          alert('此税号已存在，请使用唯一的税号！');
          return;
      }

      const index = suppliers.findIndex(s => s.code === newSupplier.code);
      if (isEditing && index >= 0) {
          suppliers[index] = newSupplier; // 更新现有供应商
          console.log('更新供应商:', newSupplier);
      } else {
          const existingCodes = suppliers.map(s => s.code);
          if (existingCodes.includes(newSupplier.code) && !isEditing) {
              alert('供应商代码已存在，请使用唯一的代码！');
              return;
          }
          suppliers.push(newSupplier); // 添加新供应商
          console.log('添加新供应商:', newSupplier);
          // 如果使用了临时生成的代码，则保存计数器
          if (tempGeneratedCode && tempGeneratedCode.code === newSupplier.code) {
              saveSupplierCodeCounter(tempGeneratedCode.counter);
          }
      }

      saveSuppliers();
      updateTable();
      supplierForm.reset();
      modal.style.display = 'none';
      isEditing = false;
      tempGeneratedCode = null; // 保存后清空临时代码
  });

  // 操作按钮事件
  document.querySelector('.supplier-table').addEventListener('click', (e) => {
      const target = e.target.closest('.action-icon');
      if (!target) return;
      const index = target.getAttribute('data-index');
      const supplier = suppliers[index];

      if (target.classList.contains('delete-icon')) {
          if (confirm(`确定删除供应商：${supplier.code} 吗？`)) {
              suppliers.splice(index, 1);
              saveSuppliers();
              updateTable();
          }
      } else if (target.classList.contains('view-icon')) {
          document.querySelector('.modal-content h3').textContent = '查看供应商';
          document.getElementById('supplierCode').value = supplier.code;
          document.getElementById('supplierName').value = supplier.name;
          document.getElementById('taxNumber').value = supplier.taxNumber || '';
          document.getElementById('supplierAddress').value = supplier.address;
          document.getElementById('postalCode').value = supplier.postalCode || '';
          document.getElementById('city').value = supplier.city || '';
          document.getElementById('province').value = supplier.province || '';
          document.getElementById('country').value = supplier.country || '';
          document.getElementById('email').value = supplier.email || '';
          document.getElementById('supplierPhone').value = supplier.phone;
          loadSupplierCategories();
          document.getElementById('supplierCategory').value = supplier.category;
          document.getElementById('status').value = supplier.status;
          setFormReadOnly(true);
          generateCodeBtn.style.display = 'none'; // 查看时隐藏生成按钮
          modal.style.display = 'flex';
      } else if (target.classList.contains('edit-icon')) {
          isEditing = true;
          document.querySelector('.modal-content h3').textContent = '编辑供应商';
          document.getElementById('supplierCode').value = supplier.code;
          document.getElementById('supplierName').value = supplier.name;
          document.getElementById('taxNumber').value = supplier.taxNumber || '';
          document.getElementById('supplierAddress').value = supplier.address;
          document.getElementById('postalCode').value = supplier.postalCode || '';
          document.getElementById('city').value = supplier.city || '';
          document.getElementById('province').value = supplier.province || '';
          document.getElementById('country').value = supplier.country || '';
          document.getElementById('email').value = supplier.email || '';
          document.getElementById('supplierPhone').value = supplier.phone;
          loadSupplierCategories();
          document.getElementById('supplierCategory').value = supplier.category;
          document.getElementById('status').value = supplier.status;
          setFormReadOnly(false);
          document.getElementById('supplierCode').setAttribute('readonly', 'readonly'); // 编辑时代码只读
          generateCodeBtn.style.display = 'none'; // 编辑时隐藏生成按钮
          modal.style.display = 'flex';
      }
  });

  // 初始化表格
  updateTable();
}

// 页面加载时执行初始化函数
document.addEventListener('DOMContentLoaded', init);