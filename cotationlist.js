// cotationlist.js

// Lógica de interacción del menú
document.querySelectorAll('.dropdown-menu').forEach(menu => {
  menu.style.display = 'none';
});

document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdownMenu = this.nextElementSibling;
      const isOpen = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isOpen ? 'none' : 'block';
  });
});

document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', function(e) {
      if (this.classList.contains('dropdown-toggle')) return;
      e.preventDefault();
      const page = this.getAttribute('data-page');
      if (page) {
          window.location.href = page;
      }
  });
});

// Obtener moneda del producto
function getProductCurrency(productCode) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const product = products.find(p => p.code === productCode);
  return product ? product.currency || '' : '';
}

// Cargar datos de cotizaciones (solo para modo vista/edición)
function loadCotations() {
  const tbody = document.querySelector('.cotationlist-table tbody');
  if (!tbody) {
      console.error('Elemento tbody no encontrado');
      return;
  }
  const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
  tbody.innerHTML = '';

  const sortedCotations = [...cotations].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Orden descendente
  });

  sortedCotations.forEach(cotation => {
      const totalAmount = cotation.totalAmount || '0.00';
      const currency = cotation.products && cotation.products.length > 0 ? getProductCurrency(cotation.products[0].productCode) : '';
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${cotation.code}</td>
          <td>${cotation.customerName}</td>
          <td>${cotation.priceCategory || 'Sin'}</td>
          <td>${cotation.date}</td>
          <td>
              <span class="action-icon view-icon"><i class="fas fa-eye"></i></span>
              <span class="action-icon edit-icon"><i class="fas fa-edit"></i></span>
              <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
          </td>
      `;
      tbody.appendChild(row);
  });
  bindIconEvents();
}

// Vincular eventos de íconos
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

// Evento de vista
const viewHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  window.location.href = `cotationlist.html?cotationCode=${code}&view=true`;
};

// Evento de edición
const editHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  window.location.href = `cotationlist.html?cotationCode=${code}&edit=true`;
};

// Evento de eliminación
const deleteHandler = function() {
  const row = this.closest('tr');
  const code = row.cells[0].textContent;
  if (confirm(`¿Seguro de eliminar cotización: ${code}?`)) {
      row.remove();
      const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
      const updatedCotations = cotations.filter(c => c.code !== code);
      localStorage.setItem('cotations', JSON.stringify(updatedCotations));
  }
};

// Generar código de cotización de ventas (temporal, no ocupa contador)
function generateCotationCode() {
  const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
  const cotationRule = codeRules['cotation'] || { prefix: 'COT', digits: 4, suffix: '', counter: 0 };
  
  const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
  const existingCodes = cotations.map(c => c.code);
  
  let counter = cotationRule.counter || 0;
  let newCode;
  do {
      counter++;
      const number = String(counter).padStart(cotationRule.digits, '0');
      newCode = `${cotationRule.prefix}${number}${cotationRule.suffix}`;
  } while (existingCodes.includes(newCode));
  
  return newCode;
}

// Formatear tasa de impuesto como porcentaje
function formatTaxRate(taxRate) {
  if (!taxRate) return '0%';
  if (typeof taxRate === 'string' && taxRate.endsWith('%')) return taxRate;
  const rate = parseFloat(taxRate);
  return isNaN(rate) ? '0%' : `${(rate * 100).toFixed(0)}%`;
}

// Calcular precio total (precio sin impuesto * (1 + tasa impuesto))
function calculateTotalPrice(priceInput, taxRateInput, totalPriceInput) {
  const price = parseFloat(priceInput.value) || 0;
  const taxRateStr = taxRateInput.value || '0%';
  const taxRate = parseFloat(taxRateStr.replace('%', '')) / 100 || 0;
  const totalPrice = price * (1 + taxRate);
  totalPriceInput.value = totalPrice.toFixed(2);
}

// Autocompletar productos (rellenar precio de venta según categoría de precio y calcular total)
function setupProductAutocomplete(input, field) {
  const suggestions = document.createElement('div');
  suggestions.className = 'autocomplete-suggestions';
  document.body.appendChild(suggestions);

  input.addEventListener('input', function() {
      const value = this.value.toLowerCase();
      suggestions.innerHTML = '';
      if (!value) return;

      const rect = input.getBoundingClientRect();
      suggestions.style.left = `${rect.left + window.scrollX}px`;
      suggestions.style.top = `${rect.bottom + window.scrollY}px`;
      suggestions.style.width = `${rect.width}px`;

      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const matches = products.filter(p => 
          field === 'code' ? p.code.toLowerCase().includes(value) : p.name.toLowerCase().includes(value)
      );

      matches.forEach(product => {
          const div = document.createElement('div');
          div.textContent = field === 'code' ? product.code : product.name;
          div.addEventListener('click', function() {
              const row = input.closest('tr');
              const priceCategory = document.getElementById('priceCategory').value;
              const priceInput = row.querySelector('td:nth-child(5) input');
              const taxRateInput = row.querySelector('td:nth-child(6) input');
              const totalPriceInput = row.querySelector('td:nth-child(7) input');

              row.querySelector('.product-code').value = product.code;
              row.querySelector('.product-name').value = product.name;
              row.querySelector('td:nth-child(3) input').value = product.specification || product.spec || '';
              row.querySelector('td:nth-child(4) input').value = product.unit || '';

              // Obtener precio de venta según categoría de precio
              const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
              const priceItem = priceList.find(item => 
                  item.categoryCode === priceCategory && item.productCode === product.code
              );

              // Priorizar newSellingPrice, luego sellingPrice o product.price
              const price = priceItem && priceItem.newSellingPrice ? 
                  priceItem.newSellingPrice : 
                  (priceItem && priceItem.sellingPrice ? priceItem.sellingPrice : product.price || '');
              priceInput.value = price;

              // Rellenar tasa de impuesto (formato porcentaje)
              taxRateInput.value = formatTaxRate(product.taxRate);

              // Calcular precio total
              calculateTotalPrice(priceInput, taxRateInput, totalPriceInput);

              // Escuchar cambios en precio y tasa
              priceInput.addEventListener('input', () => calculateTotalPrice(priceInput, taxRateInput, totalPriceInput));
              taxRateInput.addEventListener('input', () => calculateTotalPrice(priceInput, taxRateInput, totalPriceInput));

              suggestions.innerHTML = '';
          });
          suggestions.appendChild(div);
      });
  });

  document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
          suggestions.innerHTML = '';
      }
  });
}

// Escuchar eventos de storage para actualizar lista
window.addEventListener('storage', function() {
  loadCotations();
});

// Inicializar al cargar página
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded activado');

  // Obtener elementos de página
  const generateCodeBtn = document.getElementById('generateCodeBtn');
  const cotationCodeInput = document.getElementById('cotationCode');
  const backBtn = document.querySelector('.back-btn');
  const addBtn = document.querySelector('.add-product-btn');
  const saveBtn = document.querySelector('.save-btn');
  const printBtn = document.querySelector('.print-btn');
  const customerCodeSelect = document.getElementById('customerCode');
  const customerNameInput = document.getElementById('customerName');
  const cotationDateInput = document.getElementById('cotationDate');
  const priceCategorySelect = document.getElementById('priceCategory');

  // Verificar modo según parámetros URL
  const urlParams = new URLSearchParams(window.location.search);
  const isViewMode = urlParams.get('view') === 'true';
  const isEditMode = urlParams.get('edit') === 'true';
  const cotationCode = urlParams.get('cotationCode');

  if (isViewMode || isEditMode) {
      cotationCodeInput.value = cotationCode || '';
      cotationCodeInput.setAttribute('readonly', 'true');
      if (generateCodeBtn) generateCodeBtn.style.display = 'none';

      // Cargar datos de cotización existente
      const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
      const cotation = cotations.find(c => c.code === cotationCode);
      if (cotation) {
          customerCodeSelect.value = cotation.customerCode || '';
          customerNameInput.value = cotation.customerName || '';
          cotationDateInput.value = cotation.date || '';
          priceCategorySelect.value = cotation.priceCategory || '';
          const tbody = document.querySelector('.cotationlist-table tbody');
          tbody.innerHTML = '';
          cotation.products.forEach(product => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td><input class="product-code" type="text" value="${product.productCode}" ${isViewMode ? 'readonly' : ''}></td>
                  <td><input class="product-name" type="text" value="${product.productName}" ${isViewMode ? 'readonly' : ''}></td>
                  <td><input type="text" value="${product.specification}" ${isViewMode ? 'readonly' : ''}></td>
                  <td><input type="text" value="${product.unit}" ${isViewMode ? 'readonly' : ''}></td>
                  <td><input type="text" value="${product.price}" ${isViewMode ? 'readonly' : ''}></td>
                  <td><input type="text" value="${product.taxRate}" ${isViewMode ? 'readonly' : ''}></td>
                  <td><input type="text" value="${product.totalPrice}" readonly></td>
                  <td>${isViewMode ? '' : '<span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>'}</td>
              `;
              tbody.appendChild(row);
              if (!isViewMode) {
                  const priceInput = row.querySelector('td:nth-child(5) input');
                  const taxRateInput = row.querySelector('td:nth-child(6) input');
                  const totalPriceInput = row.querySelector('td:nth-child(7) input');
                  row.querySelector('.delete-icon').addEventListener('click', function() {
                      row.remove();
                  });
                  setupProductAutocomplete(row.querySelector('.product-code'), 'code');
                  setupProductAutocomplete(row.querySelector('.product-name'), 'name');
                  priceInput.addEventListener('input', () => calculateTotalPrice(priceInput, taxRateInput, totalPriceInput));
                  taxRateInput.addEventListener('input', () => calculateTotalPrice(priceInput, taxRateInput, totalPriceInput));
              }
          });
      }
  } else {
      cotationCodeInput.removeAttribute('readonly');
  }

  // Establecer fecha por defecto como hoy
  if (cotationDateInput && !cotationDateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      cotationDateInput.value = today;
  } else if (!cotationDateInput) {
      console.error('Input de fecha de cotización no encontrado');
  }

  // Cargar categorías de precio (desde prcategories)
  function loadPriceCategories() {
      const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
      priceCategorySelect.innerHTML = '<option value="">Selecciona categoría precio</option>';
      categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.code;
          option.textContent = category.name;
          priceCategorySelect.appendChild(option);
      });
  }

  if (priceCategorySelect) {
      loadPriceCategories();
  } else {
      console.error('Select de categoría de precio no encontrado');
  }

  // Evento botón generar
  if (generateCodeBtn) {
      generateCodeBtn.addEventListener('click', function() {
          const newCode = generateCotationCode();
          cotationCodeInput.value = newCode;
          console.log('Código generado (aún no guardado):', newCode);
      });
  } else {
      console.error('Botón generar no encontrado');
  }

  // Evento botón volver
  if (backBtn) {
      backBtn.addEventListener('click', function() {
          console.log('Botón volver clicado');
          if (window.history.length > 1) {
              window.history.back();
          } else {
              window.location.href = 'index.html';
          }
      });
  } else {
      console.error('Botón volver no encontrado');
  }

  // Evento botón añadir - Nueva fila de producto
  if (addBtn) {
      addBtn.addEventListener('click', function() {
          console.log('Botón añadir clicado');
          const tbody = document.querySelector('.cotationlist-table tbody');
          if (!tbody) {
              console.error('Cuerpo de tabla no encontrado');
              return;
          }
          const newRow = document.createElement('tr');
          newRow.innerHTML = `
              <td><input class="product-code" type="text" placeholder="Código producto"></td>
              <td><input class="product-name" type="text" placeholder="Nombre producto"></td>
              <td><input type="text" placeholder="Especificaciones"></td>
              <td><input type="text" placeholder="Unidad"></td>
              <td><input type="text" placeholder="Precio"></td>
              <td><input type="text" placeholder="Tasa impuesto"></td>
              <td><input type="text" placeholder="Total" readonly></td>
              <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
          `;
          tbody.appendChild(newRow);
          const priceInput = newRow.querySelector('td:nth-child(5) input');
          const taxRateInput = newRow.querySelector('td:nth-child(6) input');
          const totalPriceInput = newRow.querySelector('td:nth-child(7) input');
          newRow.querySelector('.delete-icon').addEventListener('click', function() {
              newRow.remove();
          });
          setupProductAutocomplete(newRow.querySelector('.product-code'), 'code');
          setupProductAutocomplete(newRow.querySelector('.product-name'), 'name');
          priceInput.addEventListener('input', () => calculateTotalPrice(priceInput, taxRateInput, totalPriceInput));
          taxRateInput.addEventListener('input', () => calculateTotalPrice(priceInput, taxRateInput, totalPriceInput));
      });
  } else {
      console.error('Botón añadir no encontrado');
  }

  // Evento botón guardar - Guardar datos y limpiar
  if (saveBtn) {
      saveBtn.addEventListener('click', function() {
          console.log('Botón guardar clicado');
          const cotation = {
              code: cotationCodeInput.value,
              customerCode: customerCodeSelect.value,
              customerName: customerNameInput.value,
              date: cotationDateInput.value,
              priceCategory: priceCategorySelect.value,
              products: []
          };

          const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
          const existingCodes = cotations.map(c => c.code);
          if (!existingCodes.includes(cotation.code)) {
              const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
              const cotationRule = codeRules['cotation'] || { prefix: 'COT', digits: 4, suffix: '', counter: 0 };
              let counter = cotationRule.counter || 0;
              const codeNumber = parseInt(cotation.code.replace(cotationRule.prefix, '').replace(cotationRule.suffix, ''));
              if (codeNumber > counter) {
                  cotationRule.counter = codeNumber;
                  codeRules['cotation'] = cotationRule;
                  localStorage.setItem('codeRules', JSON.stringify(codeRules));
              }
          }

          const rows = document.querySelectorAll('.cotationlist-table tbody tr');
          rows.forEach(row => {
              const product = {
                  productCode: row.querySelector('.product-code').value,
                  productName: row.querySelector('.product-name').value,
                  specification: row.cells[2].querySelector('input').value,
                  unit: row.cells[3].querySelector('input').value,
                  price: row.cells[4].querySelector('input').value,
                  taxRate: row.cells[5].querySelector('input').value,
                  totalPrice: row.cells[6].querySelector('input').value
              };
              cotation.products.push(product);
          });

          const index = cotations.findIndex(c => c.code === cotation.code);
          if (index >= 0) {
              cotations[index] = cotation;
          } else {
              cotations.push(cotation);
          }
          localStorage.setItem('cotations', JSON.stringify(cotations));

          cotationCodeInput.value = '';
          customerCodeSelect.value = '';
          customerNameInput.value = '';
          cotationDateInput.value = '';
          priceCategorySelect.value = '';
          const tbody = document.querySelector('.cotationlist-table tbody');
          if (tbody) tbody.innerHTML = '';
          generateCodeBtn.style.display = 'block';

          window.location.href = 'cotation.html';
      });
  } else {
      console.error('Botón guardar no encontrado');
  }

  // Evento botón imprimir
  if (printBtn) {
      printBtn.addEventListener('click', function() {
          console.log('Botón imprimir clicado');
          window.print();
      });
  } else {
      console.error('Botón imprimir no encontrado');
  }

  // Cargar opciones de código cliente y autocompletar categoría precio
  function loadCustomers() {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      customerCodeSelect.innerHTML = '<option value="">Selecciona código cliente</option>';
      customers.forEach(customer => {
          const option = document.createElement('option');
          option.value = customer.code;
          option.textContent = customer.code;
          customerCodeSelect.appendChild(option);
      });

      if (customerCodeSelect && customerNameInput && priceCategorySelect) {
          customerCodeSelect.addEventListener('change', function() {
              const selectedCode = this.value;
              const customers = JSON.parse(localStorage.getItem('customers') || '[]');
              const selectedCustomer = customers.find(c => c.code === selectedCode);
              if (selectedCustomer) {
                  customerNameInput.value = selectedCustomer.name || '';
                  priceCategorySelect.value = selectedCustomer.priceCategory || '';
              } else {
                  customerNameInput.value = '';
                  priceCategorySelect.value = '';
              }
          });
      } else {
          console.error('Elementos de código cliente, nombre o categoría precio no encontrados');
      }
  }

  if (customerCodeSelect && customerNameInput && priceCategorySelect) {
      loadCustomers();
  }

  // Evento clic en título superior
  document.querySelector('.top-bar h1').addEventListener('click', function() {
      console.log('Título superior clicado');
      window.location.href = 'index.html';
  });
});