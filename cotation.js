// cotation.js

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

// 页面元素
const addBtn = document.querySelector('.add-btn');
const tbody = document.querySelector('.cotation-table tbody');

// 分页相关变量
const itemsPerPage = 9; // 每页显示9条
let currentPage = 1; // 当前页码

// 从产品数据中加载货币单位
function getProductCurrency(productCode) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === productCode);
  return product ? product.currency || '' : '';
}

// 更新表格（带分页）
function updateTable() {
  const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
  
  // 按日期降序排序
  cotations.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 计算总页数
  const totalPages = Math.ceil(cotations.length / itemsPerPage);

  // 确保当前页码有效
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // 计算当前页的数据范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, cotations.length);
  const currentData = cotations.slice(startIndex, endIndex);

  // 清空表格并填充当前页数据
  tbody.innerHTML = '';
  currentData.forEach((cotation, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // 计算全局索引
    const totalAmount = cotation.totalAmount || '0.00';
    const currency = cotation.products && cotation.products.length > 0 ? getProductCurrency(cotation.products[0].productCode) : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cotation.code}</td>
      <td>${cotation.customerName}</td>
      <td>${cotation.priceCategory || '无'}</td>
      <td>${cotation.date}</td>
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

// 添加报价 - 跳转到新页面
addBtn.addEventListener('click', function() {
  window.location.href = 'cotationlist.html';
});

// 操作图标事件绑定
function bindIconEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
      const code = cotations[index].code;
      window.location.href = `cotationlist.html?cotationCode=${code}&view=true`;
    });
  });

  document.querySelectorAll('.edit-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
      const code = cotations[index].code;
      window.location.href = `cotationlist.html?cotationCode=${code}&edit=true`;
    });
  });

  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
      const code = cotations[index].code;
      if (confirm(`确定删除报价：${code} 吗？`)) {
        cotations.splice(index, 1);
        localStorage.setItem('cotations', JSON.stringify(cotations));
        updateTable();
      }
    });
  });
}

// 监听 storage 事件以更新报价列表
window.addEventListener('storage', function() {
  updateTable();
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  updateTable();
});