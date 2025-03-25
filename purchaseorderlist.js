const tbody = document.querySelector('.purchaseorderlist-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const supplierCodeSelect = document.querySelector('#supplierCode');
const supplierNameInput = document.querySelector('#supplierName');
const orderCodeInput = document.querySelector('#orderCode');
const orderDateInput = document.querySelector('#orderDate');
const expectedArrivalDateInput = document.querySelector('#expectedArrivalDate');
const table = document.querySelector('.purchaseorderlist-table');
const tableContainer = document.querySelector('.table-container');
const theadRow = table.querySelector('thead tr');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');
const generateOrderCodeBtn = document.querySelector('#generateOrderCodeBtn');

const urlParams = new URLSearchParams(window.location.search);
const orderCode = urlParams.get('orderCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && orderCode;

let tempGeneratedCode = null; // Almacenar temporalmente el código generado y el contador

function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

function getProductCurrency(productCode) {
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
}

function getConfirmedPurchasePriceAndTax(productCode, supplierCode) {
    const priceList = JSON.parse(localStorage.getItem('purchasePriceList') || '[]');
    const confirmedPrice = priceList.find(item => 
        item.productCode === productCode && 
        item.supplierCode === supplierCode && 
        item.status === '确认'
    );
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    let taxRate = product ? product.taxRate || '0' : '0';
    
    if (taxRate !== '0' && !taxRate.includes('%')) {
        taxRate = (parseFloat(taxRate) * 100).toFixed(0);
    }
    
    return {
        price: confirmedPrice ? confirmedPrice.newPurchasePrice : (product ? product.purchasePrice : ''),
        taxRate: taxRate,
        currency: product ? product.currency || '' : ''
    };
}

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

function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">Selecciona proveedor</option>';
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.code;
        option.textContent = supplier.code;
        supplierCodeSelect.appendChild(option);
    });

    if (orderCode) {
        const orders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
        const order = orders.find(o => o.orderCode === orderCode);
        if (order) {
            supplierCodeSelect.value = order.supplierCode;
            const supplier = suppliers.find(s => s.code === order.supplierCode);
            supplierNameInput.value = supplier ? supplier.name : '';
            orderCodeInput.value = order.orderCode;
            orderDateInput.value = order.orderDate;
            expectedArrivalDateInput.value = order.expectedArrivalDate || '';
        }
    }

    if (isViewMode) {
        supplierCodeSelect.disabled = true;
        supplierNameInput.readOnly = true;
        orderCodeInput.readOnly = true;
        orderDateInput.readOnly = true;
        expectedArrivalDateInput.readOnly = true;
    }
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    orderDateInput.value = today;
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 7);
    expectedArrivalDateInput.value = arrivalDate.toISOString().split('T')[0];
}

function updateTotals() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const taxGroups = {};
    let grandTotalWithTax = 0;
    const currencies = new Set();

    if (rows.length === 0) {
        const h3 = totalsContainer.parentElement.querySelector('h3');
        h3.innerHTML = `Total Orden: <span class="grand-total">0.00</span>`;
        totalsContainer.innerHTML = '';
        adjustTableHeight();
        return;
    }

    rows.forEach(row => {
        const purchasePrice = parseFloat(row.querySelector('.purchase-price')?.value || row.cells[2].textContent.split(' ')[0]) || 0;
        const quantity = parseFloat(row.querySelector('.quantity')?.value || row.cells[3].textContent) || 0;
        const taxRate = parseFloat(row.querySelector('.tax-rate')?.value.replace('%', '') || row.cells[4].textContent.replace('%', '')) || 0;
        const currency = row.querySelector('.purchase-price')?.nextElementSibling?.textContent || row.cells[2].textContent.split(' ')[1] || '';

        const subtotal = purchasePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        const totalWithTax = subtotal + taxValue;

        if (!taxGroups[taxRate]) {
            taxGroups[taxRate] = { subtotal: 0, taxValue: 0, totalWithTax: 0, currency: currency };
        }
        taxGroups[taxRate].subtotal += subtotal;
        taxGroups[taxRate].taxValue += taxValue;
        taxGroups[taxRate].totalWithTax += totalWithTax;
        grandTotalWithTax += totalWithTax;
        if (currency) currencies.add(currency);
    });

    const currencyStr = currencies.size === 1 ? Array.from(currencies)[0] : 'Varias monedas';
    const h3 = totalsContainer.parentElement.querySelector('h3');
    h3.innerHTML = `Total Orden: <span class="grand-total">${grandTotalWithTax.toFixed(2)} ${currencyStr}</span>`;

    totalsContainer.innerHTML = '';
    Object.keys(taxGroups).forEach(taxRate => {
        const group = taxGroups[taxRate];
        const totalsRow = document.createElement('div');
        totalsRow.className = 'totals-row';
        totalsRow.innerHTML = `
            <div><label>Total sin imp:</label><span>${group.subtotal.toFixed(2)} ${group.currency}</span></div>
            <div><label>Tasa imp:</label><span>${taxRate}%</span></div>
            <div><label>Valor imp:</label><span>${group.taxValue.toFixed(2)} ${group.currency}</span></div>
            <div><label>Total con imp:</label><span>${group.totalWithTax.toFixed(2)} ${group.currency}</span></div>
        `;
        totalsContainer.appendChild(totalsRow);
    });

    adjustTableHeight();
}

function loadOrderList() {
    const orderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    tbody.innerHTML = '';

    if (isViewMode) {
        table.classList.add('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Cantidad</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
        `;
        generateOrderCodeBtn.style.display = 'none';
    } else if (isEditMode) {
        table.classList.remove('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Cantidad</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
            <th>Acción</th>
        `;
        generateOrderCodeBtn.style.display = 'none';
    } else {
        table.classList.remove('view-mode');
        theadRow.innerHTML = `
            <th>Código Producto</th>
            <th>Nombre Producto</th>
            <th>Precio Compra</th>
            <th>Cantidad</th>
            <th>Tasa Impuesto</th>
            <th>Total</th>
            <th>Acción</th>
        `;
        generateOrderCodeBtn.style.display = 'block';
        tempGeneratedCode = null; // Reiniciar código temporal
    }

    if (orderCode) {
        const orders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
        const order = orders.find(o => o.orderCode === orderCode);
        if (order) {
            const filteredOrderList = orderList.filter(item => item.orderCode === orderCode);
            filteredOrderList.forEach((item, index) => {
                const currency = getProductCurrency(item.productCode);
                const row = document.createElement('tr');
                if (isEditMode) {
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="Ingresa código producto"></td>
                        <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="Ingresa nombre producto"></td>
                        <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" step="0.01" readonly> <span>${currency}</span></td>
                        <td><input type="number" class="quantity" value="${item.quantity || ''}" placeholder="Ingresa cantidad"></td>
                        <td><input type="text" class="tax-rate" value="${item.taxRate || '0'}%" step="0.01" placeholder="Ingresa tasa (%)"></td>
                        <td><input type="number" class="total-price" value="${item.totalPrice || ''}" step="0.01" readonly> <span>${currency}</span></td>
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

function saveOrderListToPurchaseOrders() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedSupplierCode = supplierCodeSelect.value;
    const orderCode = orderCodeInput.value.trim();
    const orderDate = orderDateInput.value.trim();
    const expectedArrivalDate = expectedArrivalDateInput.value.trim();

    if (!orderCode || !selectedSupplierCode || !orderDate) {
        alert('¡Asegúrate de completar el nº de orden, código proveedor y fecha de orden!');
        return false;
    }

    let allValid = true;
    const orderListData = rows.map(row => {
        const codeInput = row.querySelector('.product-code');
        const nameInput = row.querySelector('.product-name');
        const purchasePriceInput = row.querySelector('.purchase-price');
        const quantityInput = row.querySelector('.quantity');
        const taxRateInput = row.querySelector('.tax-rate');
        const totalPriceInput = row.querySelector('.total-price');

        let productCode, productName, purchasePrice, quantity, taxRate, totalPrice;

        if (codeInput && nameInput && purchasePriceInput && quantityInput && taxRateInput && totalPriceInput) {
            productCode = codeInput.value.trim();
            productName = nameInput.value.trim();
            purchasePrice = purchasePriceInput.value.trim();
            quantity = quantityInput.value.trim();
            taxRate = taxRateInput.value.replace('%', '').trim();
            totalPrice = totalPriceInput.value.trim();
            const currency = purchasePriceInput.nextElementSibling.textContent.trim();

            if (productCode && productName && purchasePrice && quantity && taxRate && totalPrice) {
                row.cells[0].textContent = productCode;
                row.cells[1].textContent = productName;
                row.cells[2].innerHTML = `${purchasePrice} <span>${currency}</span>`;
                row.cells[3].textContent = quantity;
                row.cells[4].textContent = `${taxRate}%`;
                row.cells[5].innerHTML = `${totalPrice} <span>${currency}</span>`;
            }
        } else {
            productCode = row.cells[0].textContent.trim();
            productName = row.cells[1].textContent.trim();
            purchasePrice = row.cells[2].textContent.split(' ')[0].trim();
            quantity = row.cells[3].textContent.trim();
            taxRate = row.cells[4].textContent.replace('%', '').trim();
            totalPrice = row.cells[5].textContent.split(' ')[0].trim();
        }

        if (!productCode || !productName || !purchasePrice || !quantity || !taxRate || !totalPrice) {
            allValid = false;
        }

        return {
            productCode,
            productName,
            purchasePrice,
            quantity,
            taxRate,
            totalPrice,
            orderCode: orderCode,
            supplierCode: selectedSupplierCode
        };
    });

    if (!allValid) {
        alert('¡Asegúrate de completar toda la info de productos!');
        return false;
    }

    const orders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    const orderIndex = orders.findIndex(o => o.orderCode === orderCode);

    const totalPrice = orderListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);

    if (orderIndex !== -1) {
        orders[orderIndex] = {
            orderCode: orderCode,
            supplierCode: selectedSupplierCode,
            productCode: orderListData[0].productCode,
            productName: orderListData[0].productName,
            quantity: orderListData[0].quantity,
            totalPrice: totalPrice,
            orderDate: orderDate,
            expectedArrivalDate: expectedArrivalDate
        };
    } else {
        orders.push({
            orderCode: orderCode,
            supplierCode: selectedSupplierCode,
            productCode: orderListData[0].productCode,
            productName: orderListData[0].productName,
            quantity: orderListData[0].quantity,
            totalPrice: totalPrice,
            orderDate: orderDate,
            expectedArrivalDate: expectedArrivalDate
        });
        // Si se usó un código temporal, guardar el contador
        if (tempGeneratedCode && tempGeneratedCode.code === orderCode) {
            saveOrderCodeCounter(tempGeneratedCode.counter);
        }
    }

    const existingOrderList = JSON.parse(localStorage.getItem('purchaseOrderList') || '[]');
    const updatedOrderList = existingOrderList.filter(item => 
        item.orderCode !== orderCode || 
        !orderListData.some(newItem => newItem.productCode === item.productCode)
    ).concat(orderListData);

    localStorage.setItem('purchaseOrders', JSON.stringify(orders));
    localStorage.setItem('purchaseOrderList', JSON.stringify(updatedOrderList));

    window.dispatchEvent(new Event('storage'));
    tempGeneratedCode = null; // Limpiar código temporal tras guardar
    return true;
}

// Guardar contador en localStorage
function saveOrderCodeCounter(counter) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const orderRule = codeRules['purchaseorder'];
    if (orderRule) {
        orderRule.counter = counter;
        codeRules['purchaseorder'] = orderRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

function generateOrderCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const orderRule = codeRules['purchaseorder'];

    if (!orderRule || !orderRule.prefix || !orderRule.digits) {
        alert('¡Configura primero las reglas de numeración para "orden de compra" en gestión de códigos!');
        return null;
    }

    const orders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    const existingCodes = orders.map(o => o.orderCode);
    
    let counter = orderRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(orderRule.digits, '0');
        newCode = `${orderRule.prefix}${number}${orderRule.suffix || ''}`;
    } while (existingCodes.includes(newCode));
    
    // Almacenar temporalmente código y contador, sin actualizar localStorage
    tempGeneratedCode = { code: newCode, counter: counter };
    return newCode;
}

addBtn.addEventListener('click', function() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="Ingresa código producto"></td>
        <td><input type="text" class="product-name" placeholder="Ingresa nombre producto"></td>
        <td><input type="number" class="purchase-price" placeholder="Precio compra" step="0.01" readonly> <span></span></td>
        <td><input type="number" class="quantity" placeholder="Ingresa cantidad"></td>
        <td><input type="text" class="tax-rate" placeholder="Tasa imp (%)" step="0.01"></td>
        <td><input type="number" class="total-price" placeholder="Total" step="0.01" readonly> <span></span></td>
        <td>
            <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
        </td>
    `;
    tbody.appendChild(row);
    bindInputEvents(row);
    bindIconEvents();
    adjustTableHeight();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

backBtn.addEventListener('click', function() {
    tempGeneratedCode = null; // Limpiar código temporal al volver
    window.location.href = 'purchaseorder.html';
    window.close();
});

saveAllBtn.addEventListener('click', function() {
    if (saveOrderListToPurchaseOrders()) {
        window.location.href = 'purchaseorder.html';
        window.close();
    }
});

printBtn.addEventListener('click', function() {
    window.print();
});

generateOrderCodeBtn.addEventListener('click', function() {
    if (!isEditMode && !isViewMode) {
        const newCode = generateOrderCode();
        if (newCode) {
            orderCodeInput.value = newCode;
        }
    }
});

function bindInputEvents(row) {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const quantityInput = row.querySelector('.quantity');
    const taxRateInput = row.querySelector('.tax-rate');
    const totalPriceInput = row.querySelector('.total-price');

    [codeInput, nameInput].forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const products = getProducts();
            const supplierCode = supplierCodeSelect.value;
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
                        const confirmedData = getConfirmedPurchasePriceAndTax(product.code, supplierCode);
                        purchasePriceInput.value = confirmedData.price || '';
                        purchasePriceInput.nextElementSibling.textContent = confirmedData.currency;
                        taxRateInput.value = `${confirmedData.taxRate}%`;
                        quantityInput.value = '';
                        totalPriceInput.value = '';
                        totalPriceInput.nextElementSibling.textContent = confirmedData.currency;
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
                suggestionsDiv.style.top = `${inputRect.bottom + bottleneckY}px`;
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
    if (confirm(`¿Seguro de eliminar el detalle de orden de compra del producto: ${productCode}?`)) {
        row.remove();
        saveOrderListToPurchaseOrders();
        updateTotals();
    }
};

supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

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

document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    loadOrderList();
    bindSupplierAutocomplete();
    window.addEventListener('resize', adjustTableHeight);
});