

// 初始化采购报价表数据
let purchasePrices = JSON.parse(localStorage.getItem('purchasePrices')) || [];

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 获取供应商名称
function getSupplierName(supplierCode) {
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const supplier = suppliers.find(s => s.code === supplierCode);
    return supplier ? supplier.name : supplierCode;
}

// 获取产品货币单位
function getProductCurrency(productCode) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
}

// 更新表格（带分页）
function updateTable() {
    const tbody = document.querySelector('.purchaseprice-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 按报价日期降序排序
    purchasePrices.sort((a, b) => new Date(b.quoteDate) - new Date(a.quoteDate));

    // 计算总页数
    const totalPages = Math.ceil(purchasePrices.length / itemsPerPage);

    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, purchasePrices.length);
    const currentData = purchasePrices.slice(startIndex, endIndex);

    const priceList = JSON.parse(localStorage.getItem('purchasePriceList') || '[]');
    currentData.forEach((price, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // 计算全局索引
        const items = priceList.filter(item => item.priceCode === price.code);
        const currencies = [...new Set(items.map(item => getProductCurrency(item.productCode)).filter(c => c))].join(', ') || '未指定货币';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${price.code}</td>
            <td>${getSupplierName(price.supplierCode)}</td>
            <td>${price.quoteDate}</td>
            <td>${price.status === '确认' ? '确认' : '未确认'} (${currencies})</td>
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

// 保存到 localStorage
function savePurchasePrices() {
    localStorage.setItem('purchasePrices', JSON.stringify(purchasePrices));
}

// 初始化
function init() {
    const addBtn = document.querySelector('.add-btn');

    if (!addBtn) {
        console.error('所需 DOM 元素未找到');
        return;
    }

    // 创建采购报价表（全屏显示）
    addBtn.addEventListener('click', () => {
        const width = screen.width;
        const height = screen.height;
        const pricelistWindow = window.open(
            'purchasepricelist.html',
            '_blank',
            `width=${width},height=${height},top=0,left=0,fullscreen=yes`
        );
        if (pricelistWindow) {
            pricelistWindow.moveTo(0, 0);
            pricelistWindow.resizeTo(screen.width, screen.height);
        }
    });

    // 绑定操作图标事件
    document.querySelector('.purchaseprice-table').addEventListener('click', (e) => {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const priceCode = purchasePrices[index].code;

        if (target.classList.contains('view-icon')) {
            const pricelistWindow = window.open(`purchasepricelist.html?priceCode=${priceCode}`, '_blank', 'fullscreen=yes');
            if (pricelistWindow) {
                pricelistWindow.moveTo(0, 0);
                pricelistWindow.resizeTo(screen.width, screen.height);
            }
        } else if (target.classList.contains('edit-icon')) {
            const pricelistWindow = window.open(`purchasepricelist.html?priceCode=${priceCode}&edit=true`, '_blank', 'fullscreen=yes');
            if (pricelistWindow) {
                pricelistWindow.moveTo(0, 0);
                pricelistWindow.resizeTo(screen.width, screen.height);
            }
        } else if (target.classList.contains('delete-icon')) {
            if (confirm(`确定删除采购报价表：${priceCode} 吗？`)) {
                purchasePrices.splice(index, 1);
                savePurchasePrices();
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
    purchasePrices = JSON.parse(localStorage.getItem('purchasePrices')) || [];
    updateTable();
});

document.addEventListener('DOMContentLoaded', init);