// purchaseorder.js

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

// 初始化采购订单数据
let purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders')) || [];

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 获取供应商名称
function getSupplierName(supplierCode) {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplier = suppliers.find(s => s.code === supplierCode);
    return supplier ? supplier.name : supplierCode;
}

// 计算订单总额并返回带欧元符号的总价
function getOrderTotal(orderCode) {
    const orderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    const orderItems = orderList.filter(item => item.orderCode === orderCode);
    let total = 0;
    orderItems.forEach(item => {
        total += parseFloat(item.totalPrice) || 0;
    });
    return `${total.toFixed(2)} €`; // 固定使用欧元符号
}

// 更新表格（带分页）
function updateTable() {
    const tbody = document.querySelector('.purchaseorder-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 按订单日期降序排序
    purchaseOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    // 计算总页数
    const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);

    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, purchaseOrders.length);
    const currentData = purchaseOrders.slice(startIndex, endIndex);

    currentData.forEach((order, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // 计算全局索引
        const tr = document.createElement('tr');
        const totalPrice = getOrderTotal(order.orderCode);
        tr.innerHTML = `
            <td>${order.orderCode}</td>
            <td>${getSupplierName(order.supplierCode)}</td>
            <td>${totalPrice}</td>
            <td>${order.orderDate}</td>
            <td>${order.expectedArrivalDate || ''}</td>
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
        document.querySelector('.content-wrapper').appendChild(pagination); // 添加到 content-wrapper
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

// 保存到 localStorage
function savePurchaseOrders() {
    localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
}

// 初始化
function init() {
    const addBtn = document.querySelector('.add-btn');

    if (!addBtn) {
        console.error('所需 DOM 元素未找到');
        return;
    }

    addBtn.addEventListener('click', function() {
        const newWindow = window.open('purchaseorderlist.html', '_blank');
        newWindow.onload = function() {
            const docEl = newWindow.document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
            } else if (docEl.mozRequestFullScreen) {
                docEl.mozRequestFullScreen().catch(err => console.error('无法自动进入全屏模式:', err));
            } else if (docEl.msRequestFullscreen) {
                docEl.msRequestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
            }
        };
    });

    document.querySelector('.purchaseorder-table').addEventListener('click', (e) => {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const orderCode = purchaseOrders[index].orderCode;

        if (target.classList.contains('view-icon')) {
            const viewWindow = window.open(`purchaseorderlist.html?orderCode=${orderCode}`, '_blank');
            viewWindow.onload = function() {
                const docEl = viewWindow.document.documentElement;
                if (docEl.requestFullscreen) {
                    docEl.requestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
                } else if (docEl.webkitRequestFullscreen) {
                    docEl.webkitRequestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
                } else if (docEl.mozRequestFullScreen) {
                    docEl.mozRequestFullScreen().catch(err => console.error('无法自动进入全屏模式:', err));
                } else if (docEl.msRequestFullscreen) {
                    docEl.msRequestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
                }
            };
        } else if (target.classList.contains('edit-icon')) {
            const editWindow = window.open(`purchaseorderlist.html?orderCode=${orderCode}&edit=true`, '_blank');
            editWindow.onload = function() {
                const docEl = editWindow.document.documentElement;
                if (docEl.requestFullscreen) {
                    docEl.requestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
                } else if (docEl.webkitRequestFullscreen) {
                    docEl.webkitRequestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
                } else if (docEl.mozRequestFullScreen) {
                    docEl.mozRequestFullScreen().catch(err => console.error('无法自动进入全屏模式:', err));
                } else if (docEl.msRequestFullscreen) {
                    docEl.msRequestFullscreen().catch(err => console.error('无法自动进入全屏模式:', err));
                }
            };
        } else if (target.classList.contains('delete-icon')) {
            if (confirm(`确定删除采购订单：${orderCode} 吗？`)) {
                purchaseOrders.splice(index, 1);
                savePurchaseOrders();
                updateTable();
            }
        }
    });

    updateTable();
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
    purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders')) || [];
    updateTable();
});

document.addEventListener('DOMContentLoaded', init);