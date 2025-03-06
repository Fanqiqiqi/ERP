// despatch.js

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
const modal = document.getElementById('addDespatchModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const despatchForm = document.getElementById('despatchForm');
const despatchCodeInput = document.getElementById('despatchCode');
const customerNameSelect = document.getElementById('customerName');
const totalAmountInput = document.getElementById('totalAmount');
const despatchDateInput = document.getElementById('despatchDate');
const statusSelect = document.getElementById('status');
const tbody = document.querySelector('.order-table tbody');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

let isEditing = false;
let editingRow = null;

// 从产品数据中加载产品
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

// 加载客户到下拉框
function loadCustomersIntoSelect() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    customerNameSelect.innerHTML = '<option value="">请选择客户</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = customer.name;
        customerNameSelect.appendChild(option);
    });
}

// 更新表格（带分页）
function updateTable() {
    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    
    // 按日期降序排序
    despatches.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 计算总页数
    const totalPages = Math.ceil(despatches.length / itemsPerPage);

    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, despatches.length);
    const currentData = despatches.slice(startIndex, endIndex);

    // 清空表格并填充当前页数据
    tbody.innerHTML = '';
    currentData.forEach((despatch) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${despatch.code}</td>
            <td>${despatch.customerName}</td>
            <td>${despatch.totalAmount} €</td> <!-- 固定使用欧元符号 -->
            <td>${despatch.date}</td>
            <td>${despatch.status}</td>
            <td>
                <span class="action-icon view-icon" data-code="${despatch.code}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-code="${despatch.code}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-code="${despatch.code}"><i class="fas fa-trash-alt"></i></span>
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

// 保存出货单数据到 localStorage
function saveDespatchData(despatchData) {
    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    const despatchIndex = despatches.findIndex(d => d.code === despatchData.code);
    if (despatchIndex >= 0) {
        despatches[despatchIndex] = despatchData;
    } else {
        despatches.push(despatchData);
    }
    localStorage.setItem('despatches', JSON.stringify(despatches));
}

// 添加出货单 - 跳转到新页面
addBtn.addEventListener('click', function() {
    window.location.href = 'despatchout.html';
});

// 取消按钮 - 关闭模态框
cancelBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    despatchForm.reset();
    isEditing = false;
    editingRow = null;
});

// 保存或更新出货单（仅用于模态框编辑模式）
despatchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const code = despatchCodeInput.value.trim();
    const customerName = customerNameSelect.value;
    const totalAmount = totalAmountInput.value.trim();
    const date = despatchDateInput.value;
    const status = statusSelect.value;

    if (code && customerName && totalAmount && date && status) {
        const despatchData = {
            code,
            customerName,
            totalAmount,
            date,
            status
        };

        if (isEditing && editingRow) {
            editingRow.cells[0].textContent = code;
            editingRow.cells[1].textContent = customerName;
            editingRow.cells[2].textContent = `${totalAmount} €`; // 固定使用欧元符号
            editingRow.cells[3].textContent = date;
            editingRow.cells[4].textContent = status;
            saveDespatchData(despatchData);
        } else {
            const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
            if (existingCodes.includes(code)) {
                alert('出货单编号已存在，请使用唯一的编号！');
                return;
            }
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${code}</td>
                <td>${customerName}</td>
                <td>${totalAmount} €</td> <!-- 固定使用欧元符号 -->
                <td>${date}</td>
                <td>${status}</td>
                <td>
                    <span class="action-icon view-icon" data-code="${code}"><i class="fas fa-eye"></i></span>
                    <span class="action-icon edit-icon" data-code="${code}"><i class="fas fa-edit"></i></span>
                    <span class="action-icon delete-icon" data-code="${code}"><i class="fas fa-trash-alt"></i></span>
                </td>
            `;
            tbody.appendChild(newRow);
            saveDespatchData(despatchData);
        }

        modal.style.display = 'none';
        despatchForm.reset();
        isEditing = false;
        editingRow = null;
        updateTable();
    }
});

// 操作图标事件绑定
function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            window.open(`despatchout.html?code=${encodeURIComponent(code)}&view=true`, '_blank');
        });
    });

    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            window.open(`despatchout.html?code=${encodeURIComponent(code)}&edit=true`, '_blank');
        });
    });

    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
            const index = despatches.findIndex(d => d.code === code);
            if (index !== -1 && confirm(`确定删除出货单：${code} 吗？`)) {
                despatches.splice(index, 1);
                localStorage.setItem('despatches', JSON.stringify(despatches));
                const despatchList = JSON.parse(localStorage.getItem('despatchList') || '[]');
                const updatedDespatchList = despatchList.filter(item => item.despatchCode !== code);
                localStorage.setItem('despatchList', JSON.stringify(updatedDespatchList));
                updateTable(); // 使用原始数据更新表格
            }
        });
    });
}

// 监听 storage 事件以实时更新
window.addEventListener('storage', function() {
    updateTable();
});

// --- 新增筛选功能 ---
// DOM 元素
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

// 筛选后的数据
let filteredData = JSON.parse(localStorage.getItem('despatches') || '[]');

// 应用筛选条件
function applyFilters(formData) {
    const filters = {
        despatchCode: formData.get('despatchCode')?.toLowerCase().trim(),
        customerName: formData.get('customerName')?.toLowerCase().trim(),
        despatchDateFrom: formData.get('despatchDateFrom'),
        despatchDateTo: formData.get('despatchDateTo'),
        totalAmount: formData.get('totalAmount') ? Number(formData.get('totalAmount')) : null,
        status: formData.get('status')
    };

    filteredData = JSON.parse(localStorage.getItem('despatches') || '[]').filter(item => {
        let matches = true;

        if (filters.despatchCode) {
            matches = matches && item.code.toLowerCase().includes(filters.despatchCode);
        }

        if (filters.customerName) {
            matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
        }

        if (filters.despatchDateFrom || filters.despatchDateTo) {
            const despatchDate = new Date(item.date);
            if (filters.despatchDateFrom) {
                matches = matches && despatchDate >= new Date(filters.despatchDateFrom);
            }
            if (filters.despatchDateTo) {
                matches = matches && despatchDate <= new Date(filters.despatchDateTo);
            }
        }

        if (filters.totalAmount !== null) {
            matches = matches && Number(item.totalAmount) === filters.totalAmount;
        }

        if (filters.status) {
            matches = matches && item.status === filters.status;
        }

        return matches;
    });
}

// 更新表格（使用筛选数据）
function updateTableWithFilter() {
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
    currentData.forEach((despatch) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${despatch.code}</td>
            <td>${despatch.customerName}</td>
            <td>${despatch.totalAmount} €</td> <!-- 固定使用欧元符号 -->
            <td>${despatch.date}</td>
            <td>${despatch.status}</td>
            <td>
                <span class="action-icon view-icon" data-code="${despatch.code}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-code="${despatch.code}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-code="${despatch.code}"><i class="fas fa-trash-alt"></i></span>
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
    filteredData = JSON.parse(localStorage.getItem('despatches') || '[]');
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
    updateTable(); // 初始加载使用原始 updateTable
    initFilter(); // 初始化筛选功能
});