// Elementos del modal y formulario
const modal = document.getElementById('addCategoryModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const categoryForm = document.getElementById('categoryForm');
const categoryCodeInput = document.getElementById('categoryCode');
const categoryNameInput = document.getElementById('categoryName');
const tbody = document.querySelector('.category-table tbody');

// Variables de paginación
const itemsPerPage = 9; // 9 ítems por página
let currentPage = 1; // Página actual

let isEditing = false;
let editingRow = null;

// Cargar datos de clasificación de precios (con paginación)
function updateTable() {
  const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
  tbody.innerHTML = '';

  // Calcular total de páginas
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  // Validar página actual
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // Calcular rango de datos para la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, categories.length);
  const currentData = categories.slice(startIndex, endIndex);

  currentData.forEach((category, pageIndex) => {
      const globalIndex = startIndex + pageIndex; // Índice global
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
  });

  // Actualizar paginación
  updatePagination(totalPages);

  bindIconEvents();
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

// Guardar datos de clasificación de precios
function saveCategories() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const categories = rows.map(row => ({
      code: row.cells[0].textContent,
      name: row.cells[1].textContent
  }));
  localStorage.setItem('prcategories', JSON.stringify(categories));
}

// Abrir modal para agregar categoría
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = 'Agregar Nueva Categoría';
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

// Enviar formulario: agregar o actualizar categoría
categoryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const code = categoryCodeInput.value.trim();
  const name = categoryNameInput.value.trim();

  if (code && name) {
      if (isEditing && editingRow) {
          editingRow.cells[0].textContent = code;
          editingRow.cells[1].textContent = name;
      } else {
          const existingCodes = Array.from(tbody.querySelectorAll('td:first-child')).map(td => td.textContent);
          if (existingCodes.includes(code)) {
              alert('¡El código de categoría ya existe, usa un código único!');
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
      updateTable();
  }
});

// Vincular eventos de íconos de acción
function bindIconEvents() {
  document.querySelectorAll('.view-icon').forEach(icon => {
      icon.addEventListener('click', function() {
          const index = this.getAttribute('data-index');
          const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
          isEditing = true;
          editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage];
          modalTitle.textContent = 'Editar Categoría';
          categoryCodeInput.value = categories[index].code;
          categoryNameInput.value = categories[index].name;
          categoryCodeInput.setAttribute('readonly', 'readonly');
          modal.style.display = 'flex';
      });
  });

  document.querySelectorAll('.delete-icon').forEach(icon => {
      icon.addEventListener('click', function() {
          const index = this.getAttribute('data-index');
          const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
          const code = categories[index].code;
          if (confirm(`¿Seguro de eliminar la categoría: ${code}?`)) {
              categories.splice(index, 1);
              localStorage.setItem('prcategories', JSON.stringify(categories));
              updateTable();
          }
      });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateTable();
});