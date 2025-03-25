// customer_es.js

// Elementos del modal
const modal = document.getElementById('addCustomerModal');
const modalTitle = modal.querySelector('.modal-content h3');
const addBtn = document.querySelector('.add-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const customerForm = document.getElementById('customerForm');

// Campos del formulario
const customerCodeInput = customerForm.querySelector('#customerCode');
const customerNameInput = customerForm.querySelector('#customerName');
const taxNumberInput = customerForm.querySelector('#taxNumber');
const customerAddressInput = customerForm.querySelector('#customerAddress');
const postalCodeInput = customerForm.querySelector('#postalCode');
const cityInput = customerForm.querySelector('#city');
const provinceInput = customerForm.querySelector('#province');
const countryInput = customerForm.querySelector('#country');
const emailInput = customerForm.querySelector('#email');
const customerPhoneInput = customerForm.querySelector('#customerPhone');
const customerCategorySelect = customerForm.querySelector('#customerCategory');
const priceCategorySelect = customerForm.querySelector('#priceCategory');
const statusSelect = customerForm.querySelector('#status');
const contactPersonInput = customerForm.querySelector('#contactPerson');
const contactPhoneInput = customerForm.querySelector('#contactPhone');
const paymentTermsInput = customerForm.querySelector('#paymentTerms');
const remarksInput = customerForm.querySelector('#remarks');

// Botón generar código y tabla
const generateCodeBtn = customerForm.querySelector('#generateCodeBtn');
const tbody = document.querySelector('.customer-table tbody');

// Variables paginación
const itemsPerPage = 9;
let currentPage = 1;

let isEditing = false;
let editingRow = null;

// Generar código cliente
function generateCustomerCode() {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const customerRule = codeRules['customer'] || { prefix: 'CUS', digits: 3, suffix: '', counter: 0 };
  
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const existingCodes = customers.map(c => c.code);
  
  let counter = customerRule.counter || 0;
  let newCode;
  do {
    counter++;
    const number = String(counter).padStart(customerRule.digits, '0');
    newCode = `${customerRule.prefix}${number}${customerRule.suffix}`;
  } while (existingCodes.includes(newCode));
  
  return newCode;
}

// Actualizar contador código
function updateCustomerCodeCounter(code) {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const customerRule = codeRules['customer'] || { prefix: 'CUS', digits: 3, suffix: '', counter: 0 };
  
  const numberPart = parseInt(code.replace(customerRule.prefix, '').replace(customerRule.suffix, ''), 10);
  if (numberPart > customerRule.counter) {
    customerRule.counter = numberPart;
    codeRules['customer'] = customerRule;
    localStorage.setItem('codeRules', JSON.stringify(codeRules));
  }
}

// Cargar categorías clientes
function loadCategoriesIntoSelect() {
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  customerCategorySelect.innerHTML = '<option value="">Selecciona Categoría</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    customerCategorySelect.appendChild(option);
  });
}

// Cargar categorías precios
function loadPriceCategoriesIntoSelect() {
  const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
  priceCategorySelect.innerHTML = '<option value="">Selecciona Categoría Precios</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.code;
    option.textContent = category.name;
    priceCategorySelect.appendChild(option);
  });
}

// Configurar solo lectura
function setFormReadOnly(isReadOnly) {
  const inputs = document.querySelectorAll('#customerForm input, #customerForm select');
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

// Actualizar fila tabla
function updateTableRow(row, data) {
  row.cells[0].textContent = data.code;
  row.cells[1].textContent = data.name;
  row.cells[2].textContent = data.category;
  row.cells[3].textContent = data.address;
  row.cells[4].textContent = data.phone;
}

// Crear fila tabla
function createTableRow(data, index) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${data.code}</td>
    <td>${data.name}</td>
    <td>${data.category}</td>
    <td>${data.address}</td>
    <td>${data.phone}</td>
    <td>
      <span class="action-icon view-icon" data-index="${index}"><i class="fas fa-eye"></i></span>
      <span class="action-icon edit-icon" data-index="${index}"><i class="fas fa-edit"></i></span>
      <span class="action-icon delete-icon" data-index="${index}"><i class="fas fa-trash-alt"></i></span>
    </td>
  `;
  return row;
}

// Cargar datos clientes
function loadCustomers() {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  tbody.innerHTML = '';

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, customers.length);
  const currentData = customers.slice(startIndex, endIndex);

  currentData.forEach((customer, pageIndex) => {
    const globalIndex = startIndex + pageIndex;
    const row = createTableRow(customer, globalIndex);
    tbody.appendChild(row);
  });

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
    <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
    <span>Pág ${currentPage} / Total ${totalPages}</span>
    <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
  `;

  pagination.querySelector('.prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadCustomers();
    }
  });

  pagination.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCustomers();
    }
  });
}

// Guardar datos cliente
function saveCustomerData(customerData) {
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customerIndex = customers.findIndex(c => c.code === customerData.code);
  if (customerIndex >= 0) {
    customers[customerIndex] = customerData;
  } else {
    customers.push(customerData);
  }
  localStorage.setItem('customers', JSON.stringify(customers));
}

// Botón agregar cliente
addBtn.addEventListener('click', function() {
  isEditing = false;
  modalTitle.textContent = 'Agregar Nuevo Cliente';
  customerForm.reset();
  customerCodeInput.removeAttribute('readonly');
  loadCategoriesIntoSelect();
  loadPriceCategoriesIntoSelect();
  setFormReadOnly(false);
  generateCodeBtn.style.display = 'block';
  modal.style.display = 'flex';
});

// Botón cancelar
cancelBtn.addEventListener('click', function() {
  modal.style.display = 'none';
  customerForm.reset();
  isEditing = false;
  editingRow = null;
});

// Guardar o actualizar cliente
customerForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const customerData = {
    code: customerCodeInput.value.trim(),
    name: customerNameInput.value.trim(),
    taxNumber: taxNumberInput.value.trim(),
    address: customerAddressInput.value.trim(),
    postalCode: postalCodeInput.value.trim(),
    city: cityInput.value.trim(),
    province: provinceInput.value.trim(),
    country: countryInput.value.trim(),
    email: emailInput.value.trim(),
    phone: customerPhoneInput.value.trim(),
    category: customerCategorySelect.value,
    priceCategory: priceCategorySelect.value,
    status: statusSelect.value,
    contactPerson: contactPersonInput.value.trim(),
    contactPhone: contactPhoneInput.value.trim(),
    paymentTerms: paymentTermsInput.value.trim(),
    remarks: remarksInput.value.trim()
  };

  const requiredFields = ['code', 'name', 'taxNumber'];
  if (requiredFields.every(field => customerData[field])) {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const existingCustomer = customers.find(c => c.taxNumber === customerData.taxNumber && c.code !== customerData.code);
    const existingSupplier = suppliers.find(s => s.taxNumber === customerData.taxNumber);

    if (existingCustomer || existingSupplier) {
      alert('¡Este Nº Tributario ya existe, usa uno único!');
      return;
    }

    if (!isEditing && customers.map(c => c.code).includes(customerData.code)) {
      alert('¡Código cliente ya existe, usa uno único!');
      return;
    }

    if (!isEditing) {
      updateCustomerCodeCounter(customerData.code);
    }

    if (isEditing && editingRow) {
      updateTableRow(editingRow, customerData);
      saveCustomerData(customerData);
    } else {
      const newRow = createTableRow(customerData, customers.length);
      tbody.appendChild(newRow);
      saveCustomerData(customerData);
    }

    modal.style.display = 'none';
    customerForm.reset();
    isEditing = false;
    editingRow = null;
    loadCustomers();
  } else {
    alert('¡Completa todos los campos obligatorios (Código, Nombre, Nº Tributario)!');
  }
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

// Ver cliente
const viewHandler = function() {
  const index = this.dataset.index;
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customer = customers[index] || {};

  modalTitle.textContent = 'Ver Cliente';
  customerCodeInput.value = customer.code || '';
  customerNameInput.value = customer.name || '';
  taxNumberInput.value = customer.taxNumber || '';
  customerAddressInput.value = customer.address || '';
  postalCodeInput.value = customer.postalCode || '';
  cityInput.value = customer.city || '';
  provinceInput.value = customer.province || '';
  countryInput.value = customer.country || '';
  emailInput.value = customer.email || '';
  customerPhoneInput.value = customer.phone || '';
  contactPersonInput.value = customer.contactPerson || '';
  contactPhoneInput.value = customer.contactPhone || '';
  paymentTermsInput.value = customer.paymentTerms || '';
  remarksInput.value = customer.remarks || '';
  loadCategoriesIntoSelect();
  customerCategorySelect.value = customer.category || '';
  loadPriceCategoriesIntoSelect();
  priceCategorySelect.value = customer.priceCategory || '';
  statusSelect.value = customer.status || '启用';
  setFormReadOnly(true);
  generateCodeBtn.style.display = 'none';
  modal.style.display = 'flex';
};

// Editar cliente
const editHandler = function() {
  const index = this.dataset.index;
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const customer = customers[index] || {};

  isEditing = true;
  editingRow = tbody.children[index - (currentPage - 1) * itemsPerPage];
  modalTitle.textContent = 'Editar Cliente';
  customerCodeInput.value = customer.code || '';
  customerNameInput.value = customer.name || '';
  taxNumberInput.value = customer.taxNumber || '';
  customerAddressInput.value = customer.address || '';
  postalCodeInput.value = customer.postalCode || '';
  cityInput.value = customer.city || '';
  provinceInput.value = customer.province || '';
  countryInput.value = customer.country || '';
  emailInput.value = customer.email || '';
  customerPhoneInput.value = customer.phone || '';
  contactPersonInput.value = customer.contactPerson || '';
  contactPhoneInput.value = customer.contactPhone || '';
  paymentTermsInput.value = customer.paymentTerms || '';
  remarksInput.value = customer.remarks || '';
  loadCategoriesIntoSelect();
  customerCategorySelect.value = customer.category || '';
  loadPriceCategoriesIntoSelect();
  priceCategorySelect.value = customer.priceCategory || '';
  statusSelect.value = customer.status || '启用';
  setFormReadOnly(false);
  customerCodeInput.setAttribute('readonly', 'readonly');
  generateCodeBtn.style.display = 'none';
  modal.style.display = 'flex';
};

// Eliminar cliente
const deleteHandler = function() {
  const index = this.dataset.index;
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const code = customers[index].code;
  if (confirm(`¿Seguro de eliminar cliente: ${code}?`)) {
    customers.splice(index, 1);
    localStorage.setItem('customers', JSON.stringify(customers));
    loadCustomers();
  }
};

// Botón generar código
generateCodeBtn.addEventListener('click', function() {
  if (!isEditing) {
    const newCode = generateCustomerCode();
    customerCodeInput.value = newCode;
  }
});

// Escuchar eventos storage
window.addEventListener('storage', function() {
  loadPriceCategoriesIntoSelect();
});

// Inicializar al cargar página
document.addEventListener('DOMContentLoaded', function() {
  loadCategoriesIntoSelect();
  loadCustomers();
  loadPriceCategoriesIntoSelect();
});