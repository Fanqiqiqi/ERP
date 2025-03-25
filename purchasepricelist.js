// purchasepricelist_es.js

const tbody = document.querySelector('.purchasepricelist-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const supplierCodeSelect = document.querySelector('#supplierCode');
const supplierNameInput = document.querySelector('#supplierName');
const quoteCodeInput = document.querySelector('#quoteCode');
const quoteDateInput = document.querySelector('#quoteDate');
const statusSelect = document.querySelector('#status');
const table = document.querySelector('.purchasepricelist-table');
const theadRow = table.querySelector('thead tr');
const generateCodeBtn = document.querySelector('#generateCodeBtn');

// Obtener parámetros URL
const urlParams = new URLSearchParams(window.location.search);
const priceCode = urlParams.get('priceCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && priceCode;

let tempGeneratedCode = null; // Almacenar temporalmente código generado y contador

// Cargar productos existentes
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

// Cargar proveedores
function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

// Generar nº cotización compra (solo generar, no guarda contador)
function generatePurchasePriceCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const purchasePriceRule = codeRules['purchasequote'] || { prefix: 'PP', digits: 4, suffix: '', counter: 0 };
    
    const purchasePrices = JSON.parse(localStorage.getItem('purchasePrices') || '[]');
    const existingCodes = purchasePrices.map(p => p.code);
    
    let counter = purchasePriceRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(purchasePriceRule.digits, '0');
        newCode = `${purchasePriceRule.prefix}${number}${purchasePriceRule.suffix}`;
    } while (existingCodes.includes(newCode));
    
    // Almacenar temporalmente código y contador, sin actualizar localStorage
    tempGeneratedCode = { code: newCode, counter: counter };
    return newCode;
}

// Guardar contador en localStorage (llamado al guardar)
function savePurchasePriceCodeCounter(counter) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const purchasePriceRule = codeRules['purchasequote'] || { prefix: 'PP', digits: 4, suffix: '', counter: 0 };
    purchasePriceRule.counter = counter;
    codeRules['purchasequote'] = purchasePriceRule;
    localStorage.setItem('codeRules', JSON.stringify(codeRules));
}

// Calcular total (con impuesto)
function calculateTotalPrice(newPurchasePrice, taxRate) {
    const price = parseFloat(newPurchasePrice) || 0;
    const tax = parseFloat(taxRate.replace('%', '')) / 100 || 0; // Manejar formato porcentaje
    return (price * (1 + tax)).toFixed(2);
}

// Cargar dropdown proveedores (solo códigos)
function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">Selecciona proveedor</option>';
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.code;
        option.textContent = supplier.code;
        supplierCodeSelect.appendChild(option);
    });

    if (priceCode) {
        const prices = JSON.parse(localStorage.getItem('purchasePrices') || '[]');
        const price = prices.find(p => p.code === priceCode);
        if (price) {
            supplierCodeSelect.value = price.supplierCode;
            const supplier = suppliers.find(s => s.code === price.supplierCode);
            supplierNameInput.value = supplier ? supplier.name : '';
            quoteCodeInput.value = price.code;
            statusSelect.value = price.status || '待确认';
        }
    }

    if (isViewMode || isEditMode) {
        supplierCodeSelect.disabled = true;
        quoteCodeInput.readOnly = true;
    }
}

// Establecer fecha por defecto (hoy)
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    quoteDateInput.value = today;
}

// Cargar detalles cotización compra
function loadPriceList() {
    const priceList = JSON.parse(localStorage.getItem('purchasePriceList') || '[]');
    const products = getProducts();
    tbody.innerHTML = '';

    if (isViewMode) {
        table.classList.add('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Nuevo Precio Compra</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
            <th>Fecha Cotización</th>
        `;
    } else {
        table.classList.remove('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Nuevo Precio Compra</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
            <th>Fecha Cotización</th>
            <th>Acción</th>
        `;
    }

    if (priceCode) {
        const prices = JSON.parse(localStorage.getItem('purchasePrices') || '[]');
        const price = prices.find(p => p.code === priceCode);
        if (price) {
            const filteredPriceList = priceList.filter(item => item.priceCode === priceCode);
            filteredPriceList.forEach((item, index) => {
                const product = products.find(p => p.code === item.productCode);
                const currency = product ? product.currency || '' : '';
                let taxRate = product ? product.taxRate || '0%' : '0%'; // Obtener tasa impuesto de producto
                // Si taxRate es decimal, convertir a porcentaje
                if (!taxRate.includes('%') && !isNaN(parseFloat(taxRate))) {
                    taxRate = `${(parseFloat(taxRate) * 100).toFixed(0)}%`;
                }
                const totalPrice = calculateTotalPrice(item.newPurchasePrice, taxRate);
                const row = document.createElement('tr');
                if (isEditMode) {
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="Ingresa código producto"></td>
                        <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="Ingresa nombre producto"></td>
                        <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" placeholder="Precio compra" step="0.01" readonly> <span>${currency}</span></td>
                        <td><input type="number" class="new-purchase-price" value="${item.newPurchasePrice || ''}" placeholder="Nuevo precio compra" step="0.01"> <span>${currency}</span></td>
                        <td><input type="text" class="tax-rate" value="${taxRate}" placeholder="Tasa impuesto" readonly></td>
                        <td><input type="text" class="total-price" value="${totalPrice}" placeholder="Total" readonly> <span>${currency}</span></td>
                        <td><input type="date" class="quote-date" value="${item.quoteDate || ''}" placeholder="Fecha cotización"></td>
                        <td>
                            <span class="action-icon delete-icon" data-index="${index}"><i class="fas fa-trash-alt"></i></span>
                        </td>
                    `;
                    bindInputEvents(row);
                } else {
                    row.innerHTML = `
                        <td>${item.productCode}</td>
                        <td>${item.productName}</td>
                        <td>${item.purchasePrice} ${currency}</td>
                        <td>${item.newPurchasePrice || ''} ${currency}</td>
                        <td>${taxRate}</td>
                        <td>${totalPrice} ${currency}</td>
                        <td>${item.quoteDate || ''}</td>
                    `;
                }
                tbody.appendChild(row);
            });
            quoteDateInput.value = price.quoteDate || new Date().toISOString().split('T')[0];
        }
    } else {
        setDefaultDate();
        tbody.innerHTML = '';
        tempGeneratedCode = null; // Reiniciar código temporal
    }

    if (isViewMode) {
        addBtn.style.display = 'none';
        saveAllBtn.style.display = 'none';
        printBtn.style.display = 'block';
        generateCodeBtn.style.display = 'none';
    } else if (isEditMode) {
        addBtn.style.display = 'block';
        saveAllBtn.style.display = 'block';
        printBtn.style.display = 'none';
        generateCodeBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'block';
        saveAllBtn.style.display = 'block';
        printBtn.style.display = 'none';
        generateCodeBtn.style.display = 'block';
    }
    bindIconEvents();
}

// Guardar detalles cotización compra en purchasePrices
function savePriceListToPurchasePrices() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedSupplierCode = supplierCodeSelect.value;
    const quoteCode = quoteCodeInput.value.trim();
    const quoteDate = quoteDateInput.value.trim();
    const status = statusSelect.value;

    if (!quoteCode || !selectedSupplierCode || !quoteDate) {
        alert('¡Asegúrate de completar nº cotización, código proveedor y fecha!');
        return false;
    }

    let allValid = true;
    const priceListData = rows.map(row => {
        const codeInput = row.querySelector('.product-code');
        const nameInput = row.querySelector('.product-name');
        const purchasePriceInput = row.querySelector('.purchase-price');
        const newPurchasePriceInput = row.querySelector('.new-purchase-price');
        const quoteDateInputRow = row.querySelector('.quote-date');

        let productCode, productName, purchasePrice, newPurchasePrice, quoteDateRow;

        if (codeInput && nameInput && purchasePriceInput && newPurchasePriceInput && quoteDateInputRow) {
            productCode = codeInput.value.trim();
            productName = nameInput.value.trim();
            purchasePrice = purchasePriceInput.value.trim();
            newPurchasePrice = newPurchasePriceInput.value.trim();
            quoteDateRow = quoteDateInputRow.value.trim();
        } else {
            productCode = row.cells[0].textContent.trim();
            productName = row.cells[1].textContent.trim();
            purchasePrice = row.cells[2].textContent.split(' ')[0].trim();
            newPurchasePrice = row.cells[3].textContent.split(' ')[0].trim();
            quoteDateRow = row.cells[6].textContent.trim();
        }

        if (!productCode || !productName || !purchasePrice || !quoteDateRow) {
            allValid = false;
        }

        return {
            productCode,
            productName,
            purchasePrice,
            newPurchasePrice,
            quoteDate: quoteDateRow,
            priceCode: quoteCode,
            supplierCode: selectedSupplierCode,
            status: status
        };
    });

    if (!allValid) {
        alert('¡Asegúrate de completar toda la info de productos!');
        return false;
    }

    const prices = JSON.parse(localStorage.getItem('purchasePrices') || '[]');
    if (priceCode && isEditMode) {
        const priceIndex = prices.findIndex(p => p.code === priceCode);
        if (priceIndex !== -1) {
            prices[priceIndex] = {
                code: quoteCode,
                supplierCode: selectedSupplierCode,
                quoteDate: quoteDate,
                status: status
            };
        }
    } else {
        prices.push({
            code: quoteCode,
            supplierCode: selectedSupplierCode,
            quoteDate: quoteDate,
            status: status
        });
        // Si se usó código temporal, guardar contador
        if (tempGeneratedCode && tempGeneratedCode.code === quoteCode) {
            savePurchasePriceCodeCounter(tempGeneratedCode.counter);
        }
    }

    const existingPriceList = JSON.parse(localStorage.getItem('purchasePriceList') || '[]');
    const updatedPriceList = existingPriceList.filter(item => 
        item.priceCode !== quoteCode || 
        !priceListData.some(newItem => newItem.productCode === item.productCode)
    ).concat(priceListData);

    localStorage.setItem('purchasePrices', JSON.stringify(prices));
    localStorage.setItem('purchasePriceList', JSON.stringify(updatedPriceList));

    window.dispatchEvent(new Event('storage'));
    tempGeneratedCode = null; // Limpiar código temporal tras guardar
    return true;
}

// Agregar nueva fila
addBtn.addEventListener('click', function() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="Ingresa código producto"></td>
        <td><input type="text" class="product-name" placeholder="Ingresa nombre producto"></td>
        <td><input type="number" class="purchase-price" placeholder="Precio compra" step="0.01" readonly> <span></span></td>
        <td><input type="number" class="new-purchase-price" placeholder="Nuevo precio compra" step="0.01"> <span></span></td>
        <td><input type="text" class="tax-rate" placeholder="Tasa impuesto" readonly></td>
        <td><input type="text" class="total-price" placeholder="Total" readonly> <span></span></td>
        <td><input type="date" class="quote-date" value="${quoteDateInput.value}" placeholder="Fecha cotización"></td>
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
    tempGeneratedCode = null; // Limpiar código temporal al volver
    window.location.href = 'purchaseprice.html';
    window.close();
});

// Guardar todo y volver a página principal
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(row => {
        const codeInput = row.querySelector('.product-code');
        const nameInput = row.querySelector('.product-name');
        const purchasePriceInput = row.querySelector('.purchase-price');
        const newPurchasePriceInput = row.querySelector('.new-purchase-price');
        const quoteDateInputRow = row.querySelector('.quote-date');

        if (codeInput && nameInput && purchasePriceInput && newPurchasePriceInput && quoteDateInputRow) {
            const code = codeInput.value.trim();
            const name = nameInput.value.trim();
            const purchasePrice = purchasePriceInput.value.trim();
            const newPurchasePrice = newPurchasePriceInput.value.trim();
            const quoteDate = quoteDateInputRow.value.trim();
            const currencySpan = newPurchasePriceInput.nextElementSibling.textContent.trim();

            if (code && name && purchasePrice && quoteDate) {
                row.cells[0].textContent = code;
                row.cells[1].textContent = name;
                row.cells[2].innerHTML = `${purchasePrice} <span>${currencySpan}</span>`;
                row.cells[3].innerHTML = `${newPurchasePrice} <span>${currencySpan}</span>`;
                row.cells[6].textContent = quoteDate;
            }
        }
    });

    // Si guarda con éxito, volver a purchaseprice.html
    if (savePriceListToPurchasePrices()) {
        window.location.href = 'purchaseprice.html';
    }
});

// Función imprimir
printBtn.addEventListener('click', function() {
    window.print();
});

// Evento botón generar código
generateCodeBtn.addEventListener('click', function() {
    if (!isEditMode && !isViewMode) {
        const newCode = generatePurchasePriceCode();
        quoteCodeInput.value = newCode;
    }
});

// Vincular eventos inputs (autocompletado)
function bindInputEvents(row) {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const newPurchasePriceInput = row.querySelector('.new-purchase-price');
    const taxRateInput = row.querySelector('.tax-rate');
    const totalPriceInput = row.querySelector('.total-price');

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
                        newPurchasePriceInput.placeholder = `Nuevo precio compra (${product.currency || ''})`;
                        let taxRate = product.taxRate || '0%';
                        // Si taxRate es decimal, convertir a porcentaje
                        if (!taxRate.includes('%') && !isNaN(parseFloat(taxRate))) {
                            taxRate = `${(parseFloat(taxRate) * 100).toFixed(0)}%`;
                        }
                        taxRateInput.value = taxRate; // Rellenar tasa impuesto
                        const currency = product.currency || '';
                        purchasePriceInput.nextElementSibling.textContent = currency;
                        newPurchasePriceInput.nextElementSibling.textContent = currency;
                        totalPriceInput.nextElementSibling.textContent = currency;
                        totalPriceInput.value = calculateTotalPrice(newPurchasePriceInput.value || product.purchasePrice, taxRate); // Calcular total
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
    });

    // Actualizar total al cambiar nuevo precio compra
    newPurchasePriceInput.addEventListener('input', function() {
        totalPriceInput.value = calculateTotalPrice(this.value, taxRateInput.value);
    });

    document.addEventListener('click', function(e) {
        const suggestions = row.querySelector('.autocomplete-suggestions');
        if (suggestions && !codeInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.remove();
        }
    });
}

// Vincular eventos íconos acción
function bindIconEvents() {
    if (isViewMode) return;
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

const deleteHandler = function() {
    const row = this.closest('tr');
    const productCode = row.cells[0].textContent;
    if (confirm(`¿Seguro de eliminar detalle cotización compra del producto: ${productCode}?`)) {
        row.remove();
        savePriceListToPurchasePrices();
    }
};

// Vincular código y nombre proveedor
supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    loadPriceList();
});