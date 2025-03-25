// Inicializar datos de proveedores desde localStorage o un arreglo vacío
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
let isEditing = false; // Indicador de estado de edición
let tempGeneratedCode = null; // Almacenar temporalmente el código generado

// Variables relacionadas con la paginación
const itemsPerPage = 9; // Mostrar 9 elementos por página
let currentPage = 1; // Página actual

// Función para actualizar la tabla (con paginación)
function updateTable() {
  const tbody = document.querySelector('.supplier-table tbody');
  if (!tbody) return;

  // Calcular el número total de páginas
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);

  // Asegurar que la página actual sea válida
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // Calcular el rango de datos para la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, suppliers.length);
  const currentData = suppliers.slice(startIndex, endIndex);

  tbody.innerHTML = '';
  currentData.forEach((supplier, pageIndex) => {
      const globalIndex = startIndex + pageIndex; // Calcular índice global
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${supplier.code}</td>
          <td>${supplier.name}</td>
          <td>${supplier.category}</td>
          <td>${supplier.address}</td>
          <td>${supplier.phone}</td>
          <td>
              <span class="action-icon view-icon" data-index="${globalIndex}"><i class="fas fa-eye"></i></span>
              <span class="action-icon edit-icon" data-index="${globalIndex}"><i class="fas fa-edit"></i></span>
              <span class="action-icon delete-icon" data-index="${globalIndex}"><i class="fas fa-trash-alt"></i></span>
          </td>
      `;
      tbody.appendChild(tr);
  });

  // Actualizar controles de paginación
  updatePagination(totalPages);

  console.log('Tabla actualizada, proveedores actuales:', suppliers); // Log de depuración
}

// Actualizar controles de paginación
function updatePagination(totalPages) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

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

// Guardar datos de proveedores en localStorage
function saveSuppliers() {
  localStorage.setItem('suppliers', JSON.stringify(suppliers));
  console.log('Datos guardados en localStorage:', suppliers); // Log de depuración
}

// Cargar categorías de proveedores desde localStorage
function loadSupplierCategories() {
  const categories = JSON.parse(localStorage.getItem('scategories') || '[]');
  const supplierCategorySelect = document.getElementById('supplierCategory');
  supplierCategorySelect.innerHTML = '<option value="">Seleccione categoría</option>';
  categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.code;
      option.textContent = category.name;
      supplierCategorySelect.appendChild(option);
  });
}

// Establecer estado de solo lectura en los campos del formulario
function setFormReadOnly(isReadOnly) {
  const inputs = document.querySelectorAll('#supplierForm input, #supplierForm select');
  inputs.forEach(input => {
      if (isReadOnly) {
          input.setAttribute('readonly', 'readonly');
          if (input.tagName === 'SELECT') input.setAttribute('disabled', 'disabled');
      } else {
          input.removeAttribute('readonly');
          if (input.tagName === 'SELECT') input.removeAttribute('disabled');
      }
  });
}

// Generar código de proveedor (solo genera, no guarda el contador)
function generateSupplierCode() {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const supplierRule = codeRules['supplier'] || { prefix: 'SUP', digits: 3, suffix: '', counter: 0 };
  
  const existingCodes = suppliers.map(s => s.code);
  
  let counter = supplierRule.counter || 0;
  let newCode;
  do {
      counter++;
      const number = String(counter).padStart(supplierRule.digits, '0');
      newCode = `${supplierRule.prefix}${number}${supplierRule.suffix}`;
  } while (existingCodes.includes(newCode));
  
  // Solo retorna el nuevo código, no actualiza codeRules en localStorage
  tempGeneratedCode = { code: newCode, counter: counter }; // Almacenar temporalmente código y contador
  return newCode;
}

// Guardar el contador en localStorage (llamado al guardar proveedor)
function saveSupplierCodeCounter(counter) {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const supplierRule = codeRules['supplier'] || { prefix: 'SUP', digits: 3, suffix: '', counter: 0 };
  supplierRule.counter = counter;
  codeRules['supplier'] = supplierRule;
  localStorage.setItem('codeRules', JSON.stringify(codeRules));
}

// Función de inicialización
function init() {
  const addBtn = document.querySelector('.add-btn');
  const cancelBtn = document.querySelector('.cancel-btn');
  const supplierForm = document.getElementById('supplierForm');
  const modal = document.getElementById('addSupplierModal');
  const generateCodeBtn = document.getElementById('generateCodeBtn');

  if (!addBtn || !cancelBtn || !supplierForm || !modal || !generateCodeBtn) {
      console.error('Elementos DOM necesarios no encontrados');
      return;
  }

  // Agregar proveedor
  addBtn.addEventListener('click', () => {
      isEditing = false;
      loadSupplierCategories();
      supplierForm.reset();
      document.getElementById('supplierCode').removeAttribute('readonly');
      setFormReadOnly(false);
      document.querySelector('.modal-content h3').textContent = 'Agregar Nuevo Proveedor';
      generateCodeBtn.style.display = 'block'; // Mostrar botón de generación
      tempGeneratedCode = null; // Reiniciar código temporal
      modal.style.display = 'flex';
  });

  // Cerrar modal
  cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      supplierForm.reset();
      isEditing = false;
      tempGeneratedCode = null; // Limpiar código temporal al cancelar
  });

  // Evento del botón de generación de código
  generateCodeBtn.addEventListener('click', () => {
      if (!isEditing) {
          const newCode = generateSupplierCode();
          document.getElementById('supplierCode').value = newCode;
      }
  });

  // Enviar formulario
  supplierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Formulario enviado'); // Log de depuración

      const formData = new FormData(e.target);
      const newSupplier = {
          code: formData.get('supplierCode'),
          name: formData.get('supplierName'),
          category: formData.get('supplierCategory'),
          address: formData.get('supplierAddress'),
          phone: formData.get('supplierPhone'),
          taxNumber: formData.get('taxNumber'),
          postalCode: formData.get('postalCode'),
          city: formData.get('city'),
          province: formData.get('province'),
          country: formData.get('country'),
          email: formData.get('email'),
          status: formData.get('status')
      };

      // Verificar campos obligatorios
      const requiredFields = ['code', 'name', 'category', 'address', 'phone', 'taxNumber', 'postalCode', 'city', 'province', 'country', 'email', 'status'];
      if (!requiredFields.every(field => newSupplier[field])) {
          alert('¡Por favor, complete todos los campos obligatorios!');
          return;
      }

      // Verificar si el número de impuesto ya existe en clientes o proveedores
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const existingCustomer = customers.find(c => c.taxNumber === newSupplier.taxNumber);
      const existingSupplier = suppliers.find(s => s.taxNumber === newSupplier.taxNumber && s.code !== newSupplier.code);

      if (existingCustomer || existingSupplier) {
          alert('¡Este número de impuesto ya existe, use uno único!');
          return;
      }

      const index = suppliers.findIndex(s => s.code === newSupplier.code);
      if (isEditing && index >= 0) {
          suppliers[index] = newSupplier; // Actualizar proveedor existente
          console.log('Proveedor actualizado:', newSupplier);
      } else {
          const existingCodes = suppliers.map(s => s.code);
          if (existingCodes.includes(newSupplier.code) && !isEditing) {
              alert('¡El código de proveedor ya existe, use uno único!');
              return;
          }
          suppliers.push(newSupplier); // Agregar nuevo proveedor
          console.log('Nuevo proveedor agregado:', newSupplier);
          // Si se usó un código generado temporalmente, guardar el contador
          if (tempGeneratedCode && tempGeneratedCode.code === newSupplier.code) {
              saveSupplierCodeCounter(tempGeneratedCode.counter);
          }
      }

      saveSuppliers();
      updateTable();
      supplierForm.reset();
      modal.style.display = 'none';
      isEditing = false;
      tempGeneratedCode = null; // Limpiar código temporal tras guardar
  });

  // Eventos de los botones de acción
  document.querySelector('.supplier-table').addEventListener('click', (e) => {
      const target = e.target.closest('.action-icon');
      if (!target) return;
      const index = target.getAttribute('data-index');
      const supplier = suppliers[index];

      if (target.classList.contains('delete-icon')) {
          if (confirm(`¿Seguro que desea eliminar al proveedor: ${supplier.code}?`)) {
              suppliers.splice(index, 1);
              saveSuppliers();
              updateTable();
          }
      } else if (target.classList.contains('view-icon')) {
          document.querySelector('.modal-content h3').textContent = 'Ver Proveedor';
          document.getElementById('supplierCode').value = supplier.code;
          document.getElementById('supplierName').value = supplier.name;
          document.getElementById('taxNumber').value = supplier.taxNumber || '';
          document.getElementById('supplierAddress').value = supplier.address;
          document.getElementById('postalCode').value = supplier.postalCode || '';
          document.getElementById('city').value = supplier.city || '';
          document.getElementById('province').value = supplier.province || '';
          document.getElementById('country').value = supplier.country || '';
          document.getElementById('email').value = supplier.email || '';
          document.getElementById('supplierPhone').value = supplier.phone;
          loadSupplierCategories();
          document.getElementById('supplierCategory').value = supplier.category;
          document.getElementById('status').value = supplier.status;
          setFormReadOnly(true);
          generateCodeBtn.style.display = 'none'; // Ocultar botón de generación al ver
          modal.style.display = 'flex';
      } else if (target.classList.contains('edit-icon')) {
          isEditing = true;
          document.querySelector('.modal-content h3').textContent = 'Editar Proveedor';
          document.getElementById('supplierCode').value = supplier.code;
          document.getElementById('supplierName').value = supplier.name;
          document.getElementById('taxNumber').value = supplier.taxNumber || '';
          document.getElementById('supplierAddress').value = supplier.address;
          document.getElementById('postalCode').value = supplier.postalCode || '';
          document.getElementById('city').value = supplier.city || '';
          document.getElementById('province').value = supplier.province || '';
          document.getElementById('country').value = supplier.country || '';
          document.getElementById('email').value = supplier.email || '';
          document.getElementById('supplierPhone').value = supplier.phone;
          loadSupplierCategories();
          document.getElementById('supplierCategory').value = supplier.category;
          document.getElementById('status').value = supplier.status;
          setFormReadOnly(false);
          document.getElementById('supplierCode').setAttribute('readonly', 'readonly'); // Código solo lectura al editar
          generateCodeBtn.style.display = 'none'; // Ocultar botón de generación al editar
          modal.style.display = 'flex';
      }
  });

  // Inicializar tabla
  updateTable();
}

// Ejecutar función de inicialización al cargar la página
document.addEventListener('DOMContentLoaded', init);