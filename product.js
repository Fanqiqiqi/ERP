// Elementos formulario
const addBtn = document.querySelector('.add-btn');
const tbody = document.querySelector('.product-table tbody');

// Variables paginación
const itemsPerPage = 9; // 9 ítems por página
let currentPage = 1; // Página actual

// Cargar categorías productos desde localStorage
function loadProductCategories() {
  const categories = JSON.parse(localStorage.getItem('pcategories') || '[]');
  const productCategorySelect = document.getElementById('productCategory');
  if (productCategorySelect) { // Evitar error en product.html
    productCategorySelect.innerHTML = '<option value="">Selecciona Categoría</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.code;
      option.textContent = category.name;
      productCategorySelect.appendChild(option);
    });
  }
}

// Calcular precio total (con impuestos)
function calculateTotalPrice(price, taxRate) {
  const priceNum = parseFloat(price) || 0;
  const taxRateNum = parseFloat(taxRate) || 0;
  const totalPrice = priceNum * (1 + taxRateNum);
  return totalPrice.toFixed(2);
}

// Símbolos moneda
const currencySymbols = {
  'EUR': '€',
  'USD': '$',
  'CNY': '¥',
  '': '' // Sin símbolo por defecto
};

// Cargar datos productos (con paginación)
function loadProducts() {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const categories = JSON.parse(localStorage.getItem('pcategories') || '[]'); // Cargar categorías
  tbody.innerHTML = '';

  // Calcular total páginas
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Validar página actual
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // Rango datos página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const currentData = products.slice(startIndex, endIndex);

  currentData.forEach((product, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // Índice global
    const totalPrice = calculateTotalPrice(product.purchasePrice, product.taxRate); // Total basado en precio compra
    const currencySymbol = currencySymbols[product.currency] || product.currency || '';
    
    // Buscar el nombre de la categoría basado en el código
    const category = categories.find(cat => cat.code === product.category);
    const categoryName = category ? category.name : product.category || ''; // Si no se encuentra, usar el代码或空

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.code}</td>
      <td>${product.name}</td>
      <td>${categoryName}</td> <!-- Mostrar nombre de la categoría en lugar del código -->
      <td>${product.sellingPrice || ''} ${currencySymbol}</td> <!-- Mostrar precio venta -->
      <td>${totalPrice} ${currencySymbol}</td>
      <td>${product.description}</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Actualizar paginación
  updatePagination(totalPages);

  bindIconEvents();
}

// Actualizar control paginación
function updatePagination(totalPages) {
  let pagination = document.querySelector('.pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'pagination';
    document.querySelector('.content').appendChild(pagination);
  }

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Página Anterior</button>
    <span>Página ${currentPage} / Total ${totalPages}</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Página Siguiente</button>
  `;

  pagination.querySelector('.prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadProducts();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadProducts();
    }
  });
}

// Guardar datos productos
function saveProducts() {
  const rows = Array.from(tbody.querySelectorAll('tr')); // Corrección: eliminado 'tr tr'
  const products = rows.map(row => {
    const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const existingProduct = existingProducts.find(p => p.code === row.cells[0].textContent) || {};
    const priceText = row.cells[3].textContent.split(' ')[0]; // Extraer precio
    const editedProduct = JSON.parse(sessionStorage.getItem('editProduct') || '{}');
    return {
      code: row.cells[0].textContent,
      name: row.cells[1].textContent,
      category: row.cells[2].textContent, // Aquí仍然存储的是类别编号，不是名称
      purchasePrice: priceText,
      description: row.cells[5].textContent,
      supplierProductCode: existingProduct.supplierProductCode || '',
      supplierProductName: existingProduct.supplierProductName || '',
      unit: existingProduct.unit || '',
      specification: existingProduct.specification || '',
      price: priceText, // Compatibilidad datos antiguos
      sellingPrice: existingProduct.sellingPrice || '',
      retailPrice: existingProduct.retailPrice || '',
      taxRate: existingProduct.taxRate || editedProduct.taxRate || '0%',
      currency: existingProduct.currency || '',
      safetyStock: existingProduct.safetyStock || '',
      photo: existingProduct.photo || ''
    };
  });
  localStorage.setItem('products', JSON.stringify(products));
}

// Abrir página agregar producto
addBtn.addEventListener('click', function() {
  window.location.href = 'add-product.html';
});

// Vincular eventos íconos
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

// Evento ver
const viewHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === code);
  sessionStorage.setItem('viewProduct', JSON.stringify(product));
  window.location.href = 'add-product.html?mode=view';
};

// Evento editar
const editHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === code);
  sessionStorage.setItem('editProduct', JSON.stringify(product));
  window.location.href = 'add-product.html?mode=edit';
};

// Evento eliminar
const deleteHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  if (confirm(`¿Seguro eliminar producto: ${code}?`)) {
    row.remove();
    saveProducts();
    loadProducts(); // Refrescar tabla
  }
};

// Inicializar al cargar página
document.addEventListener('DOMContentLoaded', function() {
  loadProductCategories();
  loadProducts();
});