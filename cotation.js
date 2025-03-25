// Elementos de página
const addBtn = document.querySelector('.add-btn');
const searchBtn = document.querySelector('.search-btn');
const tbody = document.querySelector('.cotation-table tbody');
const filterPanel = document.getElementById('filterPanel');
const closeFilter = filterPanel.querySelector('.close-filter');
const filterForm = document.getElementById('filterForm');
const resetBtn = filterForm.querySelector('.reset-btn');

// Variables de paginación
const itemsPerPage = 9;
let currentPage = 1;
let cotationData = JSON.parse(localStorage.getItem('cotations') || '[]');
let filteredData = [...cotationData];

// Obtener moneda de producto
function getProductCurrency(productCode) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === productCode);
  return product ? product.currency || '' : '';
}

// Obtener categoría de cliente
function getCustomerCategory(customerName) {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customer = customers.find(c => c.name === customerName);
  return customer ? customer.category || 'Sin' : 'Sin';
}

// Obtener todas las categorías de clientes
function getCustomerCategories() {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  return [...new Set(customers.map(customer => customer.category).filter(cat => cat))];
}

// Obtener especificaciones de producto
function getProductSpecifications(productCode) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  console.log('Todos los productos en localStorage:', products);
  const product = products.find(p => p.code === productCode);
  console.log('Producto encontrado para código', productCode, ':', product);
  if (product) {
    return (
      product.specifications ||
      product.specs ||
      product.description ||
      'N/A'
    );
  }
  return 'N/A';
}

// Mostrar lista de sugerencias
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

// Aplicar filtros
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
    if (filters.priceCategory) matches = matches && (item.priceCategory || 'Sin').toLowerCase().includes(filters.priceCategory);
    if (filters.dateFrom || filters.dateTo) {
      const cotationDate = new Date(item.date);
      if (filters.dateFrom) matches = matches && cotationDate >= new Date(filters.dateFrom);
      if (filters.dateTo) matches = matches && cotationDate <= new Date(filters.dateTo);
    }
    return matches;
  });
}

// Actualizar tabla
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
      <td>${cotation.priceCategory || 'Sin'}</td>
      <td>${cotation.date}</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
      </td>
    `;
    tbody.appendChild(row);
  });

  updatePagination(totalPages);
  bindIconEvents();
}

// Actualizar controles de paginación
function updatePagination(totalPages) {
  let pagination = document.querySelector('.pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'pagination';
    document.querySelector('.content-wrapper').appendChild(pagination);
  }
  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Página Anterior</button>
    <span>Página ${currentPage} / Total ${totalPages}</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Página Siguiente</button>
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

// Añadir cotización
addBtn.addEventListener('click', function() {
  window.location.href = 'cotationlist.html';
});

// Vincular eventos de íconos
function bindIconEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
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
      if (confirm(`¿Seguro de eliminar cotización: ${code}?`)) {
        cotations.splice(index, 1);
        localStorage.setItem('cotations', JSON.stringify(cotations));
        cotationData = cotations;
        filteredData = [...cotationData];
        updateTable();
      }
    });
  });
}

// Generar PDF en español
function generatePDF(cotation) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  console.log('Datos de cotización para PDF:', cotation);

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
    const specifications = p.specification || getProductSpecifications(p.productCode) || 'N/A';
    console.log(`Código Producto: ${p.productCode}, Especificaciones: ${specifications}`);
    return [
      p.productCode || 'N/A',
      p.productName || 'Desconocido',
      specifications,
      unitPrice
    ];
  });

  doc.autoTable({
    startY: 40,
    head: [['Código Producto', 'Nombre Producto', 'Especificaciones', 'Precio Unitario']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: '#f8f8f8', textColor: '#2e3b3e' },
    styles: { font: 'helvetica', fontSize: 10, overflow: 'linebreak' },
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
  doc.text(`Fecha Generación: ${currentDate}`, 15, 287);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' });
  }

  doc.save(`Cotización_${cotation.code}.pdf`);
}

// Mostrar/ocultar panel de filtro
function toggleFilterPanel() {
  filterPanel.classList.toggle('active');
}

// Cerrar panel de filtro
function closeFilterPanel() {
  filterPanel.classList.remove('active');
}

// Reiniciar formulario de filtro
function resetFilterForm() {
  filterForm.reset();
  filteredData = [...cotationData];
  currentPage = 1;
  updateTable();
}

// Inicializar página
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

  // Sugerencias de categoría cliente
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

// Escuchar eventos de storage
window.addEventListener('storage', function() {
  cotationData = JSON.parse(localStorage.getItem('cotations') || '[]');
  filteredData = [...cotationData];
  updateTable();
});

// Inicializar al cargar página
document.addEventListener('DOMContentLoaded', init);