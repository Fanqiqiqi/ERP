// codemanagement.js
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

const addBtn = document.querySelector('.add-btn');
const tbody = document.querySelector('.code-table tbody');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

function generateCodeFormat(category) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const rule = codeRules[category] || { prefix: '', digits: 0, suffix: '' };
    const number = '0'.repeat(rule.digits || 0);
    return `${rule.prefix}${number}${rule.suffix}` || '无格式';
}

function loadCodes() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const categories = {
        'customer': '客户',
        'supplier': '供应商',
        'product': '产品',
        'price': '价格表',
        'purchasequote': '采购报价单',
        'purchaseorder': '采购订单',
        'instock': '入库单',
        'salesquote': '销售报价单',
        'salesorder': '销售订单',
        'salesdespatch': '销售出货单',
        'salesinvoice': '销售发票'
    };

    // 获取所有类别键并转换为数组
    const categoryKeys = Object.keys(categories).filter(category => codeRules[category]);
    const totalItems = categoryKeys.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentCategories = categoryKeys.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentCategories.forEach(category => {
        const codeFormat = generateCodeFormat(category);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${categories[category]}</td>
            <td>${codeFormat}</td>
            <td>
                <span class="action-icon view-icon" data-category="${category}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-category="${category}"><i class="fas fa-edit"></i></span>
                <span class="action-icon delete-icon" data-category="${category}"><i class="fas fa-trash-alt"></i></span>
            </td>
        `;
        tbody.appendChild(row);
    });

    // 更新分页控件
    updatePagination(totalPages);

    bindIconEvents();
}

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
            loadCodes();
        }
    });

    pagination.querySelector('.next-btn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadCodes();
        }
    });
}

addBtn.addEventListener('click', function() {
    const codeWindow = window.open('codeeditor.html', '_blank', 'fullscreen=yes');
    if (codeWindow) {
        codeWindow.moveTo(0, 0);
        codeWindow.resizeTo(screen.width, screen.height);
    }
});

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

const viewHandler = function() {
    const category = this.getAttribute('data-category');
    const categories = {
        'customer': '客户',
        'supplier': '供应商',
        'product': '产品',
        'price': '价格表',
        'purchasequote': '采购报价单',
        'purchaseorder': '采购订单',
        'instock': '入库单',
        'salesquote': '销售报价单',
        'salesorder': '销售订单',
        'salesdespatch': '销售出货单',
        'salesinvoice': '销售发票'
    };
    const item = categories[category];
    const codeWindow = window.open(`codeeditor.html?item=${item}`, '_blank', 'fullscreen=yes');
    if (codeWindow) {
        codeWindow.moveTo(0, 0);
        codeWindow.resizeTo(screen.width, screen.height);
    }
};

const editHandler = function() {
    const category = this.getAttribute('data-category');
    const categories = {
        'customer': '客户',
        'supplier': '供应商',
        'product': '产品',
        'price': '价格表',
        'purchasequote': '采购报价单',
        'purchaseorder': '采购订单',
        'instock': '入库单',
        'salesquote': '销售报价单',
        'salesorder': '销售订单',
        'salesdespatch': '销售出货单',
        'salesinvoice': '销售发票'
    };
    const item = categories[category];
    const codeWindow = window.open(`codeeditor.html?item=${item}&edit=true`, '_blank', 'fullscreen=yes');
    if (codeWindow) {
        codeWindow.moveTo(0, 0);
        codeWindow.resizeTo(screen.width, screen.height);
    }
};

const deleteHandler = function() {
    const category = this.getAttribute('data-category');
    const categories = {
        'customer': '客户',
        'supplier': '供应商',
        'product': '产品',
        'price': '价格表',
        'purchasequote': '采购报价单',
        'purchaseorder': '采购订单',
        'instock': '入库单',
        'salesquote': '销售报价单',
        'salesorder': '销售订单',
        'salesdespatch': '销售出货单',
        'salesinvoice': '销售发票'
    };
    const item = categories[category];
    if (confirm(`确定删除代码：${item} 吗？`)) {
        const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
        delete codeRules[category];
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
        loadCodes();
    }
};

window.addEventListener('storage', function() {
    loadCodes();
});

window.addEventListener('message', function(event) {
    if (event.data === 'update') {
        loadCodes();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadCodes();
});

document.querySelector('.top-bar h1').addEventListener('click', function() {
    window.location.href = 'index.html';
});