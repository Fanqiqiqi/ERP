// 初始化下拉菜单为隐藏状态
document.querySelectorAll('.dropdown-menu').forEach(menu => {
  menu.style.display = 'none';
});

// 下拉菜单切换功能 - 绑定所有下拉菜单
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', function(e) {
    e.preventDefault(); // 阻止默认链接行为
    e.stopImmediatePropagation(); // 阻止事件立即传播
    const dropdownMenu = this.nextElementSibling; // 获取当前下拉菜单
    const sidebar = document.querySelector('.sidebar'); // 获取侧边栏
    const isOpen = dropdownMenu.style.display === 'block'; // 判断菜单是否已展开

    // 关闭所有其他下拉菜单
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== dropdownMenu) {
        menu.style.display = 'none';
      }
    });

    // 切换当前下拉菜单的显示状态
    dropdownMenu.style.display = isOpen ? 'none' : 'block';

    // 如果是展开状态，调整侧边栏的滚动位置以确保菜单可见
    if (!isOpen) {
      const togglePosition = toggle.getBoundingClientRect().top; // 获取触发元素顶部位置
      const sidebarPosition = sidebar.getBoundingClientRect().top; // 获取侧边栏顶部位置
      const offset = togglePosition - sidebarPosition; // 计算偏移量
      sidebar.scrollTo({
        top: offset,
        behavior: 'smooth' // 平滑滚动
      });
    }
  });
});

// 点击菜单项跳转或切换内容
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', function(e) {
    if (this.classList.contains('dropdown-toggle')) return; // 如果是下拉触发器则跳过
    e.preventDefault(); // 阻止默认链接行为
    const page = this.getAttribute('data-page'); // 获取目标页面
    if (page) {
      window.location.href = page; // 如果有页面链接则跳转
    } else {
      const section = this.textContent; // 获取菜单项文本
      const content = document.querySelector('.content'); // 获取内容区域
      content.innerHTML = `
        <h2>${section}</h2>
        <p>这里是${section}的内容区域。</p>
      `; // 更新内容区域
    }
  });
});

// 点击顶部标题跳转到主页
document.querySelector('.top-bar h1').addEventListener('click', function() {
  window.location.href = 'index.html'; // 跳转到主页
});

// 模态框相关变量
const modal = document.getElementById('addCategoryModal'); // 添加类别模态框
const modalTitle = modal.querySelector('.modal-content h3'); // 模态框标题
const addBtn = document.querySelector('.add-btn'); // 添加按钮
const cancelBtn = document.querySelector('.cancel-btn'); // 取消按钮
const categoryForm = document.getElementById('categoryForm'); // 类别表单
const categoryCodeInput = document.getElementById('categoryCode'); // 类别编码输入框
const categoryNameInput = document.getElementById('categoryName'); // 类别名称输入框
const tbody = document.querySelector('.category-table tbody'); // 表格主体

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条数据
let currentPage = 1; // 当前页码

let isEditing = false; // 是否处于编辑状态
let editingRow = null; // 当前编辑的表格行

// 加载产品类别数据并更新表格（带分页）
function updateTable() {
  const categories = JSON.parse(localStorage.getItem('pcategories') || '[]'); // 从本地存储获取类别数据，若无则为空数组
  tbody.innerHTML = ''; // 清空表格主体

  // 计算总页数
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage; // 开始索引
  const endIndex = Math.min(startIndex + itemsPerPage, categories.length); // 结束索引
  const currentData = categories.slice(startIndex, endIndex); // 当前页数据

  // 填充表格
  currentData.forEach((category, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // 计算全局索引
    const row = document.createElement('tr'); // 创建新行
    row.innerHTML = `
      <td>${category.code}</td>
      <td>${category.name}</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
      </td>
    `;
    tbody.appendChild(row); // 添加到表格
  });

  // 更新分页控件
  updatePagination(totalPages);

  // 绑定操作图标事件
  bindIconEvents();
}

// 更新分页控件
function updatePagination(totalPages) {
  let pagination = document.querySelector('.pagination'); // 获取分页控件
  if (!pagination) {
    pagination = document.createElement('div'); // 如果不存在则创建
    pagination.className = 'pagination';
    document.querySelector('.content').appendChild(pagination); // 添加到内容区域
  }

  // 更新分页控件内容
  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
    <span>第 ${currentPage} 页 / 共 ${totalPages} 页</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
  `;

  // 绑定上一页按钮事件
  pagination.querySelector('.prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--; // 上一页
      updateTable(); // 刷新表格
    }
  });

  // 绑定下一页按钮事件
  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++; // 下一页
      updateTable(); // 刷新表格
    }
  });
}

// 保存产品类别数据到本地存储
function saveCategories() {
  const rows = Array.from(tbody.querySelectorAll('tr')); // 获取所有表格行
  const categories = rows.map(row => ({
    code: row.cells[0].textContent, // 类别编码
    name: row.cells[1].textContent // 类别名称
  }));
  localStorage.setItem('pcategories', JSON.stringify(categories)); // 保存到本地存储
}

// 添加类别 - 显示模态框
addBtn.addEventListener('click', function() {
  isEditing = false; // 设置为新增模式
  modalTitle.textContent = '添加新类别'; // 更新模态框标题
  categoryForm.reset(); // 重置表单
  categoryCodeInput.removeAttribute('readonly'); // 编码输入框可编辑
  modal.style.display = 'flex'; // 显示模态框
});

// 取消按钮 - 关闭模态框
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none'; // 隐藏模态框
  categoryForm.reset(); // 重置表单
  isEditing = false; // 退出编辑模式
  editingRow = null; // 清空编辑行
});

// 保存或更新类别
categoryForm.addEventListener('submit', function(e) {
  e.preventDefault(); // 阻止表单默认提交
  const code = categoryCodeInput.value.trim(); // 获取类别编码
  const name = categoryNameInput.value.trim(); // 获取类别名称
  if (code && name) { // 确保输入不为空
    if (isEditing && editingRow) { // 编辑模式
      editingRow.cells[1].textContent = name; // 更新名称
    } else { // 新增模式
      const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent); // 获取现有编码
      if (existingCodes.includes(code)) {
        alert('类别编码已存在，请使用唯一的编码！'); // 检查编码唯一性
        return;
      }
      const newRow = document.createElement('tr'); // 创建新行
      newRow.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>
          <span class="action-icon view-icon"><i class="fas fa-eye"></i></span>
          <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
        </td>
      `;
      tbody.appendChild(newRow); // 添加到表格
    }
    saveCategories(); // 保存数据
    modal.style.display = 'none'; // 关闭模态框
    categoryForm.reset(); // 重置表单
    isEditing = false; // 退出编辑模式
    editingRow = null; // 清空编辑行
    updateTable(); // 刷新表格
  }
});

// 绑定操作图标事件
function bindIconEvents() {
  // 编辑/查看图标事件
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index'); // 获取数据索引
      const categories = JSON.parse(localStorage.getItem('pcategories') || '[]'); // 获取类别数据
      isEditing = true; // 进入编辑模式
      editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage]; // 计算当前页相对索引
      modalTitle.textContent = '编辑类别'; // 更新模态框标题
      categoryCodeInput.value = categories[index].code; // 填充编码
      categoryNameInput.value = categories[index].name; // 填充名称
      categoryCodeInput.setAttribute('readonly', 'readonly'); // 编码只读
      modal.style.display = 'flex'; // 显示模态框
    });
  });

  // 删除图标事件
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index'); // 获取数据索引
      const categories = JSON.parse(localStorage.getItem('pcategories') || '[]'); // 获取类别数据
      const code = categories[index].code; // 获取要删除的编码
      if (confirm(`确定删除类别：${code} 吗？`)) { // 确认删除
        categories.splice(index, 1); // 从数组中移除
        localStorage.setItem('pcategories', JSON.stringify(categories)); // 更新本地存储
        updateTable(); // 刷新表格
      }
    });
  });
}

// 页面加载时初始化表格
document.addEventListener('DOMContentLoaded', function() {
  updateTable(); // 加载并显示表格
});