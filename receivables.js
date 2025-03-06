// receivables.js
let receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');

const tbody = document.getElementById('receivables-body');
const addBtn = document.querySelector('.add-btn');
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

const itemsPerPage = 9;
let currentPage = 1;
let filteredData = [...receivablesData]; // 用于筛选的数据副本

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });

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

    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('dropdown-toggle')) return;
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) window.location.href = page;
        });
    });

    document.querySelector('.top-bar h1').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    updateTable();

    addBtn.addEventListener('click', () => {
        window.location.href = 'receivableslist.html';
    });

    // 新增筛选功能的事件绑定
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
        currentPage = 1; // 重置到第一页
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

    bindActionEvents(); // 确保初次加载时绑定操作事件
});

// 筛选功能：应用筛选条件
function applyFilters(formData) {
    const filters = {
        customerName: formData.get('customerName')?.toLowerCase().trim(),
        invoiceDateFrom: formData.get('invoiceDateFrom'),
        invoiceDateTo: formData.get('invoiceDateTo'),
        dueDateFrom: formData.get('dueDateFrom'),
        dueDateTo: formData.get('dueDateTo'),
        status: formData.get('status')
    };

    filteredData = receivablesData.filter(item => {
        let matches = true;

        if (filters.customerName) {
            matches = matches && (item.customerName || '').toLowerCase().includes(filters.customerName);
        }

        if (filters.invoiceDateFrom || filters.invoiceDateTo) {
            const invoiceDate = new Date(item.invoiceDate);
            if (filters.invoiceDateFrom) {
                matches = matches && invoiceDate >= new Date(filters.invoiceDateFrom);
            }
            if (filters.invoiceDateTo) {
                matches = matches && invoiceDate <= new Date(filters.invoiceDateTo);
            }
        }

        if (filters.dueDateFrom || filters.dueDateTo) {
            const dueDate = new Date(item.dueDate);
            if (filters.dueDateFrom) {
                matches = matches && dueDate >= new Date(filters.dueDateFrom);
            }
            if (filters.dueDateTo) {
                matches = matches && dueDate <= new Date(filters.dueDateTo);
            }
        }

        if (filters.status) {
            matches = matches && item.status === filters.status;
        }

        return matches;
    });
}

// 更新表格（保持原有逻辑，仅使用 filteredData）
function updateTable() {
    filteredData.sort((a, b) => {
        const invoiceComparison = String(b.receivableNo).localeCompare(String(a.receivableNo));
        if (invoiceComparison !== 0) {
            return invoiceComparison;
        }
        const dateA = new Date(a.invoiceDate);
        const dateB = new Date(b.invoiceDate);
        return dateB - dateA;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const currentData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    currentData.forEach((item, pageIndex) => {
        const globalIndex = receivablesData.indexOf(item); // 使用原始数据的索引
        const tr = document.createElement('tr');
        const formattedAmount = parseFloat(item.amount).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const displayInvoiceNo = (item.receivableNo || 'N/A').replace('REC-', '');
        
        tr.innerHTML = `
            <td>${displayInvoiceNo}</td>
            <td>${item.customerName || 'N/A'}</td>
            <td>${item.invoiceDate}</td>
            <td>${item.dueDate}</td>
            <td>${formattedAmount} €</td>
            <td class="${item.status === '已付款' ? 'status-paid' : item.status === '部分结账' ? 'status-partial' : 'status-unpaid'}">${item.status || '未付款'}</td>
            <td>
                <span class="action-icon adjust-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(totalPages);
    bindActionEvents(); // 每次更新表格后重新绑定事件
}

// 更新分页控件（保持原有逻辑）
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

// 绑定操作事件（保持原有逻辑）
function bindActionEvents() {
    document.querySelectorAll('.adjust-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const receivableNo = receivablesData[index].receivableNo;
            window.location.href = `receivableslist.html?receivableNo=${encodeURIComponent(receivableNo)}&edit=true`;
        });
    });
}

// 筛选框控制函数
function toggleFilterPanel() {
    filterPanel.classList.toggle('active');
}

function closeFilterPanel() {
    filterPanel.classList.remove('active');
}

function resetFilterForm() {
    filterForm.reset();
    filteredData = [...receivablesData]; // 重置为原始数据
    currentPage = 1;
    updateTable();
}