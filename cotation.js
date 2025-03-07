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

// 页面元素
const addBtn = document.querySelector('.add-btn');
const searchBtn = document.querySelector('.search-btn');
const tbody = document.querySelector('.cotation-table tbody');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

// 分页相关变量
const itemsPerPage = 9;
let currentPage = 1;
let cotationData = JSON.parse(localStorage.getItem('cotations') || '[]');
let filteredData = [...cotationData];

// 从产品数据中加载货币单位
function getProductCurrency(productCode) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === productCode);
  return product ? product.currency || '' : '';
}

// 从客户资料中获取客户类别
function getCustomerCategory(customerName) {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customer = customers.find(c => c.name === customerName);
  return customer ? customer.category || '无' : '无';
}

// 获取所有客户类别
function getCustomerCategories() {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  return [...new Set(customers.map(customer => customer.category).filter(cat => cat))];
}

// 从产品数据中获取规格
function getProductSpecifications(productCode) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  console.log('All products in localStorage:', products); // 调试：显示所有产品数据
  const product = products.find(p => p.code === productCode);
  console.log('Product found for code', productCode, ':', product);
  // 检查可能的规格字段名
  if (product) {
    return (
      product.specifications ||
      product.specs ||           // 可能的替代字段名
      product.description ||     // 可能的替代字段名
      'N/A'
    );
  }
  return 'N/A';
}

// 显示自动提示列表
function showSuggestions(inputElement, suggestionsContainer, suggestions) {
  suggestionsContainer.innerHTML = '';
  if (suggestions.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  suggestions.forEach(suggestion => {
    const div = document.createElement('div');
    div.classList.add('suggestion-item');
    div.textContent = suggestion;
    div.addEventListener('click', () => {
      inputElement.value = suggestion;
      suggestionsContainer.style.display = 'none';
    });
    suggestionsContainer.appendChild(div);
  });
  suggestionsContainer.style.display = 'block';
}

// 应用筛选条件
function applyFilters(formData) {
  const filters = {
    cotationCode: formData.get('cotationCode')?.toLowerCase().trim(),
    customerName: formData.get('customerName')?.toLowerCase().trim(),
    customerCategory: formData.get('customerCategory')?.toLowerCase().trim(),
    priceCategory: formData.get('priceCategory')?.toLowerCase().trim(),
    dateFrom: formData.get('dateFrom'),
    dateTo: formData.get('dateTo')
  };

  filteredData = cotationData.filter(item => {
    let matches = true;
    if (filters.cotationCode) matches = matches && item.code.toLowerCase().includes(filters.cotationCode);
    if (filters.customerName) matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
    if (filters.customerCategory) matches = matches && getCustomerCategory(item.customerName).toLowerCase().includes(filters.customerCategory);
    if (filters.priceCategory) matches = matches && (item.priceCategory || '无').toLowerCase().includes(filters.priceCategory);
    if (filters.dateFrom || filters.dateTo) {
      const cotationDate = new Date(item.date);
      if (filters.dateFrom) matches = matches && cotationDate >= new Date(filters.dateFrom);
      if (filters.dateTo) matches = matches && cotationDate <= new Date(filters.dateTo);
    }
    return matches;
  });
}

// 更新表格
function updateTable() {
  filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((cotation, pageIndex) => {
    const globalIndex = cotationData.indexOf(cotation);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cotation.code}</td>
      <td>${cotation.customerName}</td>
      <td>${getCustomerCategory(cotation.customerName)}</td>
      <td>${cotation.priceCategory || '无'}</td>
      <td>${cotation.date}</td>
      <td>
        <button class="download-btn" data-index="${globalIndex}"><i class="fas fa-download"></i></button>
        <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
      </td>
    `;
    tbody.appendChild(row);
  });

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

// 添加报价
addBtn.addEventListener('click', function() {
  window.location.href = 'cotationlist.html';
});

// 操作图标事件绑定
function bindIconEvents() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
      const cotation = cotations[index];
      generatePDF(cotation);
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
        cotationData = cotations;
        filteredData = [...cotationData];
        updateTable();
      }
    });
  });
}

// 生成西班牙语PDF（仅含产品代码、产品名称、规格和单价）
// 生成西班牙语PDF（仅含产品代码、产品名称、规格和单价）
function generatePDF(cotation) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  console.log('Cotation Data for PDF:', cotation);

  doc.setFontSize(14);
  doc.setTextColor('#00b4d8');
  doc.text('Cotización', 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor('#333');
  doc.text(`Código de Cotización: ${cotation.code}`, 190, 15, { align: 'right' });

  doc.setFontSize(10);
  doc.text(`Nombre del Cliente: ${cotation.customerName}`, 15, 30);
  doc.text(`Fecha de Cotización: ${cotation.date}`, 105, 30);

  const products = cotation.products || [];
  const tableData = products.map((p) => {
    const unitPriceValue = p.unitPrice || p.price || p.unit_price || 0;
    const unitPrice = unitPriceValue !== undefined && unitPriceValue !== null ? parseFloat(unitPriceValue).toFixed(2) : '0.00';
    // 直接使用 cotation.products 中的 specification 字段
    const specifications = p.specification || getProductSpecifications(p.productCode) || 'N/A';
    console.log(`Product Code: ${p.productCode}, Specifications: ${specifications}`); // 调试
    return [
      p.productCode || 'N/A',
      p.productName || 'Desconocido',
      specifications,
      unitPrice
    ];
  });

  // 设置 Helvetica 字体并启用 UTF-8
  doc.autoTable({
    startY: 40,
    head: [['Código del Producto', 'Nombre del Producto', 'Especificaciones', 'Precio Unitario']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: '#f8f8f8', textColor: '#2e3b3e' },
    styles: { font: 'helvetica', fontSize: 10, overflow: 'linebreak' }, // 使用 Helvetica
    margin: { top: 15, left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: '25%' },
      1: { cellWidth: '30%' },
      2: { cellWidth: '25%' },
      3: { cellWidth: '20%' }
    }
  });

  doc.setFontSize(8);
  doc.setTextColor('#666');
  const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Fecha de Generación: ${currentDate}`, 15, 287);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' });
  }

  doc.save(`Cotización_${cotation.code}.pdf`);
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
  filteredData = [...cotationData];
  currentPage = 1;
  updateTable();
}

// 初始化页面
function init() {
  updateTable();

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

  // 客户类别自动提示
  const customerCategoryInput = document.getElementById('filterCustomerCategory');
  const suggestionsContainer = document.getElementById('customerCategorySuggestions');
  const allCategories = getCustomerCategories();

  customerCategoryInput.addEventListener('input', () => {
    const inputValue = customerCategoryInput.value.trim().toLowerCase();
    const filteredCategories = allCategories.filter(category => 
      category.toLowerCase().includes(inputValue)
    );
    showSuggestions(customerCategoryInput, suggestionsContainer, filteredCategories);
  });

  document.addEventListener('click', (e) => {
    if (!suggestionsContainer.contains(e.target) && e.target !== customerCategoryInput) {
      suggestionsContainer.style.display = 'none';
    }
  });
}

// 监听 storage 事件
window.addEventListener('storage', function() {
  cotationData = JSON.parse(localStorage.getItem('cotations') || '[]');
  filteredData = [...cotationData];
  updateTable();
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);