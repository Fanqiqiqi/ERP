// purchaseorderinstocklist.js
document.addEventListener('DOMContentLoaded', function() {
    init();
    setupSidebarNavigation();
});

// 设置侧边栏导航逻辑
function setupSidebarNavigation() {
    const dropdownToggles = document.querySelectorAll('.sidebar .dropdown-toggle');
    const sidebar = document.querySelector('.sidebar');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const dropdownMenu = this.nextElementSibling;
            if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                const isOpen = dropdownMenu.style.display === 'block';

                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.style.display = 'none';
                    }
                });

                dropdownMenu.style.display = isOpen ? 'none' : 'block';

                if (!isOpen && sidebar) {
                    const togglePosition = toggle.getBoundingClientRect().top;
                    const sidebarPosition = sidebar.getBoundingClientRect().top;
                    const offset = togglePosition - sidebarPosition;
                    sidebar.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const sidebarLinks = document.querySelectorAll('.sidebar a[data-page]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const page = this.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
    });
}

// 初始化采购入库单数据
let purchaseInstocks = JSON.parse(localStorage.getItem('purchaseInstocks')) || [];

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码
let filteredData = [...purchaseInstocks]; // 用于存储筛选后的数据

// 保存到 localStorage
function savePurchaseInstocks() {
    localStorage.setItem('purchaseInstocks', JSON.stringify(purchaseInstocks));
}

// 应用筛选条件
function applyFilters(formData) {
    const filters = {
        instockCode: formData.get('instockCode')?.toLowerCase().trim(),
        instockDateFrom: formData.get('instockDateFrom'),
        instockDateTo: formData.get('instockDateTo'),
        supplierName: formData.get('supplierName')?.toLowerCase().trim(),
        totalPrice: formData.get('totalPrice') ? Number(formData.get('totalPrice')) : null
    };

    filteredData = purchaseInstocks.filter(item => {
        let matches = true;

        if (filters.instockCode) {
            matches = matches && item.instockCode.toLowerCase().includes(filters.instockCode);
        }

        if (filters.instockDateFrom || filters.instockDateTo) {
            const instockDate = new Date(item.instockDate);
            if (filters.instockDateFrom) {
                matches = matches && instockDate >= new Date(filters.instockDateFrom);
            }
            if (filters.instockDateTo) {
                matches = matches && instockDate <= new Date(filters.instockDateTo);
            }
        }

        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        const supplier = suppliers.find(s => s.code === item.supplierCode);
        const supplierName = supplier ? supplier.name : '未知供应商';
        if (filters.supplierName) {
            matches = matches && supplierName.toLowerCase().includes(filters.supplierName);
        }

        if (filters.totalPrice !== null) {
            matches = matches && Number(item.totalPrice) === filters.totalPrice;
        }

        return matches;
    });
}

// 更新表格（带分页）
function updateTable() {
    const tbody = document.querySelector('.purchaseorderinstock-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 按入库日期降序排序
    filteredData.sort((a, b) => new Date(b.instockDate) - new Date(a.instockDate));

    // 计算总页数
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const currentData = filteredData.slice(startIndex, endIndex);

    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');

    currentData.forEach((instock, pageIndex) => {
        const globalIndex = purchaseInstocks.indexOf(instock); // 使用原始数据中的索引
        const supplier = suppliers.find(s => s.code === instock.supplierCode);
        const supplierName = supplier ? supplier.name : '未知供应商';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${instock.instockCode}</td>
            <td>${instock.instockDate}</td>
            <td>${supplierName}</td>
            <td>${instock.totalPrice} €</td>
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

    bindIconEvents();
}

// 更新分页控件
function updatePagination(totalPages) {
    let pagination = document.querySelector('.pagination');
    if (!pagination) {
        pagination = document.createElement('div');
        pagination.className = 'pagination';
        document.querySelector('.content-wrapper').appendChild(pagination);
    }

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

// 重置筛选表单
function resetFilterForm() {
    document.getElementById('filterForm').reset();
    filteredData = [...purchaseInstocks];
    currentPage = 1;
    updateTable();
}

// 显示/隐藏筛选框
function toggleFilterPanel() {
    document.getElementById('filterPanel').classList.toggle('active');
}

// 关闭筛选框
function closeFilterPanel() {
    document.getElementById('filterPanel').classList.remove('active');
}

function init() {
    const addBtn = document.querySelector('.add-btn');
    const searchBtn = document.querySelector('.search-btn');
    const filterPanel = document.getElementById('filterPanel');
    const closeFilter = filterPanel.querySelector('.close-filter');
    const filterForm = document.getElementById('filterForm');
    const resetBtn = filterForm.querySelector('.reset-btn');

    if (!addBtn || !searchBtn || !filterPanel || !closeFilter || !filterForm || !resetBtn) {
        console.error('所需 DOM 元素未找到');
        return;
    }

    addBtn.addEventListener('click', function() {
        const newWindow = window.open('purchaseinstock.html', '_blank');
        newWindow.onload = function() {
            const docEl = newWindow.document.documentElement;
            requestFullscreen(docEl);
        };
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

    document.querySelector('.purchaseorderinstock-table').addEventListener('click', (e) => {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const instockCode = purchaseInstocks[index].instockCode;

        if (target.classList.contains('view-icon')) {
            const viewWindow = window.open(`purchaseinstock.html?instockCode=${instockCode}`, '_blank');
            viewWindow.onload = function() {
                const docEl = viewWindow.document.documentElement;
                requestFullscreen(docEl);
            };
        } else if (target.classList.contains('edit-icon')) {
            const editWindow = window.open(`purchaseinstock.html?instockCode=${instockCode}&edit=true`, '_blank');
            editWindow.onload = function() {
                const docEl = editWindow.document.documentElement;
                requestFullscreen(docEl);
            };
        } else if (target.classList.contains('delete-icon')) {
            if (confirm(`确定删除采购入库单：${instockCode} 吗？`)) {
                purchaseInstocks.splice(index, 1);
                savePurchaseInstocks();
                filteredData = [...purchaseInstocks]; // 更新筛选数据
                updateTable();
            }
        }
    });

    updateTable();
}

// 封装全屏请求函数
function requestFullscreen(docEl) {
    if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => {
            console.error('无法自动进入全屏模式:', err);
        });
    } else if (docEl.webkitRequestFullscreen) { // Safari
        docEl.webkitRequestFullscreen().catch(err => {
            console.error('无法自动进入全屏模式:', err);
        });
    } else if (docEl.mozRequestFullScreen) { // Firefox
        docEl.mozRequestFullScreen().catch(err => {
            console.error('无法自动进入全屏模式:', err);
        });
    } else if (docEl.msRequestFullscreen) { // IE/Edge
        docEl.msRequestFullscreen().catch(err => {
            console.error('无法自动进入全屏模式:', err);
        });
    }
}

// 绑定操作图标事件
function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.removeEventListener('click', () => {});
        icon.addEventListener('click', () => {});
    });
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.removeEventListener('click', () => {});
        icon.addEventListener('click', () => {});
    });
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', () => {});
        icon.addEventListener('click', () => {});
    });
}

// 监听 storage 事件以实时更新
window.addEventListener('storage', function() {
    purchaseInstocks = JSON.parse(localStorage.getItem('purchaseInstocks')) || [];
    filteredData = [...purchaseInstocks];
    updateTable();
});

document.querySelector('.top-bar h1').addEventListener('click', function() {
    window.location.href = 'index.html';
});