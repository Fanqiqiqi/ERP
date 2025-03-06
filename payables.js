// 数据存储（模拟后端，可替换为 localStorage 或 API）
let payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');

// DOM 元素
const tbody = document.getElementById('payables-body');
const addBtn = document.querySelector('.add-btn');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化下拉菜单为隐藏状态
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });

    // 下拉菜单切换功能
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const dropdownMenu = this.nextElementSibling;
            const sidebar = document.querySelector('.sidebar');
            const isOpen = dropdownMenu.style.display === 'block';

            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdownMenu) menu.style.display = 'none';
            });

            dropdownMenu.style.display = isOpen ? 'none' : 'block';

            if (!isOpen) {
                const togglePosition = toggle.getBoundingClientRect().top;
                const sidebarPosition = sidebar.getBoundingClientRect().top;
                const offset = togglePosition - sidebarPosition;
                sidebar.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    });

    // 点击菜单项跳转
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('dropdown-toggle')) return;
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) window.location.href = page;
        });
    });

    // 点击顶部标题返回主页
    document.querySelector('.top-bar h1').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    // 初始化表格
    updateTable();

    // 添加应付按钮事件 - 跳转到 payableslist.html
    addBtn.addEventListener('click', () => {
        window.location.href = 'payableslist.html';
    });

    // 绑定操作事件
    bindActionEvents();
});

// 更新表格（带分页）
function updateTable() {
    // 对 payablesData 按发票号降序排序（越大越靠前），然后按日期降序排序
    payablesData.sort((a, b) => {
        const invoiceComparison = String(b.payableNo).localeCompare(String(a.payableNo));
        if (invoiceComparison !== 0) {
            return invoiceComparison; // 如果发票号不同，按发票号降序返回
        }
        const dateA = new Date(a.invoiceDate);
        const dateB = new Date(b.invoiceDate);
        return dateB - dateA;
    });

    // 计算总页数
    const totalPages = Math.ceil(payablesData.length / itemsPerPage);

    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, payablesData.length);
    const currentData = payablesData.slice(startIndex, endIndex);

    // 清空表格并填充当前页数据
    tbody.innerHTML = '';
    currentData.forEach((item, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // 计算全局索引
        const tr = document.createElement('tr');
        const formattedAmount = parseFloat(item.amount).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        tr.innerHTML = `
            <td>${item.payableNo || 'N/A'}</td>
            <td>${item.invoiceDate}</td>
            <td>${item.dueDate}</td>
            <td>${formattedAmount} €</td>
            <td class="${item.status === '已付款' ? 'status-paid' : item.status === '部分结账' ? 'status-partial' : 'status-unpaid'}">${item.status || '未付款'}</td>
            <td>
                <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
                <span class="action-icon adjust-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 更新分页控件
    updatePagination(totalPages);

    bindActionEvents();
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

    // 绑定分页按钮事件
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

// 绑定操作事件
function bindActionEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const invoiceNo = payablesData[index].payableNo;
            alert(`查看发票详情: ${invoiceNo}`);
        });
    });

    document.querySelectorAll('.adjust-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const payableNo = payablesData[index].payableNo;
            window.location.href = `payableslist.html?payableNo=${encodeURIComponent(payableNo)}&edit=true`;
        });
    });
}