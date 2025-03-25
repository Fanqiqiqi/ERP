const tbody = document.querySelector('.pricelist-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const priceCategorySelect = document.querySelector('#priceCategory');
const table = document.querySelector('.pricelist-table');
const theadRow = table.querySelector('thead tr');

// Obtener parámetros URL
const urlParams = new URLSearchParams(window.location.search);
const priceCode = urlParams.get('priceCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && priceCode; // Modo vista: tiene priceCode y no es edición

// Cargar productos existentes
function getProducts() {
  return JSON.parse(localStorage.getItem('products') || '[]');
}

// Cargar categorías de lista de precios desde localStorage (prcategories)
function loadPriceCategories() {
  const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
  priceCategorySelect.innerHTML = '<option value="">Selecciona categoría</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.code;
    option.textContent = category.name;
    priceCategorySelect.appendChild(option);
  });

  if (priceCode) {
    const prices = JSON.parse(localStorage.getItem('prices') || '[]');
    const price = prices.find(p => p.code === priceCode);
    if (price) {
      const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
      const category = categories.find(c => c.name === price.category);
      if (category) {
        priceCategorySelect.value = category.code;
      }
    }
  }

  // Deshabilitar selector en modo vista
  if (isViewMode) {
    priceCategorySelect.disabled = true;
  }
}

// Cargar detalles de lista de precios
function loadPriceList() {
  const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
  const products = getProducts(); // Obtener productos
  tbody.innerHTML = '';

  // Ajustar encabezado dinámicamente
  if (isViewMode) {
    table.classList.add('view-mode');
    theadRow.innerHTML = `
      <th>Código Producto</th>
      <th>Nombre Producto</th>
      <th>Precio Compra</th>
      <th>Precio Venta</th>
      <th>Nuevo Precio Venta</th>
    `;
  } else {
    table.classList.remove('view-mode');
    theadRow.innerHTML = `
      <th>Código Producto</th>
      <th>Nombre Producto</th>
      <th>Precio Compra</th>
      <th>Precio Venta</th>
      <th>Nuevo Precio Venta</th>
      <th>Acción</th>
    `;
  }

  // Cargar datos si hay priceCode; si no, vaciar tabla
  if (priceCode) {
    const prices = JSON.parse(localStorage.getItem('prices') || '[]');
    const price = prices.find(p => p.code === priceCode);
    if (price) {
      const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
      const category = categories.find(c => c.name === price.category);
      const filteredPriceList = priceList.filter(item => item.categoryCode === category.code);

      filteredPriceList.forEach((item, index) => {
        const product = products.find(p => p.code === item.productCode); // Buscar producto
        const currency = product ? product.currency || '' : item.currency || ''; // 从产品或 priceList 获取货币
        const row = document.createElement('tr');
        if (isEditMode) {
          row.innerHTML = `
            <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="Código producto"></td>
            <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="Nombre producto"></td>
            <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" placeholder="Precio compra" step="0.01" readonly> <span>${currency}</span></td>
            <td><input type="number" class="selling-price" value="${item.sellingPrice || ''}" placeholder="Precio venta" step="0.01" readonly> <span>${currency}</span></td>
            <td><input type="number" class="new-selling-price" value="${item.newSellingPrice || ''}" placeholder="Nuevo precio" step="0.01"> <span>${currency}</span></td>
            <td>
              <span class="action-icon delete-icon" data-index="${index}"><i class="fas fa-trash-alt"></i></span>
            </td>
          `;
          bindInputEvents(row);
        } else {
          // Modo vista: 5 columnas sin acción
          row.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td>${item.purchasePrice} ${currency}</td>
            <td>${item.sellingPrice} ${currency}</td>
            <td>${item.newSellingPrice || ''} ${currency}</td>
          `;
        }
        tbody.appendChild(row);
      });
    }
  } else {
    tbody.innerHTML = '';
  }

  // Mostrar/ocultar botones según modo
  if (isViewMode) {
    addBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';
    printBtn.style.display = 'block';
  } else {
    addBtn.style.display = 'block';
    saveAllBtn.style.display = 'block';
    printBtn.style.display = 'none';
  }
  bindIconEvents();
}

// Guardar datos en prices (lista de precios)
function savePriceListToPrices() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const selectedCategoryCode = priceCategorySelect.value;
  if (!selectedCategoryCode) {
    alert('¡Selecciona una categoría de lista de precios!');
    return false;
  }

  let allValid = true;
  const priceListData = rows.map(row => {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const sellingPriceInput = row.querySelector('.selling-price');
    const newSellingPriceInput = row.querySelector('.new-selling-price');

    let productCode, productName, purchasePrice, sellingPrice, newSellingPrice, currency;

    if (codeInput && nameInput && purchasePriceInput && sellingPriceInput && newSellingPriceInput) {
      productCode = codeInput.value.trim();
      productName = nameInput.value.trim();
      purchasePrice = purchasePriceInput.value.trim();
      sellingPrice = sellingPriceInput.value.trim();
      newSellingPrice = newSellingPriceInput.value.trim();
      currency = newSellingPriceInput.nextElementSibling.textContent.trim(); // 从表格中获取货币
    } else {
      productCode = row.cells[0].textContent.trim();
      productName = row.cells[1].textContent.trim();
      purchasePrice = row.cells[2].textContent.split(' ')[0].trim();
      sellingPrice = row.cells[3].textContent.split(' ')[0].trim();
      newSellingPrice = row.cells[4].textContent.split(' ')[0].trim();
      currency = row.cells[4].textContent.split(' ')[1] || ''; // 从视图模式获取货币
    }

    if (!productCode || !productName || !purchasePrice || !sellingPrice) {
      allValid = false;
    }

    const product = getProducts().find(p => p.code === productCode);
    currency = product ? product.currency || currency : currency; // 优先使用产品中的货币

    return {
      productCode,
      productName,
      purchasePrice,
      sellingPrice,
      newSellingPrice,
      categoryCode: selectedCategoryCode,
      currency // 保存货币到 priceList
    };
  });

  if (!allValid) {
    alert('¡Asegúrate de completar toda la información de los productos!');
    return false;
  }

  const prices = JSON.parse(localStorage.getItem('prices') || '[]');
  const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
  const selectedCategory = categories.find(c => c.code === selectedCategoryCode);

  if (priceCode && isEditMode) {
    const priceIndex = prices.findIndex(p => p.code === priceCode);
    if (priceIndex !== -1) {
      prices[priceIndex].category = selectedCategory ? selectedCategory.name : selectedCategoryCode;
    }
  } else {
    const priceCodeGenerated = `PRICE${String(prices.length + 1).padStart(3, '0')}`;
    prices.push({
      code: priceCodeGenerated,
      category: selectedCategory ? selectedCategory.name : selectedCategoryCode
    });
  }

  const existingPriceList = JSON.parse(localStorage.getItem('priceList') || '[]');
  const updatedPriceList = existingPriceList.filter(item => 
    item.categoryCode !== selectedCategoryCode || 
    !priceListData.some(newItem => newItem.productCode === item.productCode)
  ).concat(priceListData);

  localStorage.setItem('prices', JSON.stringify(prices));
  localStorage.setItem('priceList', JSON.stringify(updatedPriceList));

  window.dispatchEvent(new Event('storage'));
  return true;
}

// Agregar nueva fila
addBtn.addEventListener('click', function() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="product-code" placeholder="Código producto"></td>
    <td><input type="text" class="product-name" placeholder="Nombre producto"></td>
    <td><input type="number" class="purchase-price" placeholder="Precio compra" step="0.01" readonly> <span></span></td>
    <td><input type="number" class="selling-price" placeholder="Precio venta" step="0.01" readonly> <span></span></td>
    <td><input type="number" class="new-selling-price" placeholder="Nuevo precio" step="0.01"> <span></span></td>
    <td>
      <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
    </td>
  `;
  tbody.appendChild(row);
  bindInputEvents(row);
  bindIconEvents();
});

// Volver a página principal
backBtn.addEventListener('click', function() {
  window.location.href = 'price.html';
  window.close();
});

// Guardar todo y volver
saveAllBtn.addEventListener('click', function() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach(row => {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const sellingPriceInput = row.querySelector('.selling-price');
    const newSellingPriceInput = row.querySelector('.new-selling-price');

    if (codeInput && nameInput && purchasePriceInput && sellingPriceInput && newSellingPriceInput) {
      const code = codeInput.value.trim();
      const name = nameInput.value.trim();
      const purchasePrice = purchasePriceInput.value.trim();
      const sellingPrice = sellingPriceInput.value.trim();
      const newSellingPrice = newSellingPriceInput.value.trim();
      const currencySpan = newSellingPriceInput.nextElementSibling.textContent.trim();

      if (code && name && purchasePrice && sellingPrice) {
        row.cells[0].textContent = code;
        row.cells[1].textContent = name;
        row.cells[2].innerHTML = `${purchasePrice} <span>${currencySpan}</span>`;
        row.cells[3].innerHTML = `${sellingPrice} <span>${currencySpan}</span>`;
        row.cells[4].innerHTML = `${newSellingPrice} <span>${currencySpan}</span>`;
      }
    }
  });

  if (savePriceListToPrices()) {
    window.location.href = 'price.html';
    window.close();
  }
});

// Imprimir
printBtn.addEventListener('click', function() {
  window.print();
});

// Vincular eventos de entrada (autocompletado)
function bindInputEvents(row) {
  const codeInput = row.querySelector('.product-code');
  const nameInput = row.querySelector('.product-name');
  const purchasePriceInput = row.querySelector('.purchase-price');
  const sellingPriceInput = row.querySelector('.selling-price');
  const newSellingPriceInput = row.querySelector('.new-selling-price');

  [codeInput, nameInput].forEach(input => {
    input.addEventListener('input', function() {
      const value = this.value.toLowerCase();
      const products = getProducts();
      const suggestions = products.filter(p => 
        (input.classList.contains('product-code') && p.code.toLowerCase().startsWith(value)) ||
        (input.classList.contains('product-name') && p.name.toLowerCase().startsWith(value))
      );

      const existingSuggestions = row.querySelector('.autocomplete-suggestions');
      if (existingSuggestions) existingSuggestions.remove();

      if (suggestions.length > 0 && value) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'autocomplete-suggestions';
        suggestions.forEach(product => {
          const suggestion = document.createElement('div');
          suggestion.textContent = `${product.code} - ${product.name}`;
          suggestion.addEventListener('click', function() {
            codeInput.value = product.code;
            nameInput.value = product.name;
            purchasePriceInput.value = product.purchasePrice || '';
            sellingPriceInput.value = product.sellingPrice || '';
            newSellingPriceInput.placeholder = `Nuevo precio (${product.currency || ''})`;
            const currency = product.currency || '';
            purchasePriceInput.nextElementSibling.textContent = currency;
            sellingPriceInput.nextElementSibling.textContent = currency;
            newSellingPriceInput.nextElementSibling.textContent = currency;
            suggestionsDiv.remove();
          });
          suggestionsDiv.appendChild(suggestion);
        });
        input.parentElement.style.position = 'relative';
        suggestionsDiv.style.left = `${input.offsetLeft}px`;
        suggestionsDiv.style.top = `${input.offsetTop + input.offsetHeight}px`;
        input.parentElement.appendChild(suggestionsDiv);
      }
    });

    document.addEventListener('click', function(e) {
      const suggestions = row.querySelector('.autocomplete-suggestions');
      if (suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.remove();
      }
    });
  });
}

// Vincular eventos de íconos
function bindIconEvents() {
  if (isViewMode) return; // No vincular en modo vista
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.removeEventListener('click', deleteHandler);
    icon.addEventListener('click', deleteHandler);
  });
}

const deleteHandler = function() {
  const row = this.closest('tr');
  const productCode = row.cells[0].textContent;
  if (confirm(`¿Seguro de eliminar el detalle de precio del producto: ${productCode}?`)) {
    row.remove();
    savePriceListToPrices();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  loadPriceCategories();
  loadPriceList();
});