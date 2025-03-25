// Elementos de la tabla
const addBtn = document.querySelector('.add-btn');
const tbody = document.querySelector('.price-table tbody');

// Variables relacionadas con paginación
const itemsPerPage = 9; // Mostrar 9 ítems por página
let currentPage = 1; // Página actual

// Cargar datos de la lista de precios (con paginación)
function updateTable() {
  const prices = JSON.parse(localStorage.getItem('prices') || '[]');
  const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  tbody.innerHTML = '';

  // Calcular total de páginas
  const totalPages = Math.ceil(prices.length / itemsPerPage);

  // Asegurar que la página actual sea válida
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // Calcular rango de datos para la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, prices.length);
  const currentData = prices.slice(startIndex, endIndex);

  currentData.forEach((price, pageIndex) => {
    const globalIndex = startIndex + pageIndex; // Calcular índice global
    const items = priceList.filter(item => {
      const category = JSON.parse(localStorage.getItem('prcategories') || '[]').find(c => c.name === price.category);
      return category && item.categoryCode === category.code;
    });
    const currencies = [...new Set(items.map(item => {
      const product = products.find(p => p.code === item.productCode);
      return product ? product.currency : item.currency || ''; // 从 products 或 priceList 中获取货币
    }).filter(c => c))].join(', ') || 'Moneda no especificada';
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

  // Actualizar control de paginación
  updatePagination(totalPages);

  bindIconEvents();
}

// Actualizar control de paginación
function updatePagination(totalPages) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Pág. Anterior</button>
    <span>Pág. ${currentPage} / Total ${totalPages} Pág.</span>
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

// Guardar datos de la lista de precios
function savePrices() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const prices = rows.map(row => ({
    code: row.cells[0].textContent,
    category: row.cells[1].textContent.split(' (')[0] // Quitar parte de monedas
  }));
  localStorage.setItem('prices', JSON.stringify(prices));
}

// Abrir nueva ventana para crear lista de precios - Pantalla completa
addBtn.addEventListener('click', function() {
  const pricelistWindow = window.open('pricelist.html', '_blank', 'fullscreen=yes');
  if (pricelistWindow) {
    pricelistWindow.moveTo(0, 0);
    pricelistWindow.resizeTo(screen.width, screen.height);
  }
});

// Vincular eventos de iconos de ver, editar y eliminar
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
      if (confirm(`¿Seguro de eliminar la lista de precios: ${code}?`)) {
        prices.splice(index, 1);
        localStorage.setItem('prices', JSON.stringify(prices));
        updateTable();
      }
    });
  });
}

// Escuchar eventos de almacenamiento para actualización en tiempo real
window.addEventListener('storage', function() {
  updateTable();
});

document.addEventListener('DOMContentLoaded', function() {
  updateTable();
});