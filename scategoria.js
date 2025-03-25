// Modal y elementos relacionados
const modal = document.getElementById('addScategoryModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const scategoryForm = document.getElementById('scategoryForm');
const scategoryCodeInput = document.getElementById('scategoryCode');
const scategoryNameInput = document.getElementById('scategoryName');
const tbody = document.querySelector('.category-table tbody');

// Variables de paginación
const itemsPerPage = 9; // Mostrar 9 ítems por página
let currentPage = 1; // Página actual

let isEditing = false;
let editingRow = null;

// Cargar categorías de proveedores (con paginación)
function loadScategories() {
  const scategories = JSON.parse(localStorage.getItem('scategories') || '[]');
  tbody.innerHTML = '';

  // Calcular total de páginas
  const totalPages = Math.ceil(scategories.length / itemsPerPage);

  // Asegurar que la página actual sea válida
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // Calcular rango de datos para la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, scategories.length);
  const currentData = scategories.slice(startIndex, endIndex);

  if (Array.isArray(scategories)) {
    currentData.forEach((scategory, pageIndex) => {
      const globalIndex = startIndex + pageIndex; // Calcular índice global
      if (scategory.code && scategory.name) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${scategory.code}</td>
          <td>${scategory.name}</td>
          <td>
            <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
            <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
          </td>
        `;
        tbody.appendChild(row);
      }
    });
  }

  // Actualizar controles de paginación
  updatePagination(totalPages);

  bindIconEvents();
}

// Actualizar controles de paginación
function updatePagination(totalPages) {
  let pagination = document.querySelector('.pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'pagination';
    document.querySelector('.content').appendChild(pagination);
  }

  pagination.innerHTML = `
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Pág. Anterior</button>
    <span>Pág. ${currentPage} / Total ${totalPages}</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Pág. Siguiente</button>
  `;

  pagination.querySelector('.prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadScategories();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadScategories();
    }
  });
}

// Guardar categorías
function saveScategories() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const scategories = rows.map(row => ({
    code: row.cells[0].textContent,
    name: row.cells[1].textContent
  }));
  localStorage.setItem('scategories', JSON.stringify(scategories));
}

// Agregar categoría - Mostrar modal
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = 'Agregar Nueva Categoría';
  scategoryForm.reset();
  scategoryCodeInput.removeAttribute('readonly');
  modal.style.display = 'flex';
});

// Botón cancelar - Cerrar modal
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  scategoryForm.reset();
  isEditing = false;
  editingRow = null;
});

// Guardar o actualizar categoría
scategoryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const code = scategoryCodeInput.value.trim();
  const name = scategoryNameInput.value.trim();
  if (code && name) {
    if (isEditing && editingRow) {
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
    saveScategories();
    modal.style.display = 'none';
    scategoryForm.reset();
    isEditing = false;
    editingRow = null;
    loadScategories(); // Refrescar tabla para actualizar paginación
  }
});

// Vincular eventos a los iconos de acción
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

const viewHandler = function() {
  const index = this.getAttribute('data-index');
  const scategories = JSON.parse(localStorage.getItem('scategories') || '[]');
  isEditing = true;
  editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage]; // Ajustar al índice relativo de la página
  modalTitle.textContent = 'Editar Categoría';
  scategoryCodeInput.value = scategories[index].code;
  scategoryNameInput.value = scategories[index].name;
  scategoryCodeInput.setAttribute('readonly', 'readonly');
  modal.style.display = 'flex';
};

const deleteHandler = function() {
  const index = this.getAttribute('data-index');
  const scategories = JSON.parse(localStorage.getItem('scategories') || '[]');
  const code = scategories[index].code;
  if (confirm(`¿Seguro que quieres eliminar la categoría: ${code}?`)) {
    scategories.splice(index, 1);
    localStorage.setItem('scategories', JSON.stringify(scategories));
    loadScategories();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  loadScategories();
});