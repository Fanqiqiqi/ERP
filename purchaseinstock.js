const tbody = document.querySelector('.purchaseinstock-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const supplierCodeSelect = document.querySelector('#supplierCode');
const supplierNameInput = document.querySelector('#supplierName');
const instockCodeInput = document.querySelector('#instockCode');
const orderCodeInput = document.querySelector('#orderCode');
const loteInput = document.querySelector('#lote');
const instockDateInput = document.querySelector('#instockDate');
const table = document.querySelector('.purchaseinstock-table');
const tableContainer = document.querySelector('.table-container');
const theadRow = table.querySelector('thead tr');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');

// Obtener parámetros de URL
const urlParams = new URLSearchParams(window.location.search);
const instockCode = urlParams.get('instockCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && instockCode;

// Almacenar temporalmente el código de entrada generado
let tempInstockCode = null;

// Cargar productos existentes
function getProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    console.log('Todos los productos registrados:', products);
    return products;
}

// Cargar proveedores
function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

// Obtener precio de compra confirmado y tasa de impuesto
function getConfirmedPurchasePriceAndTax(productCode, supplierCode) {
    const priceList = JSON.parse(localStorage.getItem('purchasePriceList') || '[]');
    const products = getProducts();

    const confirmedPrice = priceList.find(item => 
        item.productCode === productCode && 
        item.supplierCode === supplierCode && 
        item.status === '确认'
    );

    const product = products.find(p => p.code === productCode);
    let purchasePrice = '';
    let taxRate = '0';

    if (confirmedPrice) {
        purchasePrice = confirmedPrice.newPurchasePrice;
    } else if (product) {
        purchasePrice = product.purchasePrice;
    }

    if (product && product.taxRate !== undefined) {
        taxRate = product.taxRate.toString();
        if (!taxRate.includes('%')) {
            const rateValue = parseFloat(taxRate);
            taxRate = isNaN(rateValue) ? '0' : rateValue < 1 ? `${(rateValue * 100).toFixed(0)}%` : `${rateValue.toFixed(0)}%`;
        }
    }

    console.log(`Para producto ${productCode} con proveedor ${supplierCode}: Precio = ${purchasePrice}, Tasa = ${taxRate}`);
    return { price: purchasePrice, taxRate: taxRate };
}

// Ajustar altura del contenedor de la tabla
function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalsSectionTop = totalsSectionRect.top + window.scrollY;
    const tableContainerTop = tableContainerRect.top + window.scrollY;
    const availableHeight = totalsSectionTop - tableContainerTop - 20;

    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = table.offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

// Cargar proveedores en el select
function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">Selecciona proveedor</option>';
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.code;
        option.textContent = supplier.code;
        supplierCodeSelect.appendChild(option);
    });

    if (instockCode) {
        const instocks = JSON.parse(localStorage.getItem('purchaseInstocks') || '[]');
        const instock = instocks.find(i => i.instockCode === instockCode);
        if (instock) {
            supplierCodeSelect.value = instock.supplierCode;
            const supplier = suppliers.find(s => s.code === instock.supplierCode);
            supplierNameInput.value = supplier ? supplier.name : '';
            instockCodeInput.value = instock.instockCode;
            orderCodeInput.value = instock.orderCode || '';
            loteInput.value = instock.lote || '';
            instockDateInput.value = instock.instockDate;
        }
    }

    if (isViewMode) {
        supplierCodeSelect.disabled = true;
        supplierNameInput.readOnly = true;
        instockCodeInput.readOnly = true;
        orderCodeInput.readOnly = true;
        loteInput.readOnly = true;
        instockDateInput.readOnly = true;
    }
}

// Establecer fecha por defecto (hoy)
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    instockDateInput.value = today;
}

// Actualizar totales
function updateTotals() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const taxGroups = {};
    let grandTotalWithTax = 0;

    if (rows.length === 0) {
        const h3 = totalsContainer.parentElement.querySelector('h3');
        h3.innerHTML = `Total de Entrada: <span class="grand-total">0.00</span>`;
        totalsContainer.innerHTML = '';
        adjustTableHeight();
        return;
    }

    rows.forEach(row => {
        const purchasePrice = parseFloat(row.querySelector('.purchase-price')?.value || row.cells[2].textContent.replace(/[^0-9.]/g, '')) || 0;
        const quantity = parseFloat(row.querySelector('.quantity')?.value || row.cells[4].textContent) || 0;
        const taxRate = parseFloat(row.querySelector('.tax-rate')?.value.replace('%', '') || row.cells[5].textContent.replace('%', '')) || 0;

        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        const totalWithTax = subtotal + taxValue;

        if (!taxGroups[taxRate]) {
            taxGroups[taxRate] = { subtotal: 0, taxValue: 0, totalWithTax: 0 };
        }
        taxGroups[taxRate].subtotal += subtotal;
        taxGroups[taxRate].taxValue += taxValue;
        taxGroups[taxRate].totalWithTax += totalWithTax;
        grandTotalWithTax += totalWithTax;
    });

    const h3 = totalsContainer.parentElement.querySelector('h3');
    h3.innerHTML = `Total de Entrada: <span class="grand-total">${grandTotalWithTax.toFixed(2)}</span>`;

    totalsContainer.innerHTML = '';
    Object.keys(taxGroups).forEach(taxRate => {
        const group = taxGroups[taxRate];
        const totalsRow = document.createElement('div');
        totalsRow.className = 'totals-row';
        totalsRow.innerHTML = `
            <div><label>Subtotal:</label><span>${group.subtotal.toFixed(2)}</span></div>
            <div><label>Tasa:</label><span>${taxRate}%</span></div>
            <div><label>Impuesto:</label><span>${group.taxValue.toFixed(2)}</span></div>
            <div><label>Total con Impuesto:</label><span>${group.totalWithTax.toFixed(2)}</span></div>
        `;
        totalsContainer.appendChild(totalsRow);
    });

    adjustTableHeight();
}

// Cargar detalles de entrada
function loadInstockList() {
    const instockList = JSON.parse(localStorage.getItem('purchaseInstockList') || '[]');
    const products = getProducts();
    tbody.innerHTML = '';

    if (isViewMode) {
        table.classList.add('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Cantidad Compra</th>
            <th>Cantidad Entrada</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
        `;
    } else {
        table.classList.remove('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Cantidad Compra</th>
            <th>Cantidad Entrada</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
            <th>Acción</th>
        `;
    }

    if (instockCode) {
        const instocks = JSON.parse(localStorage.getItem('purchaseInstocks') || '[]');
        const instock = instocks.find(i => i.instockCode === instockCode);
        if (instock) {
            const items = instock.items || instockList.filter(item => item.instockCode === instockCode);
            items.forEach((item, index) => {
                const product = products.find(p => p.code === item.productCode);
                const currency = product ? product.currency || '' : '';
                const row = document.createElement('tr');
                if (isEditMode) {
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="Código"></td>
                        <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="Nombre"></td>
                        <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                        <td><input type="number" class="purchase-quantity" value="${item.purchaseQuantity || ''}" step="1" readonly></td>
                        <td><input type="number" class="quantity" value="${item.quantity || ''}" placeholder="Cantidad"></td>
                        <td><input type="text" class="tax-rate" value="${item.taxRate || '0'}%" step="0.01" placeholder="Tasa (%)"></td>
                        <td><input type="number" class="total-price" value="${item.totalPrice || ''}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
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
                        <td>${item.purchaseQuantity || ''}</td>
                        <td>${item.quantity}</td>
                        <td>${item.taxRate || '0'}%</td>
                        <td>${item.totalPrice} ${currency}</td>
                    `;
                }
                tbody.appendChild(row);
            });
        }
    } else {
        setDefaultDate();
        tbody.innerHTML = '';
    }

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
    adjustTableHeight();
    updateTotals();
}

// Guardar datos de entrada
function saveInstockListToPurchaseInstocks() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedSupplierCode = supplierCodeSelect.value;
    const instockCode = instockCodeInput.value.trim();
    const orderCode = orderCodeInput.value.trim();
    const lote = loteInput.value.trim();
    const instockDate = instockDateInput.value.trim();

    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === selectedSupplierCode);
    const supplierName = selectedSupplier ? selectedSupplier.name : 'No especificado';

    if (!instockCode || !selectedSupplierCode || !instockDate) {
        alert('¡Asegúrate de completar el código de entrada, código de proveedor y fecha!');
        return false;
    }

    const instocks = JSON.parse(localStorage.getItem('purchaseInstocks') || '[]');
    const existingInstock = instocks.find(i => 
        i.instockCode === instockCode && 
        (!isEditMode || i.instockCode !== urlParams.get('instockCode'))
    );
    if (existingInstock) {
        alert('¡Este código de entrada ya existe, usa uno diferente!');
        return false;
    }

    let allValid = true;
    const instockListData = rows.map(row => {
        const codeInput = row.querySelector('.product-code');
        const nameInput = row.querySelector('.product-name');
        const purchasePriceInput = row.querySelector('.purchase-price');
        const purchaseQuantityInput = row.querySelector('.purchase-quantity');
        const quantityInput = row.querySelector('.quantity');
        const taxRateInput = row.querySelector('.tax-rate');
        const totalPriceInput = row.querySelector('.total-price');

        let productCode, productName, purchasePrice, purchaseQuantity, quantity, taxRate, totalPrice;

        if (codeInput && nameInput && purchasePriceInput && purchaseQuantityInput && quantityInput && taxRateInput && totalPriceInput) {
            productCode = codeInput.value.trim();
            productName = nameInput.value.trim();
            purchasePrice = purchasePriceInput.value.trim();
            purchaseQuantity = purchaseQuantityInput.value.trim();
            quantity = quantityInput.value.trim();
            taxRate = taxRateInput.value.replace('%', '').trim();
            totalPrice = totalPriceInput.value.trim();

            if (productCode && productName && purchasePrice && quantity && taxRate && totalPrice) {
                row.cells[0].textContent = productCode;
                row.cells[1].textContent = productName;
                row.cells[2].textContent = purchasePrice;
                row.cells[3].textContent = purchaseQuantity;
                row.cells[4].textContent = quantity;
                row.cells[5].textContent = `${taxRate}%`;
                row.cells[6].textContent = totalPrice;
            }
        } else {
            productCode = row.cells[0].textContent.trim();
            productName = row.cells[1].textContent.trim();
            purchasePrice = row.cells[2].textContent.replace(/[^0-9.]/g, '').trim();
            purchaseQuantity = row.cells[3].textContent.trim();
            quantity = row.cells[4].textContent.trim();
            taxRate = row.cells[5].textContent.replace('%', '').trim();
            totalPrice = row.cells[6].textContent.replace(/[^0-9.]/g, '').trim();
        }

        if (!productCode || !productName || !purchasePrice || !quantity || !taxRate || !totalPrice) {
            allValid = false;
        }

        return {
            productCode,
            productName,
            purchasePrice,
            purchaseQuantity,
            quantity,
            taxRate,
            totalPrice,
            instockCode: instockCode,
            supplierCode: selectedSupplierCode,
            supplierName: supplierName
        };
    });

    if (!allValid) {
        alert('¡Asegúrate de completar toda la información de los productos!');
        return false;
    }

    const instockIndex = instocks.findIndex(i => i.instockCode === instockCode);

    const totalPrice = instockListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);

    const instockData = {
        instockCode: instockCode,
        supplierCode: selectedSupplierCode,
        orderCode: orderCode,
        lote: lote,
        items: instockListData,
        totalPrice: totalPrice,
        instockDate: instockDate
    };

    if (instockIndex !== -1) {
        instocks[instockIndex] = instockData;
    } else {
        instocks.push(instockData);
    }

    const existingInstockList = JSON.parse(localStorage.getItem('purchaseInstockList') || '[]');
    const updatedInstockList = existingInstockList.filter(item => 
        item.instockCode !== instockCode || 
        !instockListData.some(newItem => newItem.productCode === item.productCode)
    ).concat(instockListData);

    localStorage.setItem('purchaseInstocks', JSON.stringify(instocks));
    localStorage.setItem('purchaseInstockList', JSON.stringify(updatedInstockList));

    if (tempInstockCode === instockCode) {
        const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
        const instockRule = codeRules['instock'] || { prefix: 'INS', digits: 4, suffix: '', counter: 0 };
        const counter = parseInt(instockCode.replace(instockRule.prefix, '').replace(instockRule.suffix, ''), 10);
        instockRule.counter = Math.max(instockRule.counter || 0, counter);
        codeRules['instock'] = instockRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
        tempInstockCode = null;
    }

    updateStockData(instockListData, lote, totalPrice);

    if (orderCode) {
        let purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
        const orderIndex = purchaseOrders.findIndex(order => order.orderCode === orderCode);
        if (orderIndex !== -1) {
            purchaseOrders[orderIndex].status = 'Procesado';
            localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
            console.log(`Estado de orden ${orderCode} actualizado a 'Procesado'`);
        } else {
            console.warn(`Orden ${orderCode} no encontrada`);
        }
    }

    window.dispatchEvent(new Event('storage'));
    return true;
}

// Actualizar datos de inventario
function updateStockData(instockListData, lote, totalPrice) {
    let stockData = JSON.parse(localStorage.getItem('stockData') || '[]');

    instockListData.forEach(item => {
        const existingStockIndex = stockData.findIndex(stock => 
            stock.productCode === item.productCode && stock.lote === lote
        );

        const quantity = parseInt(item.quantity);
        const amount = parseFloat(item.totalPrice).toFixed(2);

        if (existingStockIndex !== -1) {
            stockData[existingStockIndex].quantity = parseInt(stockData[existingStockIndex].quantity) + quantity;
            stockData[existingStockIndex].amount = (parseFloat(stockData[existingStockIndex].amount) + parseFloat(amount)).toFixed(2);
            stockData[existingStockIndex].lastUpdated = new Date().toISOString().split('T')[0];
            stockData[existingStockIndex].supplierName = item.supplierName;
        } else {
            stockData.push({
                productCode: item.productCode,
                productName: item.productName,
                supplierName: item.supplierName,
                quantity: quantity,
                lote: lote || '',
                amount: amount,
                lastUpdated: new Date().toISOString().split('T')[0]
            });
        }
    });

    localStorage.setItem('stockData', JSON.stringify(stockData));
}

// Generar código de entrada
function generateInstockCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const instockRule = codeRules['instock'] || { prefix: 'INS', digits: 4, suffix: '', counter: 0 };

    const instocks = JSON.parse(localStorage.getItem('purchaseInstocks') || '[]');
    const existingCodes = instocks.map(i => i.instockCode);

    let counter = instockRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(instockRule.digits, '0');
        newCode = `${instockRule.prefix}${number}${instockRule.suffix}`;
    } while (existingCodes.includes(newCode));

    tempInstockCode = newCode;
    console.log('Código temporal generado:', newCode);
    return newCode;
}

// Agregar nueva fila (modo manual)
addBtn.addEventListener('click', function() {
    if (orderCodeInput.value) {
        if (!confirm('Hay datos de orden, agregar manual borrará los datos, ¿continuar?')) return;
        tbody.innerHTML = '';
        orderCodeInput.value = '';
        supplierCodeSelect.value = '';
        supplierNameInput.value = '';
    }
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="Código"></td>
        <td><input type="text" class="product-name" placeholder="Nombre"></td>
        <td><input type="number" class="purchase-price" placeholder="Precio" step="0.01"> <span class="currency-span"></span></td>
        <td><input type="number" class="purchase-quantity" placeholder="Cantidad Compra" step="1"></td>
        <td><input type="number" class="quantity" placeholder="Cantidad Entrada"></td>
        <td><input type="text" class="tax-rate" placeholder="Tasa (%)" step="0.01"></td>
        <td><input type="number" class="total-price" placeholder="Total" step="0.01" readonly> <span class="currency-span"></span></td>
        <td>
            <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
        </td>
    `;
    tbody.appendChild(row);
    bindManualInputEvents(row);
    bindIconEvents();
    adjustTableHeight();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Volver a la página principal
backBtn.addEventListener('click', function() {
    window.location.href = 'purchaseorderinstocklist.html';
    window.close();
});

// Guardar todo y volver
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const loteValue = loteInput.value.trim();

    rows.forEach(row => {
        const codeInput = row.querySelector('.product-code');
        const nameInput = row.querySelector('.product-name');
        const purchasePriceInput = row.querySelector('.purchase-price');
        const purchaseQuantityInput = row.querySelector('.purchase-quantity');
        const quantityInput = row.querySelector('.quantity');
        const taxRateInput = row.querySelector('.tax-rate');
        const totalPriceInput = row.querySelector('.total-price');

        if (codeInput && nameInput && purchasePriceInput && purchaseQuantityInput && quantityInput && taxRateInput && totalPriceInput) {
            const code = codeInput.value.trim();
            const name = nameInput.value.trim();
            const purchasePrice = purchasePriceInput.value.trim();
            const purchaseQuantity = purchaseQuantityInput.value.trim();
            const quantity = quantityInput.value.trim();
            const taxRate = taxRateInput.value.replace('%', '').trim();
            const totalPrice = totalPriceInput.value.trim();

            if (code && name && purchasePrice && quantity && taxRate && totalPrice) {
                row.cells[0].textContent = code;
                row.cells[1].textContent = name;
                row.cells[2].innerHTML = `${purchasePrice} <span class="currency-span">${purchasePriceInput.nextElementSibling.textContent}</span>`;
                row.cells[3].textContent = purchaseQuantity;
                row.cells[4].textContent = quantity;
                row.cells[5].textContent = `${taxRate}%`;
                row.cells[6].innerHTML = `${totalPrice} <span class="currency-span">${totalPriceInput.nextElementSibling.textContent}</span>`;
            }
        }
    });

    if (!loteValue) {
        if (!confirm('¿Omitir el número LOTE?')) {
            return;
        }
    }

    if (saveInstockListToPurchaseInstocks()) {
        window.location.href = 'purchaseorderinstocklist.html';
        window.close();
    }
});

// Imprimir
printBtn.addEventListener('click', function() {
    window.print();
});

// Vincular eventos de entrada (modo orden)
function bindInputEvents(row) {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const purchaseQuantityInput = row.querySelector('.purchase-quantity');
    const quantityInput = row.querySelector('.quantity');
    const taxRateInput = row.querySelector('.tax-rate');
    const totalPriceInput = row.querySelector('.total-price');
    const purchasePriceSpan = purchasePriceInput.nextElementSibling;
    const totalPriceSpan = totalPriceInput.nextElementSibling;

    const purchaseOrderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    const orderCode = orderCodeInput.value;
    const orderItems = purchaseOrderList.filter(item => item.orderCode === orderCode);

    [codeInput, nameInput].forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const suggestions = orderItems.filter(p => 
                (input.classList.contains('product-code') && p.productCode.toLowerCase().startsWith(value)) ||
                (input.classList.contains('product-name') && p.productName.toLowerCase().startsWith(value))
            );

            const existingSuggestions = document.querySelector('.autocomplete-suggestions');
            if (existingSuggestions) existingSuggestions.remove();

            if (suggestions.length > 0 && value) {
                const suggestionsDiv = document.createElement('div');
                suggestionsDiv.className = 'autocomplete-suggestions';
                suggestions.forEach(product => {
                    const suggestion = document.createElement('div');
                    suggestion.textContent = `${product.productCode} - ${product.productName}`;
                    suggestion.addEventListener('click', function() {
                        codeInput.value = product.productCode;
                        nameInput.value = product.productName;
                        purchaseQuantityInput.value = product.purchaseQuantity || '';

                        const supplierCode = supplierCodeSelect.value || '';
                        const priceAndTax = getConfirmedPurchasePriceAndTax(product.productCode, supplierCode);
                        purchasePriceInput.value = priceAndTax.price || '';
                        taxRateInput.value = priceAndTax.taxRate || '0%';

                        quantityInput.value = '';
                        totalPriceInput.value = '';

                        const products = getProducts();
                        const productData = products.find(p => p.code === product.productCode);
                        const currency = product.currency || (productData ? productData.currency : '');
                        purchasePriceSpan.textContent = currency;
                        totalPriceSpan.textContent = currency;

                        updateTotals();
                        if (suggestionsDiv && suggestionsDiv.parentNode) {
                            suggestionsDiv.parentNode.removeChild(suggestionsDiv);
                        }
                    });
                    suggestionsDiv.appendChild(suggestion);
                });
                document.body.appendChild(suggestionsDiv);
                const inputRect = input.getBoundingClientRect();
                suggestionsDiv.style.left = `${inputRect.left + window.scrollX}px`;
                suggestionsDiv.style.top = `${inputRect.bottom + window.scrollY}px`;
                suggestionsDiv.style.width = `${inputRect.width}px`;
            }
        });

        document.addEventListener('click', function(e) {
            const suggestions = document.querySelector('.autocomplete-suggestions');
            if (suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.remove();
            }
        }, { once: true });
    });

    quantityInput.addEventListener('input', function() {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value.replace('%', '')) || 0;
        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        updateTotals();
    });

    taxRateInput.addEventListener('input', function() {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        let taxRate = this.value.replace('%', '').trim();
        if (taxRate === '' || isNaN(taxRate)) taxRate = '0';
        taxRate = parseFloat(taxRate);
        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        this.value = `${taxRate}%`;
        updateTotals();
    });
}

// Vincular eventos manuales
function bindManualInputEvents(row) {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const purchaseQuantityInput = row.querySelector('.purchase-quantity');
    const quantityInput = row.querySelector('.quantity');
    const taxRateInput = row.querySelector('.tax-rate');
    const totalPriceInput = row.querySelector('.total-price');
    const purchasePriceSpan = purchasePriceInput.nextElementSibling;
    const totalPriceSpan = totalPriceInput.nextElementSibling;

    [codeInput, nameInput].forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const products = getProducts();
            const suggestions = products.filter(p => 
                (input.classList.contains('product-code') && p.code.toLowerCase().startsWith(value)) ||
                (input.classList.contains('product-name') && p.name.toLowerCase().startsWith(value))
            );

            const existingSuggestions = document.querySelector('.autocomplete-suggestions');
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

                        const supplierCode = supplierCodeSelect.value || '';
                        const priceAndTax = getConfirmedPurchasePriceAndTax(product.code, supplierCode);
                        purchasePriceInput.value = priceAndTax.price || '';
                        taxRateInput.value = priceAndTax.taxRate || '0%';

                        purchaseQuantityInput.value = '';
                        quantityInput.value = '';
                        totalPriceInput.value = '';

                        const currency = product.currency || '';
                        purchasePriceSpan.textContent = currency;
                        totalPriceSpan.textContent = currency;

                        updateTotals();
                        if (suggestionsDiv && suggestionsDiv.parentNode) {
                            suggestionsDiv.parentNode.removeChild(suggestionsDiv);
                        }
                    });
                    suggestionsDiv.appendChild(suggestion);
                });
                document.body.appendChild(suggestionsDiv);
                const inputRect = input.getBoundingClientRect();
                suggestionsDiv.style.left = `${inputRect.left + window.scrollX}px`;
                suggestionsDiv.style.top = `${inputRect.bottom + window.scrollY}px`;
                suggestionsDiv.style.width = `${inputRect.width}px`;
            }
        });

        document.addEventListener('click', function(e) {
            const suggestions = document.querySelector('.autocomplete-suggestions');
            if (suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.remove();
            }
        }, { once: true });
    });

    purchasePriceInput.addEventListener('input', function() {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value.replace('%', '')) || 0;
        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        updateTotals();
    });

    purchaseQuantityInput.addEventListener('input', function() {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value.replace('%', '')) || 0;
        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        updateTotals();
    });

    quantityInput.addEventListener('input', function() {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value.replace('%', '')) || 0;
        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        updateTotals();
    });

    taxRateInput.addEventListener('input', function() {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        let taxRate = this.value.replace('%', '').trim();
        if (taxRate === '' || isNaN(taxRate)) taxRate = '0';
        taxRate = parseFloat(taxRate);
        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        this.value = `${taxRate}%`;
        updateTotals();
    });
}

// Vincular eventos de íconos
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
    if (confirm(`¿Eliminar detalle del producto: ${productCode}?`)) {
        row.remove();
        saveInstockListToPurchaseInstocks();
        updateTotals();
    }
};

// Vincular código y nombre del proveedor
supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

// Autocompletado de nombre de proveedor
function bindSupplierAutocomplete() {
    supplierNameInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const suppliers = getSuppliers();
        const suggestions = suppliers.filter(s => s.name.toLowerCase().startsWith(value));

        const existingSuggestions = document.querySelector('.autocomplete-suggestions');
        if (existingSuggestions) existingSuggestions.remove();

        if (suggestions.length > 0 && value) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'autocomplete-suggestions';
            suggestions.forEach(supplier => {
                const suggestion = document.createElement('div');
                suggestion.textContent = `${supplier.code} - ${supplier.name}`;
                suggestion.addEventListener('click', function() {
                    supplierCodeSelect.value = supplier.code;
                    supplierNameInput.value = supplier.name;
                    if (suggestionsDiv && suggestionsDiv.parentNode) {
                        suggestionsDiv.parentNode.removeChild(suggestionsDiv);
                    }
                });
                suggestionsDiv.appendChild(suggestion);
            });
            document.body.appendChild(suggestionsDiv);
            const inputRect = supplierNameInput.getBoundingClientRect();
            suggestionsDiv.style.left = `${inputRect.left + window.scrollX}px`;
            suggestionsDiv.style.top = `${inputRect.bottom + window.scrollY}px`;
            suggestionsDiv.style.width = `${inputRect.width}px`;
        }
    });

    document.addEventListener('click', function(e) {
        const suggestions = document.querySelector('.autocomplete-suggestions');
        if (suggestions && !supplierNameInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.remove();
        }
    }, { once: true });
}

// Abrir ventana de selección de orden
orderCodeInput.addEventListener('click', function() {
    if (isViewMode || isEditMode) return;
    const width = screen.width;
    const height = screen.height;
    const orderWindow = window.open(
        'selectPurchaseOrder.html', 
        'SelectPurchaseOrder', 
        `width=${width},height=${height},top=0,left=0,fullscreen=yes`
    );
    window.addEventListener('message', function handler(event) {
        console.log('Mensaje recibido:', event.data);
        if (event.data && event.data.orderCode) {
            const { orderCode, items, supplierCode } = event.data;
            orderCodeInput.value = orderCode;
            supplierCodeSelect.value = supplierCode || '';
            const supplier = getSuppliers().find(s => s.code === supplierCode);
            supplierNameInput.value = supplier ? supplier.name : '';

            tbody.innerHTML = '';
            const products = getProducts();
            items.forEach(item => {
                const product = products.find(p => p.code === item.productCode);
                const currency = product ? product.currency || '' : '';
                const priceAndTax = getConfirmedPurchasePriceAndTax(item.productCode, supplierCode);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="Código"></td>
                    <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="Nombre"></td>
                    <td><input type="number" class="purchase-price" value="${priceAndTax.price || ''}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                    <td><input type="number" class="purchase-quantity" value="${item.purchaseQuantity || ''}" step="1" readonly></td>
                    <td><input type="number" class="quantity" value="" placeholder="Cantidad Entrada"></td>
                    <td><input type="text" class="tax-rate" value="${priceAndTax.taxRate || '0%'}" step="0.01" placeholder="Tasa (%)"></td>
                    <td><input type="number" class="total-price" value="" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                    <td>
                        <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
                    </td>
                `;
                tbody.appendChild(row);
                bindInputEvents(row);
            });

            bindIconEvents();
            updateTotals();
        }
    }, { once: true });
});

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    loadInstockList();
    bindSupplierAutocomplete();
    window.addEventListener('resize', adjustTableHeight);

    const generateInstockCodeBtn = document.querySelector('#generateInstockCodeBtn');
    if (generateInstockCodeBtn) {
        if (!isEditMode && !isViewMode) {
            generateInstockCodeBtn.style.display = 'block';
            generateInstockCodeBtn.addEventListener('click', function() {
                const newCode = generateInstockCode();
                instockCodeInput.value = newCode;
            });
        } else {
            generateInstockCodeBtn.style.display = 'none';
        }
    } else {
        console.error('Botón Generar no encontrado');
    }
});