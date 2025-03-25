// Variables modal
const modal = document.getElementById('addCategoryModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const categoryForm = document.getElementById('categoryForm');
const categoryCodeInput = document.getElementById('categoryCode');
const categoryNameInput = document.getElementById('categoryName');
const tbody = document.querySelector('.category-table tbody');

// Variables paginación
const itemsPerPage = 9;
let currentPage = 1;

let isEditing = false;
let editingRow = null;

// Actualizar tabla con datos marcas
function updateTable() {
  const brands = JSON.parse(localStorage.getItem('brands') || '[]');
  tbody.innerHTML = '';

  const totalPages = Math.ceil(brands.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, brands.length);
  const currentData = brands.slice(startIndex, endIndex);

  currentData.forEach((brand, pageIndex) => {
    const globalIndex = startIndex + pageIndex;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${brand.code}</td>
      <td>${brand.name}</td>
      <td>
        <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
        <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
      </td>
    `;
    tbody.appendChild(row);
  });

  updatePagination(totalPages);
  bindIconEvents();
}

// Actualizar controles paginación
function updatePagination(totalPages) {
  let pagination = document.querySelector('.pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'pagination';
    document.querySelector('.content').appendChild(pagination);
  }

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Pág. anterior</button>
    <span>Pág. ${currentPage} / Total ${totalPages}</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Pág. siguiente</button>
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

// Guardar marcas en almacenamiento local
function saveBrands() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const brands = rows.map(row => ({
    code: row.cells[0].textContent,
    name: row.cells[1].textContent
  }));
  localStorage.setItem('brands', JSON.stringify(brands));
}

// Mostrar modal agregar marca
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = 'Agregar nueva marca';
  categoryForm.reset();
  categoryCodeInput.removeAttribute('readonly');
  modal.style.display = 'flex';
});

// Cerrar modal con botón cancelar
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  categoryForm.reset();
  isEditing = false;
  editingRow = null;
});

// Guardar o actualizar marca
categoryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const code = categoryCodeInput.value.trim();
  const name = categoryNameInput.value.trim();
  if (code && name) {
    if (isEditing && editingRow) {
      editingRow.cells[1].textContent = name;
    } else {
      const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
      if (existingCodes.includes(code)) {
        alert('¡El código marca ya existe, usa uno único!');
        return;
      }
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>
          <span class="action-icon view-icon"><i class="fas fa-eye"></i></span>
          <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
        </td>
      `;
      tbody.appendChild(newRow);
    }
    saveBrands();
    modal.style.display = 'none';
    categoryForm.reset();
    isEditing = false;
    editingRow = null;
    updateTable();
  }
});

// Vincular eventos íconos acción
function bindIconEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const brands = JSON.parse(localStorage.getItem('brands') || '[]');
      isEditing = true;
      editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage];
      modalTitle.textContent = 'Editar marca';
      categoryCodeInput.value = brands[index].code;
      categoryNameInput.value = brands[index].name;
      categoryCodeInput.setAttribute('readonly', 'readonly');
      modal.style.display = 'flex';
    });
  });

  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const brands = JSON.parse(localStorage.getItem('brands') || '[]');
      const code = brands[index].code;
      if (confirm(`¿Seguro de eliminar marca: ${code}?`)) {
        brands.splice(index, 1);
        localStorage.setItem('brands', JSON.stringify(brands));
        updateTable();
      }
    });
  });
}

// Inicializar tabla al cargar página
document.addEventListener('DOMContentLoaded', function() {
  updateTable();
});