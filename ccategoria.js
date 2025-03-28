// Elementos modal
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

// Cargar categorías con paginación
function loadCategories() {
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  tbody.innerHTML = '';

  const totalPages = Math.ceil(categories.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, categories.length);
  const currentData = categories.slice(startIndex, endIndex);

  if (Array.isArray(categories)) {
    currentData.forEach((category, pageIndex) => {
      const globalIndex = startIndex + pageIndex;
      if (category.code && category.name) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${category.code}</td>
          <td>${category.name}</td>
          <td>
            <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
            <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
          </td>
        `;
        tbody.appendChild(row);
      }
    });
  }

  updatePagination(totalPages);
  bindIconEvents();
}

// Actualizar paginación
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
      loadCategories();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCategories();
    }
  });
}

// Guardar categorías en localStorage
function saveCategories() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const categories = rows.map(row => ({
    code: row.cells[0].textContent,
    name: row.cells[1].textContent
  }));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// Mostrar modal para agregar categoría
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = 'Agregar nueva categoría';
  categoryForm.reset();
  categoryCodeInput.removeAttribute('readonly');
  modal.style.display = 'flex';
});

// Cerrar modal con cancelar
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  categoryForm.reset();
  isEditing = false;
  editingRow = null;
});

// Guardar o actualizar categoría
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
        alert('¡El código categoría ya existe, usa uno único!');
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
    saveCategories();
    modal.style.display = 'none';
    categoryForm.reset();
    isEditing = false;
    editingRow = null;
    loadCategories();
  }
});

// Vincular eventos íconos acción
function bindIconEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
    icon.removeEventListener('click', viewHandler);
    icon.addEventListener('click', viewHandler);
  });
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.removeEventListener('click', deleteHandler);
    icon.addEventListener('click', deleteHandler);
  });
}

// Evento editar
const viewHandler = function() {
  const index = this.getAttribute('data-index');
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  isEditing = true;
  editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage];
  modalTitle.textContent = 'Editar categoría';
  categoryCodeInput.value = categories[index].code;
  categoryNameInput.value = categories[index].name;
  categoryCodeInput.setAttribute('readonly', 'readonly');
  modal.style.display = 'flex';
};

// Evento eliminar
const deleteHandler = function() {
  const index = this.getAttribute('data-index');
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  const code = categories[index].code;
  if (confirm(`¿Seguro de eliminar categoría: ${code}?`)) {
    categories.splice(index, 1);
    localStorage.setItem('categories', JSON.stringify(categories));
    loadCategories();
  }
};

// Inicializar al cargar página
document.addEventListener('DOMContentLoaded', function() {
  loadCategories();
});