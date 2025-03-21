

// 模态框相关元素
const modal = document.getElementById('addCategoryModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const categoryForm = document.getElementById('categoryForm');
const categoryCodeInput = document.getElementById('categoryCode');
const categoryNameInput = document.getElementById('categoryName');
const tbody = document.querySelector('.category-table tbody');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

let isEditing = false; // 标记是否为编辑模式
let editingRow = null; // 保存当前编辑的行

// 数据管理函数（带分页）
function loadCategories() {
  const categories = JSON.parse(localStorage.getItem('categories') || '[]'); // 默认空数组
  tbody.innerHTML = ''; // 清空表格

  // 计算总页数
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, categories.length);
  const currentData = categories.slice(startIndex, endIndex);

  if (Array.isArray(categories)) { // 确保数据是数组
    currentData.forEach((category, pageIndex) => {
      const globalIndex = startIndex + pageIndex; // 计算全局索引
      if (category.code && category.name) { // 检查数据有效性
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${category.code}</td>
          <td>${category.name}</td>
          <td>
            <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
            <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
          </td>
        `;
        tbody.appendChild(row);
      }
    });
  }

  // 更新分页控件
  updatePagination(totalPages);

  bindIconEvents(); // 绑定事件
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
      loadCategories();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCategories();
    }
  });
}

function saveCategories() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const categories = rows.map(row => ({
    code: row.cells[0].textContent,
    name: row.cells[1].textContent
  }));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// 添加类别 - 显示模态框
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = '添加新类别';
  categoryForm.reset();
  categoryCodeInput.removeAttribute('readonly');
  modal.style.display = 'flex';
});

// 取消按钮 - 关闭模态框
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  categoryForm.reset();
  isEditing = false;
  editingRow = null;
});

// 保存或更新类别
categoryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const code = categoryCodeInput.value.trim();
  const name = categoryNameInput.value.trim();

  if (code && name) {
    if (isEditing && editingRow) {
      // 编辑模式：更新现有行
      editingRow.cells[1].textContent = name; // 只允许修改名称
    } else {
      // 添加模式：检查编码是否重复
      const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
      if (existingCodes.includes(code)) {
        alert('类别编码已存在，请使用唯一的编码！');
        return;
      }
      // 创建新行
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>
          <span class="action-icon view-icon"><i class="fas fa-eye"></i></span>
          <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
        </td>
      `;
      tbody.appendChild(newRow);
    }
    saveCategories(); // 保存到 localStorage
    modal.style.display = 'none';
    categoryForm.reset();
    isEditing = false;
    editingRow = null;
    loadCategories(); // 刷新表格以更新分页
  }
});

// 操作图标事件绑定函数
function bindIconEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.removeEventListener('click', viewHandler);
    icon.addEventListener('click', viewHandler);
  });
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.removeEventListener('click', deleteHandler);
    icon.addEventListener('click', deleteHandler);
  });
}

// 查看/编辑事件
const viewHandler = function() {
  const index = this.getAttribute('data-index');
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  isEditing = true;
  editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage]; // 调整为当前页的相对索引
  modalTitle.textContent = '编辑类别';
  categoryCodeInput.value = categories[index].code;
  categoryNameInput.value = categories[index].name;
  categoryCodeInput.setAttribute('readonly', 'readonly');
  modal.style.display = 'flex';
};

// 删除事件
const deleteHandler = function() {
  const index = this.getAttribute('data-index');
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  const code = categories[index].code;
  if (confirm(`确定删除类别：${code} 吗？`)) {
    categories.splice(index, 1);
    localStorage.setItem('categories', JSON.stringify(categories));
    loadCategories();
  }
};

// 页面加载时初始化数据
document.addEventListener('DOMContentLoaded', function() {
  loadCategories();
});