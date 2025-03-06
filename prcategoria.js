// prcategoria.js

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
  
  // 模态框及表单元素
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
  
  let isEditing = false;
  let editingRow = null;
  
  // 加载价格表分类数据（带分页）
  function updateTable() {
    const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
    tbody.innerHTML = '';
  
    // 计算总页数
    const totalPages = Math.ceil(categories.length / itemsPerPage);
  
    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
  
    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, categories.length);
    const currentData = categories.slice(startIndex, endIndex);
  
    currentData.forEach((category, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // 计算全局索引
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
  
  // 保存价格表分类数据
  function saveCategories() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const categories = rows.map(row => ({
        code: row.cells[0].textContent,
        name: row.cells[1].textContent
    }));
    localStorage.setItem('prcategories', JSON.stringify(categories));
  }
  
  // 打开模态框添加类别
  addBtn.addEventListener('click', function() {
    isEditing = false;
    modalTitle.textContent = '添加新类别';
    categoryForm.reset();
    categoryCodeInput.removeAttribute('readonly');
    modal.style.display = 'flex';
  });
  
  // 取消按钮关闭模态框
  cancelBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    categoryForm.reset();
    isEditing = false;
    editingRow = null;
  });
  
  // 表单提交：添加或更新类别
  categoryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const code = categoryCodeInput.value.trim();
    const name = categoryNameInput.value.trim();
  
    if (code && name) {
        if (isEditing && editingRow) {
            editingRow.cells[0].textContent = code;
            editingRow.cells[1].textContent = name;
        } else {
            const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
            if (existingCodes.includes(code)) {
                alert('类别代码已存在，请使用唯一的代码！');
                return;
            }
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
        saveCategories();
        modal.style.display = 'none';
        categoryForm.reset();
        isEditing = false;
        editingRow = null;
        updateTable();
    }
  });
  
  // 绑定查看和删除图标事件
  function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
            isEditing = true;
            editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage]; // 调整为当前页的相对索引
            modalTitle.textContent = '编辑类别';
            categoryCodeInput.value = categories[index].code;
            categoryNameInput.value = categories[index].name;
            categoryCodeInput.setAttribute('readonly', 'readonly');
            modal.style.display = 'flex';
        });
    });
  
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
            const code = categories[index].code;
            if (confirm(`确定删除类别：${code} 吗？`)) {
                categories.splice(index, 1);
                localStorage.setItem('prcategories', JSON.stringify(categories));
                updateTable();
            }
        });
    });
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    updateTable();
  });