
  // 表格元素
  const addBtn = document.querySelector('.add-btn');
  const tbody = document.querySelector('.price-table tbody');
  
  // 分页相关变量
  const itemsPerPage = 9; // 每页显示9条
  let currentPage = 1; // 当前页码
  
  // 加载价格表数据（带分页）
  function updateTable() {
    const prices = JSON.parse(localStorage.getItem('prices') || '[]');
    const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    tbody.innerHTML = '';
  
    // 计算总页数
    const totalPages = Math.ceil(prices.length / itemsPerPage);
  
    // 确保当前页码有效
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
  
    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, prices.length);
    const currentData = prices.slice(startIndex, endIndex);
  
    currentData.forEach((price, pageIndex) => {
        const globalIndex = startIndex + pageIndex; // 计算全局索引
        const items = priceList.filter(item => {
            const category = JSON.parse(localStorage.getItem('prcategories') || '[]').find(c => c.name === price.category);
            return category && item.categoryCode === category.code;
        });
        const currencies = [...new Set(items.map(item => {
            const product = products.find(p => p.code === item.productCode);
            return product ? product.currency : '';
        }).filter(c => c))].join(', ') || '未指定货币';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${price.code}</td>
            <td>${price.category} (${currencies})</td>
            <td>
                <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
                <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
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
  
  // 保存价格表数据
  function savePrices() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const prices = rows.map(row => ({
        code: row.cells[0].textContent,
        category: row.cells[1].textContent.split(' (')[0] // 移除货币单位显示部分
    }));
    localStorage.setItem('prices', JSON.stringify(prices));
  }
  
  // 打开新窗口创建价格表 - 全屏显示
  addBtn.addEventListener('click', function() {
    const pricelistWindow = window.open('pricelist.html', '_blank', 'fullscreen=yes');
    if (pricelistWindow) {
        pricelistWindow.moveTo(0, 0);
        pricelistWindow.resizeTo(screen.width, screen.height);
    }
  });
  
  // 绑定查看、编辑和删除图标事件
  function bindIconEvents() {
    document.querySelectorAll('.view-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const prices = JSON.parse(localStorage.getItem('prices') || '[]');
            const priceCode = prices[index].code;
            const pricelistWindow = window.open(`pricelist.html?priceCode=${priceCode}`, '_blank', 'fullscreen=yes');
            if (pricelistWindow) {
                pricelistWindow.moveTo(0, 0);
                pricelistWindow.resizeTo(screen.width, screen.height);
            }
        });
    });
  
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const prices = JSON.parse(localStorage.getItem('prices') || '[]');
            const priceCode = prices[index].code;
            const pricelistWindow = window.open(`pricelist.html?priceCode=${priceCode}&edit=true`, '_blank', 'fullscreen=yes');
            if (pricelistWindow) {
                pricelistWindow.moveTo(0, 0);
                pricelistWindow.resizeTo(screen.width, screen.height);
            }
        });
    });
  
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const prices = JSON.parse(localStorage.getItem('prices') || '[]');
            const code = prices[index].code;
            if (confirm(`确定删除价格表：${code} 吗？`)) {
                prices.splice(index, 1);
                localStorage.setItem('prices', JSON.stringify(prices));
                updateTable();
            }
        });
    });
  }
  
  // 监听 storage 事件以实时更新
  window.addEventListener('storage', function() {
    updateTable();
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    updateTable();
  });