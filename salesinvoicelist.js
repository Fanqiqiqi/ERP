// salesinvoicelist.js
// Inicializar datos de facturas
let invoiceData = JSON.parse(localStorage.getItem('invoiceData')) || [];

// Elementos del DOM
const tbody = document.getElementById('invoiceTableBody');
const createBtn = document.querySelector('.create-btn');
const searchBtn = document.querySelector('.search-btn');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

// Variables relacionadas con la paginación
const itemsPerPage = 9; // Mostrar 9 ítems por página
let currentPage = 1; // Página actual
let filteredData = [...invoiceData]; // Almacena datos filtrados

// Formatear monto con separador de miles
function formatNumber(number) {
  return Number(number).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Aplicar condiciones de filtro
function applyFilters(formData) {
  const filters = {
    invoiceNumber: formData.get('invoiceNumber')?.toLowerCase().trim(),
    customerName: formData.get('customerName')?.toLowerCase().trim(),
    invoiceDateFrom: formData.get('invoiceDateFrom'),
    invoiceDateTo: formData.get('invoiceDateTo'),
    dueDateFrom: formData.get('dueDateFrom'),
    dueDateTo: formData.get('dueDateTo'),
    invoiceAmount: formData.get('invoiceAmount') ? Number(formData.get('invoiceAmount')) : null
  };

  filteredData = invoiceData.filter(item => {
    let matches = true;

    if (filters.invoiceNumber) {
      matches = matches && item.invoiceNumber.toLowerCase().includes(filters.invoiceNumber);
    }

    if (filters.customerName) {
      matches = matches && item.customerName.toLowerCase().includes(filters.customerName);
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

    if (filters.invoiceAmount !== null) {
      matches = matches && Number(item.invoiceAmount) === filters.invoiceAmount;
    }

    return matches;
  });
}

// Actualizar tabla (con paginación)
function updateTable() {
  filteredData.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((item, pageIndex) => {
    const globalIndex = invoiceData.indexOf(item); // Usar índice de datos originales
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.invoiceNumber}</td>
      <td>${item.customerName}</td>
      <td>${item.invoiceDate}</td>
      <td>${item.dueDate}</td>
      <td>${formatNumber(item.invoiceAmount)} €</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon einvoice-icon" data-index="${globalIndex}" title="Generar factura electrónica"><i class="fas fa-file-invoice"></i></span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updatePagination(totalPages);
  bindActionEvents();
}

// Actualizar controles de paginación
function updatePagination(totalPages) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Pág. Anterior</button>
    <span>Pág. ${currentPage} / Total ${totalPages}</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Pág. Siguiente</button>
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

// Guardar en localStorage
function saveInvoiceData() {
  localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
  syncAllInvoicesToReceivables(); // 保存后同步所有发票
}

// Obtener datos de clientes
function getCustomers() {
  return JSON.parse(localStorage.getItem('customers') || '[]');
}

// Mostrar detalles de la factura en un modal
function showInvoiceDetails(index) {
  const invoice = invoiceData[index];
  const customers = getCustomers();
  const customer = customers.find(c => c.name === invoice.customerName) || {};

  let detailsHTML = `
    <h3>Detalles de Factura - ${invoice.invoiceNumber}</h3>
    <div class="invoice-info-section">
      <h4>Info Básica</h4>
      <p><strong>Nº de Factura:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Fecha de Factura:</strong> ${invoice.invoiceDate}</p>
      <p><strong>Fecha de Vencimiento:</strong> ${invoice.dueDate}</p>
      <p><strong>Monto de Factura:</strong> ${formatNumber(invoice.invoiceAmount)} ${invoice.currency || 'Desconocido'}</p>
    </div>
    <div class="customer-info-section">
      <h4>Info de la Empresa Cliente</h4>
      <p><strong>Nombre de la Empresa:</strong> ${customer.name || invoice.customerName || 'Desconocido'}</p>
      <p><strong>Nº de Impuesto:</strong> ${customer.taxNumber || 'No proporcionado'}</p>
      <p><strong>Dirección:</strong> ${customer.address || 'No proporcionado'}</p>
      <p><strong>Ciudad:</strong> ${customer.city || 'No proporcionado'}</p>
      <p><strong>Provincia:</strong> ${customer.province || 'No proporcionado'}</p>
      <p><strong>Teléfono:</strong> ${customer.phone || 'No proporcionado'}</p>
    </div>
    <div class="product-details-section">
      <h4>Detalles de Productos</h4>
      <table class="detail-table">
        <thead>
          <tr>
            <th>Código de Producto</th>
            <th>Nombre de Producto</th>
            <th>LOTE</th>
            <th>Cantidad</th>
            <th>Precio de Venta</th>
            <th>Tasa de Impuesto</th>
            <th>Total</th>
            <th>Moneda</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach(item => {
      detailsHTML += `
        <tr>
          <td>${item.productCode || 'Desconocido'}</td>
          <td>${item.productName || 'Desconocido'}</td>
          <td>${item.lote || 'Ninguno'}</td>
          <td>${item.quantity || '0'}</td>
          <td>${item.salePrice || '0.00'}</td>
          <td>${item.taxRate || '0'}%</td>
          <td>${item.totalPrice || '0.00'}</td>
          <td>${item.currency || invoice.currency || 'Desconocido'}</td>
        </tr>
      `;
    });
  } else {
    detailsHTML += `
      <tr>
        <td colspan="8">Sin datos de detalles de productos</td>
      </tr>
    `;
  }

  detailsHTML += `
        </tbody>
      </table>
    </div>
    <div class="modal-buttons">
      <button class="close-btn">Cerrar</button>
    </div>
  `;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `<div class="modal-content">${detailsHTML}</div>`;
  document.body.appendChild(modal);

  modal.querySelector('.close-btn').addEventListener('click', () => {
    modal.remove();
  });
}

// Vincular eventos de acción
function bindActionEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      showInvoiceDetails(index);
    });
  });

  document.querySelectorAll('.einvoice-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      window.location.href = `createinvoice.html?invoiceNumber=${encodeURIComponent(invoiceData[index].invoiceNumber)}&edit=true`;
    });
  });
}

// Mostrar/Ocultar panel de filtros
function toggleFilterPanel() {
  filterPanel.classList.toggle('active');
}

// Cerrar panel de filtros
function closeFilterPanel() {
  filterPanel.classList.remove('active');
}

// Restablecer formulario de filtros
function resetFilterForm() {
  filterForm.reset();
  filteredData = [...invoiceData];
  currentPage = 1;
  updateTable();
}

// Generar número de cuenta por cobrar (与 receivableslist.js 一致)
function generateReceivableNumber() {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const receivableRule = codeRules['receivables'] || { prefix: 'REC', digits: 4, suffix: '', counter: 0 };
  const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
  const existingNumbers = receivablesData.map(r => r.receivableNo);

  let counter = receivableRule.counter || 0;
  let newNumber;
  do {
    counter++;
    const number = String(counter).padStart(receivableRule.digits, '0');
    newNumber = `${receivableRule.prefix}${number}${receivableRule.suffix}`;
  } while (existingNumbers.includes(newNumber));

  receivableRule.counter = counter;
  codeRules['receivables'] = receivableRule;
  localStorage.setItem('codeRules', JSON.stringify(codeRules));
  return newNumber;
}

// 同步所有发票到应收账款
function syncAllInvoicesToReceivables() {
  invoiceData.forEach(invoice => {
    syncInvoiceToReceivables(invoice);
  });
}

// 同步单个发票到应收账款
function syncInvoiceToReceivables(invoice) {
  let receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
  let receivablesList = JSON.parse(localStorage.getItem('receivablesList') || '[]');

  // 检查是否已存在该发票的应收账款
  const existingReceivable = receivablesData.find(r => r.receivableNo === `REC-${invoice.invoiceNumber}`);
  if (existingReceivable) {
    // 更新现有记录
    existingReceivable.invoiceDate = invoice.invoiceDate;
    existingReceivable.dueDate = invoice.dueDate;
    existingReceivable.customerName = invoice.customerName;
    existingReceivable.amount = invoice.invoiceAmount;
    existingReceivable.currency = invoice.currency || '€';

    const existingDetail = receivablesList.find(r => r.invoiceNo === invoice.invoiceNumber);
    if (existingDetail) {
      existingDetail.amount = invoice.invoiceAmount;
      existingDetail.unpaidAmount = invoice.invoiceAmount - existingDetail.paidAmount;
      existingDetail.invoiceDate = invoice.invoiceDate;
      existingDetail.dueDate = invoice.dueDate;
      existingDetail.customerName = invoice.customerName;
      existingDetail.currency = invoice.currency || '€';
    }
  } else {
    // 生成新的应收账款编号
    const receivableNo = `REC-${invoice.invoiceNumber}`; // 使用发票号生成唯一编号

    const receivable = {
      receivableNo: receivableNo,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      customerName: invoice.customerName,
      amount: invoice.invoiceAmount,
      status: 'No Pagado',
      currency: invoice.currency || '€'
    };

    const receivableDetail = {
      invoiceNo: invoice.invoiceNumber,
      amount: invoice.invoiceAmount,
      paidAmount: 0,
      unpaidAmount: invoice.invoiceAmount,
      paymentDate: null,
      receivableNo: receivableNo,
      customerCode: '', // 可从客户数据获取
      customerName: invoice.customerName,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: 'No Pagado',
      currency: invoice.currency || '€'
    };

    receivablesData.push(receivable);
    receivablesList.push(receivableDetail);
  }

  localStorage.setItem('receivablesData', JSON.stringify(receivablesData));
  localStorage.setItem('receivablesList', JSON.stringify(receivablesList));
}

// 初始化页面
function init() {
  syncAllInvoicesToReceivables(); // 初始化时同步现有发票
  updateTable();

  createBtn.addEventListener('click', () => {
    window.location.href = 'createinvoice.html';
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

  // 处理从 createinvoice.html 返回的新发票
  const urlParams = new URLSearchParams(window.location.search);
  const newInvoice = urlParams.get('newInvoice');
  if (newInvoice) {
    const invoice = JSON.parse(decodeURIComponent(newInvoice));
    if (!invoiceData.some(i => i.invoiceNumber === invoice.invoiceNumber)) { // 避免重复添加
      invoiceData.push(invoice);
      saveInvoiceData(); // 保存并同步
      updateTable();
    }
  }
}

// 初始化 al cargar la página
document.addEventListener('DOMContentLoaded', init);