const tbody = document.querySelector('.order-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const invoiceBtn = document.querySelector('.invoice-btn');
const customerCodeSelect = document.querySelector('#customerCode');
const customerNameInput = document.querySelector('#customerName');
const despatchCodeInput = document.querySelector('#despatchCode');
const despatchDateInput = document.querySelector('#despatchDate');
const statusSelect = document.querySelector('#status');
const tableContainer = document.querySelector('.table-container');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');
const generateCodeBtn = document.querySelector('#generateCodeBtn');
const orderCodeInput = document.querySelector('#orderCode');

function getCustomers() {
    return JSON.parse(localStorage.getItem('customers') || '[]');
}

function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

function getStockData() {
    return JSON.parse(localStorage.getItem('stockData') || '[]');
}

function saveStockData(stockData) {
    localStorage.setItem('stockData', JSON.stringify(stockData));
}

function getProductCurrency(productCode) {
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || 'Desconocido' : 'Desconocido';
}

function getSalePriceAndStock(productCode, customerCode) {
    const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
    const products = getProducts();
    const stockData = getStockData();
    const customers = getCustomers();
    const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
    const priceCategories = JSON.parse(localStorage.getItem('prcategories') || '[]');

    let price, taxRate;

    const customer = customers.find(c => c.code === customerCode);
    if (customer && customer.priceCategory) {
        const selectedCategory = priceCategories.find(cat => cat.name === customer.priceCategory);
        const categoryCode = selectedCategory ? selectedCategory.code : customer.priceCategory;
        const priceItem = priceList.find(p => p.productCode === productCode && p.categoryCode === categoryCode);
        if (priceItem) {
            price = priceItem.newSellingPrice || priceItem.sellingPrice || '0';
        }
    }

    if (!price) {
        const customerCotation = cotations.find(c => c.customerCode === customerCode);
        if (customerCotation && customerCotation.products) {
            const cotationProduct = customerCotation.products.find(p => p.productCode === productCode);
            if (cotationProduct) {
                price = cotationProduct.price || '0';
                taxRate = cotationProduct.taxRate ? (parseFloat(cotationProduct.taxRate) * 100).toFixed(0) : '0';
            }
        }
    }

    const product = products.find(p => p.code === productCode);
    if (!price) {
        price = product ? product.salePrice || '0' : '0';
    }
    if (!taxRate) {
        taxRate = product ? (product.taxRate || '0') : '0';
        if (taxRate !== '0' && !taxRate.includes('%')) {
            taxRate = (parseFloat(taxRate) * 100).toFixed(0);
        }
    }

    const productStocks = stockData.filter(s => s.productCode === productCode);
    let lote = '';
    let stock = '0';
    if (productStocks.length > 0) {
        const latestStock = productStocks.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))[0];
        lote = latestStock.lote || '';
        stock = latestStock.quantity || '0';
    } else {
        stock = product ? (product.stock || '0') : '0';
    }

    return { price, taxRate, lote, stock };
}

function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const availableHeight = totalsSectionRect.top - tableContainerRect.top - 20;
    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = document.querySelector('.order-table').offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

function loadCustomers() {
    const customers = getCustomers();
    customerCodeSelect.innerHTML = '<option value="">Sel. Cliente</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.code;
        option.textContent = customer.code;
        customerCodeSelect.appendChild(option);
    });
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    despatchDateInput.value = today;
}

function updateTotals() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const taxGroups = {};
    let grandTotalWithTax = 0;

    if (rows.length === 0) {
        document.querySelector('.grand-total').textContent = '0.00';
        totalsContainer.innerHTML = '';
        adjustTableHeight();
        return;
    }

    rows.forEach(row => {
        const salePrice = parseFloat(row.querySelector('.sale-price')?.value || 0) || 0;
        const quantity = parseFloat(row.querySelector('.quantity')?.value || 0) || 0;
        const taxRate = parseFloat(row.querySelector('.tax-rate')?.value.replace('%', '') || 0) || 0;

        const subtotal = salePrice * quantity;
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

    document.querySelector('.grand-total').textContent = grandTotalWithTax.toFixed(2);
    totalsContainer.innerHTML = '';
    Object.keys(taxGroups).forEach(taxRate => {
        const group = taxGroups[taxRate];
        const totalsRow = document.createElement('div');
        totalsRow.className = 'totals-row';
        totalsRow.innerHTML = `
            <div><label>Subtotal:</label><span>${group.subtotal.toFixed(2)}</span></div>
            <div><label>Tasa Imp.:</label><span>${taxRate}%</span></div>
            <div><label>Imp.:</label><span>${group.taxValue.toFixed(2)}</span></div>
            <div><label>Total:</label><span>${group.totalWithTax.toFixed(2)}</span></div>
        `;
        totalsContainer.appendChild(totalsRow);
    });
    adjustTableHeight();
}

function checkStockAvailability(despatchCode = null) {
    const orderCode = orderCodeInput.value.trim();

    if (orderCode) {
        return { isValid: true };
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const stockData = getStockData();
    const despatchList = JSON.parse(localStorage.getItem('despatchList') || '[]');

    for (const row of rows) {
        const productCode = row.querySelector('.product-code').value.trim();
        const lote = row.querySelector('.lote').value.trim();
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;

        if (productCode && quantity > 0) {
            const stockItem = stockData.find(item => 
                item.productCode === productCode && (lote ? item.lote === lote : true)
            );
            let availableStock = stockItem ? parseFloat(stockItem.quantity) : 0;

            if (despatchCode) {
                const existingItems = despatchList.filter(item => 
                    item.despatchCode === despatchCode && 
                    item.productCode === productCode && 
                    (!lote || item.lote === lote)
                );
                const previouslyUsedQuantity = existingItems.reduce((sum, item) => 
                    sum + (parseFloat(item.quantity) || 0), 0);
                availableStock += previouslyUsedQuantity;
            }

            if (quantity > availableStock) {
                const loteDisplay = lote || 'Sin Lote';
                return { isValid: false, message: `¡Stock insuficiente para lote ${loteDisplay}! Stock actual: ${availableStock}` };
            }
        }
    }
    return { isValid: true };
}

function generateTemporaryDespatchCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const despatchRule = codeRules['salesdespatch'] || { prefix: 'DES', digits: 4, suffix: '', counter: 0 };
    
    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    const existingCodes = despatches.map(d => d.code);
    
    let counter = despatchRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(despatchRule.digits, '0');
        newCode = `${despatchRule.prefix}${number}${despatchRule.suffix}`;
    } while (existingCodes.includes(newCode));
    
    return newCode;
}

function confirmDespatchCode(code) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const despatchRule = codeRules['salesdespatch'] || { prefix: 'DES', digits: 4, suffix: '', counter: 0 };
    
    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    const existingCodes = despatches.map(d => d.code);
    
    if (!existingCodes.includes(code)) {
        const number = parseInt(code.replace(despatchRule.prefix, '').replace(despatchRule.suffix, ''));
        despatchRule.counter = Math.max(despatchRule.counter || 0, number);
        codeRules['salesdespatch'] = despatchRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

function generateTemporaryInvoiceCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const invoiceRule = codeRules['salesinvoice'] || { prefix: 'INV', digits: 4, suffix: '', counter: 0 };

    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const existingCodes = invoiceData.map(inv => inv.invoiceNumber);

    let counter = invoiceRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(invoiceRule.digits, '0');
        newCode = `${invoiceRule.prefix}${number}${invoiceRule.suffix}`;
    } while (existingCodes.includes(newCode));

    return newCode;
}

function confirmInvoiceCode(code) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const invoiceRule = codeRules['salesinvoice'] || { prefix: 'INV', digits: 4, suffix: '', counter: 0 };

    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const existingCodes = invoiceData.map(inv => inv.invoiceNumber);

    if (!existingCodes.includes(code)) {
        const number = parseInt(code.replace(invoiceRule.prefix, '').replace(invoiceRule.suffix, ''));
        invoiceRule.counter = Math.max(invoiceRule.counter || 0, number);
        codeRules['salesinvoice'] = invoiceRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

function updateOrderStatus(orderCode, despatchDate) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.code === orderCode);
    if (orderIndex >= 0) {
        orders[orderIndex].deliveryDate = despatchDate;
        orders[orderIndex].status = 'Enviado';
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

addBtn.addEventListener('click', function() {
    const stockCheck = checkStockAvailability();
    if (!stockCheck.isValid) {
        alert(stockCheck.message);
        return;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="Cód. Producto"></td>
        <td><input type="text" class="product-name" placeholder="Nombre Prod."></td>
        <td><input type="text" class="lote" placeholder="Lote"></td>
        <td><input type="number" class="stock" placeholder="Stock" readonly></td>
        <td><input type="number" class="quantity" placeholder="Cant."></td>
        <td><input type="number" class="sale-price" placeholder="Precio Venta" step="0.01" readonly> <span class="currency-span"></span></td>
        <td><input type="text" class="tax-rate" placeholder="Tasa Imp. (%)" step="0.01"></td>
        <td><input type="number" class="total-price" placeholder="Total" step="0.01" readonly> <span class="currency-span"></span></td>
        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
    `;
    tbody.appendChild(row);
    bindInputEvents(row);
    bindIconEvents();
    adjustTableHeight();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

backBtn.addEventListener('click', function() {
    window.location.href = 'despatch.html';
});

printBtn.addEventListener('click', function() {
    window.print();
});

invoiceBtn.addEventListener('click', function() {
    const despatchCode = despatchCodeInput.value.trim();
    if (!despatchCode) {
        alert('¡Ingresa el Nº de envío antes de enviar la factura!');
        return;
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const customerCode = customerCodeSelect.value;
    const customerName = customerNameInput.value.trim();
    const despatchDate = despatchDateInput.value;
    const orderCode = orderCodeInput.value.trim();
    const verifactu = document.querySelector('input[name="verifactu"]:checked').value;

    if (!customerCode || !despatchDate || rows.length === 0) {
        alert('¡Asegúrate de completar Cód. Cliente, Fecha Envío y detalles!');
        return;
    }

    const stockCheck = checkStockAvailability(despatchCode);
    if (!stockCheck.isValid) {
        alert(stockCheck.message);
        return;
    }

    const despatchListData = rows.map(row => {
        const productCode = row.querySelector('.product-code').value.trim();
        const productName = row.querySelector('.product-name').value.trim();
        const lote = row.querySelector('.lote').value.trim();
        const stock = row.querySelector('.stock').value.trim();
        const quantity = row.querySelector('.quantity').value.trim();
        const salePrice = row.querySelector('.sale-price').value.trim();
        const taxRate = row.querySelector('.tax-rate').value.replace('%', '').trim();
        const totalPrice = row.querySelector('.total-price').value.trim();
        const currency = row.querySelector('.sale-price').nextElementSibling.textContent || getProductCurrency(productCode);

        if (!productCode || !quantity) return null;

        return {
            productCode,
            productName,
            lote: lote || '',
            stock,
            quantity,
            salePrice,
            taxRate,
            totalPrice,
            despatchCode,
            customerCode,
            currency
        };
    }).filter(item => item !== null);

    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    const despatchList = JSON.parse(localStorage.getItem('despatchList') || '[]');
    const updatedDespatchList = despatchList.filter(item => item.despatchCode !== despatchCode);
    updatedDespatchList.push(...despatchListData);

    const totalAmount = despatchListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
    const despatchData = {
        code: despatchCode,
        customerName,
        totalAmount,
        date: despatchDate,
        customerCode,
        status: '已开票',
        verifactu
    };

    const existingIndex = despatches.findIndex(d => d.code === despatchCode);
    if (existingIndex >= 0) {
        despatches[existingIndex] = despatchData;
    } else {
        despatches.push(despatchData);
        confirmDespatchCode(despatchCode);
    }

    localStorage.setItem('despatches', JSON.stringify(despatches));
    localStorage.setItem('despatchList', JSON.stringify(updatedDespatchList));

    if (!orderCode) {
        let stockData = getStockData();
        despatchListData.forEach(despatchItem => {
            const productCode = despatchItem.productCode;
            const lote = despatchItem.lote;
            const quantitySold = parseFloat(despatchItem.quantity);

            const stockIndex = stockData.findIndex(item => 
                item.productCode === productCode && (!lote || item.lote === lote)
            );

            if (stockIndex !== -1) {
                const currentStock = parseFloat(stockData[stockIndex].quantity);
                stockData[stockIndex].quantity = Math.max(0, currentStock - quantitySold);
                stockData[stockIndex].lastUpdated = new Date().toISOString().split('T')[0];
                if (stockData[stockIndex].quantity === 0) {
                    stockData.splice(stockIndex, 1);
                }
            }
        });
        saveStockData(stockData);
    }

    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    if (!codeRules['salesinvoice']) {
        alert('¡Registra primero la regla de generación de Nº de factura en gestión de códigos!');
        return;
    }
    const invoiceNumber = generateTemporaryInvoiceCode();
    const dueDate = new Date(despatchDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    const currency = despatchListData[0].currency || 'Desconocido';
    const newInvoice = {
        invoiceNumber,
        invoiceDate: despatchDate,
        dueDate: dueDate.toISOString().split('T')[0],
        customerName,
        invoiceAmount: totalAmount,
        currency,
        items: despatchListData,
        verifactu
    };

    const existingInvoiceIndex = invoiceData.findIndex(inv => inv.invoiceNumber === invoiceNumber);
    if (existingInvoiceIndex >= 0) {
        invoiceData[existingInvoiceIndex] = newInvoice;
    } else {
        invoiceData.push(newInvoice);
        confirmInvoiceCode(invoiceNumber);
    }
    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));

    const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
    const receivable = {
        receivableNo: `REC-${invoiceNumber}`,
        invoiceDate: despatchDate,
        dueDate: dueDate.toISOString().split('T')[0],
        customerName,
        amount: totalAmount,
        status: 'Sin Pagar'
    };
    const receivableIndex = receivablesData.findIndex(r => r.receivableNo === receivable.receivableNo);
    if (receivableIndex >= 0) {
        receivablesData[receivableIndex] = receivable;
    } else {
        receivablesData.push(receivable);
    }
    localStorage.setItem('receivablesData', JSON.stringify(receivablesData));

    const receivablesList = JSON.parse(localStorage.getItem('receivablesList') || '[]');
    const receivableDetail = {
        invoiceNo: invoiceNumber,
        amount: parseFloat(totalAmount),
        paidAmount: 0,
        unpaidAmount: parseFloat(totalAmount),
        receivableNo: receivable.receivableNo,
        customerCode,
        customerName,
        invoiceDate: despatchDate,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'Sin Pagar'
    };
    const receivableDetailIndex = receivablesList.findIndex(r => r.receivableNo === receivable.receivableNo && r.invoiceNo === invoiceNumber);
    if (receivableDetailIndex >= 0) {
        receivablesList[receivableDetailIndex] = receivableDetail;
    } else {
        receivablesList.push(receivableDetail);
    }
    localStorage.setItem('receivablesList', JSON.stringify(receivablesList));

    if (orderCode) {
        updateOrderStatus(orderCode, despatchDate);
    }

    window.location.href = 'salesinvoicelist.html';
});

saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const despatchCode = despatchCodeInput.value.trim();
    const customerCode = customerCodeSelect.value;
    const customerName = customerNameInput.value.trim();
    const despatchDate = despatchDateInput.value;
    const orderCode = orderCodeInput.value.trim();
    const verifactu = document.querySelector('input[name="verifactu"]:checked').value;

    if (!despatchCode || !customerCode || !despatchDate) {
        alert('¡Completa Nº Envío, Cód. Cliente y Fecha!');
        return;
    }

    const despatchListData = rows.map(row => {
        const productCode = row.querySelector('.product-code').value.trim();
        const productName = row.querySelector('.product-name').value.trim();
        const lote = row.querySelector('.lote').value.trim();
        const stock = row.querySelector('.stock').value.trim();
        const quantity = row.querySelector('.quantity').value.trim();
        const salePrice = row.querySelector('.sale-price').value.trim();
        const taxRate = row.querySelector('.tax-rate').value.replace('%', '').trim();
        const totalPrice = row.querySelector('.total-price').value.trim();
        const currency = row.querySelector('.sale-price').nextElementSibling.textContent || getProductCurrency(productCode);

        if (!productCode || !quantity) return null;

        return {
            productCode,
            productName,
            lote: lote || '',
            stock,
            quantity,
            salePrice,
            taxRate,
            totalPrice,
            despatchCode,
            customerCode,
            currency
        };
    }).filter(item => item !== null);

    if (despatchListData.length === 0) {
        alert('¡Agrega al menos un detalle de envío válido!');
        return;
    }

    const stockCheck = checkStockAvailability(despatchCode);
    if (!stockCheck.isValid) {
        alert(stockCheck.message);
        return;
    }

    const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
    const despatchList = JSON.parse(localStorage.getItem('despatchList') || '[]');
    const updatedDespatchList = despatchList.filter(item => item.despatchCode !== despatchCode);
    updatedDespatchList.push(...despatchListData);

    const totalAmount = despatchListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
    const despatchData = {
        code: despatchCode,
        customerName,
        totalAmount,
        date: despatchDate,
        customerCode,
        status: '未开票',
        verifactu
    };

    const existingIndex = despatches.findIndex(d => d.code === despatchCode);
    if (existingIndex >= 0) {
        despatches[existingIndex] = despatchData;
    } else {
        despatches.push(despatchData);
        confirmDespatchCode(despatchCode);
    }

    localStorage.setItem('despatches', JSON.stringify(despatches));
    localStorage.setItem('despatchList', JSON.stringify(updatedDespatchList));

    if (!orderCode) {
        let stockData = getStockData();
        despatchListData.forEach(despatchItem => {
            const productCode = despatchItem.productCode;
            const lote = despatchItem.lote;
            const quantitySold = parseFloat(despatchItem.quantity);

            const stockIndex = stockData.findIndex(item => 
                item.productCode === productCode && (!lote || item.lote === lote)
            );

            if (stockIndex !== -1) {
                const currentStock = parseFloat(stockData[stockIndex].quantity);
                stockData[stockIndex].quantity = Math.max(0, currentStock - quantitySold);
                stockData[stockIndex].lastUpdated = new Date().toISOString().split('T')[0];
                if (stockData[stockIndex].quantity === 0) {
                    stockData.splice(stockIndex, 1);
                }
            }
        });
        saveStockData(stockData);
    }

    if (orderCode) {
        updateOrderStatus(orderCode, despatchDate);
    }

    window.location.href = 'despatch.html';
});

function bindInputEvents(row) {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const loteInput = row.querySelector('.lote');
    const stockInput = row.querySelector('.stock');
    const quantityInput = row.querySelector('.quantity');
    const salePriceInput = row.querySelector('.sale-price');
    const taxRateInput = row.querySelector('.tax-rate');
    const totalPriceInput = row.querySelector('.total-price');
    const priceCurrencySpan = salePriceInput.nextElementSibling;
    const totalPriceCurrencySpan = totalPriceInput.nextElementSibling;

    function calculateTotalPrice() {
        const salePrice = parseFloat(salePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value.replace('%', '')) || 0;
        const subtotal = salePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
    }

    [codeInput, nameInput].forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const products = getProducts();
            const customerCode = customerCodeSelect.value;
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
                        const saleData = getSalePriceAndStock(product.code, customerCode);
                        salePriceInput.value = saleData.price;
                        taxRateInput.value = `${saleData.taxRate}%`;
                        if (!orderCodeInput.value) {
                            stockInput.value = saleData.stock;
                            loteInput.value = saleData.lote;
                        }
                        quantityInput.value = '';
                        totalPriceInput.value = '';
                        const currency = getProductCurrency(product.code);
                        priceCurrencySpan.textContent = currency;
                        totalPriceCurrencySpan.textContent = currency;
                        calculateTotalPrice();
                        updateTotals();
                        suggestionsDiv.remove();
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

    loteInput.addEventListener('click', function() {
        const productCode = codeInput.value.trim();
        if (!productCode) {
            alert('¡Selecciona primero el Cód. Producto!');
            return;
        }

        if (orderCodeInput.value) return;

        const stockData = getStockData();
        const productStocks = stockData.filter(s => s.productCode === productCode);

        const existingSuggestions = document.querySelector('.lote-suggestions');
        if (existingSuggestions) existingSuggestions.remove();

        if (productStocks.length > 0) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'autocomplete-suggestions lote-suggestions';
            productStocks.forEach(stock => {
                const suggestion = document.createElement('div');
                suggestion.textContent = `${stock.lote || 'Sin Lote'} - Stock: ${stock.quantity}`;
                suggestion.addEventListener('click', function() {
                    loteInput.value = stock.lote || '';
                    stockInput.value = stock.quantity;
                    quantityInput.value = '';
                    totalPriceInput.value = '';
                    calculateTotalPrice();
                    updateTotals();
                    suggestionsDiv.remove();
                });
                suggestionsDiv.appendChild(suggestion);
            });
            document.body.appendChild(suggestionsDiv);
            const inputRect = loteInput.getBoundingClientRect();
            suggestionsDiv.style.left = `${inputRect.left + window.scrollX}px`;
            suggestionsDiv.style.top = `${inputRect.bottom + window.scrollY}px`;
            suggestionsDiv.style.width = `${inputRect.width}px`;
        }

        document.addEventListener('click', function handler(e) {
            const suggestions = document.querySelector('.lote-suggestions');
            if (suggestions && !loteInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.remove();
                document.removeEventListener('click', handler);
            }
        });
    });

    quantityInput.addEventListener('input', function() {
        calculateTotalPrice();
        updateTotals();
    });

    taxRateInput.addEventListener('input', function() {
        let taxRate = this.value.replace('%', '').trim();
        if (taxRate === '' || isNaN(taxRate)) taxRate = '0';
        taxRate = parseFloat(taxRate);
        calculateTotalPrice();
        this.value = `${taxRate}%`;
        updateTotals();
    });

    calculateTotalPrice();
}

function bindIconEvents() {
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

const deleteHandler = function() {
    const row = this.closest('tr');
    const productCode = row.querySelector('.product-code').value;
    if (confirm(`¿Eliminar detalle de envío del producto: ${productCode}?`)) {
        row.remove();
        updateTotals();
    }
};

customerCodeSelect.addEventListener('change', function() {
    const customers = getCustomers();
    const selectedCustomer = customers.find(c => c.code === this.value);
    customerNameInput.value = selectedCustomer ? selectedCustomer.name : '';
    updateTotals();
});

function loadDespatchData() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = decodeURIComponent(urlParams.get('code') || '');
    const isEdit = urlParams.get('edit') === 'true';
    const isView = urlParams.get('view') === 'true';

    if (code && (isEdit || isView)) {
        const despatches = JSON.parse(localStorage.getItem('despatches') || '[]');
        const despatch = despatches.find(d => d.code === code);
        if (despatch) {
            despatchCodeInput.value = despatch.code;
            const customers = getCustomers();
            const customer = customers.find(c => c.name === despatch.customerName);
            if (customer) {
                customerCodeSelect.value = customer.code;
                customerNameInput.value = customer.name;
            }
            despatchDateInput.value = despatch.date;
            statusSelect.value = despatch.status === '未开票' ? 'Sin Factura' : 'Con Factura';
            document.querySelector(`input[name="verifactu"][value="${despatch.verifactu || 'yes'}"]`).checked = true;
            generateCodeBtn.style.display = 'none';

            const despatchList = JSON.parse(localStorage.getItem('despatchList') || '[]');
            const items = despatchList.filter(item => item.despatchCode === code);
            tbody.innerHTML = '';
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9">Sin datos de detalles</td></tr>';
            } else {
                items.forEach(item => {
                    const currency = item.currency || getProductCurrency(item.productCode);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode}" placeholder="Cód. Producto"></td>
                        <td><input type="text" class="product-name" value="${item.productName}" placeholder="Nombre Prod."></td>
                        <td><input type="text" class="lote" value="${item.lote}" placeholder="Lote"></td>
                        <td><input type="number" class="stock" value="${item.stock}" placeholder="Stock" readonly></td>
                        <td><input type="number" class="quantity" value="${item.quantity}" placeholder="Cant."></td>
                        <td><input type="number" class="sale-price" value="${item.salePrice}" placeholder="Precio Venta" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                        <td><input type="text" class="tax-rate" value="${item.taxRate}%" placeholder="Tasa Imp. (%)" step="0.01"></td>
                        <td><input type="number" class="total-price" value="${item.totalPrice || ''}" placeholder="Total" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
                    `;
                    tbody.appendChild(row);
                    bindInputEvents(row);
                });
                bindIconEvents();
                updateTotals();
            }

            if (isView) {
                document.querySelectorAll('input, select').forEach(element => {
                    element.setAttribute('readonly', 'readonly');
                    element.setAttribute('disabled', 'disabled');
                });
                addBtn.style.display = 'none';
                saveAllBtn.style.display = 'none';
                printBtn.style.display = 'block';
                invoiceBtn.style.display = 'block';
                document.querySelectorAll('.delete-icon').forEach(icon => {
                    icon.style.display = 'none';
                });
            } else if (isEdit) {
                document.querySelectorAll('.quantity, .tax-rate').forEach(element => {
                    element.removeAttribute('readonly');
                    element.removeAttribute('disabled');
                });
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="9">No se encontró el envío</td></tr>';
        }
    } else {
        generateCodeBtn.style.display = 'block';
        statusSelect.value = 'Sin Factura';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    setDefaultDate();
    updateTotals();
    loadDespatchData();
    window.addEventListener('resize', adjustTableHeight);

    generateCodeBtn.addEventListener('click', function() {
        const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
        if (!codeRules['salesdespatch']) {
            alert('¡Registra primero la regla de generación de Nº de envío en gestión de códigos!');
            return;
        }
        const newCode = generateTemporaryDespatchCode();
        despatchCodeInput.value = newCode;
    });

    orderCodeInput.addEventListener('click', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const isEdit = urlParams.get('edit') === 'true';
        const isView = urlParams.get('view') === 'true';
        if (isEdit || isView) return;

        const width = screen.width;
        const height = screen.height;
        const orderWindow = window.open(
            'selectSalesOrder.html',
            'SelectSalesOrder',
            `width=${width},height=${height},top=0,left=0,fullscreen=yes`
        );

        window.addEventListener('message', function handler(event) {
            console.log('Mensaje recibido en despatchout:', event.data);
            if (event.data && event.data.orderCode) {
                const { orderCode, items, customerCode, customerName } = event.data;
                orderCodeInput.value = orderCode;

                customerCodeSelect.value = customerCode || '';
                if (!customerCode && customerName) {
                    const customers = getCustomers();
                    const customer = customers.find(c => c.name === customerName);
                    customerCodeSelect.value = customer ? customer.code : '';
                }
                customerNameInput.value = customerName || '';
                if (!customerName && customerCode) {
                    const customers = getCustomers();
                    const customer = customers.find(c => c.code === customerCode);
                    customerNameInput.value = customer ? customer.name : '';
                }

                if (!items || items.length === 0) {
                    alert('¡La orden de venta seleccionada no tiene detalles!');
                    return;
                }

                const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
                tbody.innerHTML = '';
                const products = getProducts();
                items.forEach(item => {
                    const product = products.find(p => p.code === item.productCode);
                    const currency = product ? product.currency || 'Desconocido' : 'Desconocido';
                    const orderItem = orderList.find(o => o.orderCode === orderCode && o.productCode === item.productCode);
                    
                    const saleData = getSalePriceAndStock(item.productCode, customerCodeSelect.value);
                    const salePrice = orderItem && orderItem.salePrice ? orderItem.salePrice : saleData.price;
                    const lote = orderItem && orderItem.lote !== undefined ? orderItem.lote : saleData.lote;
                    const stock = orderItem && orderItem.stock !== undefined ? orderItem.stock : saleData.stock;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="Cód. Producto"></td>
                        <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="Nombre Prod."></td>
                        <td><input type="text" class="lote" value="${lote || ''}" placeholder="Lote"></td>
                        <td><input type="number" class="stock" value="${stock || ''}" placeholder="Stock" readonly></td>
                        <td><input type="number" class="quantity" value="${item.quantity || ''}" placeholder="Cant."></td>
                        <td><input type="number" class="sale-price" value="${salePrice || ''}" placeholder="Precio Venta" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                        <td><input type="text" class="tax-rate" value="${saleData.taxRate || '0'}%" placeholder="Tasa Imp. (%)" step="0.01"></td>
                        <td><input type="number" class="total-price" value="" placeholder="Total" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
                    `;
                    tbody.appendChild(row);
                    bindInputEvents(row);
                });

                bindIconEvents();
                updateTotals();
            } else {
                console.warn('Mensaje inválido recibido:', event.data);
            }
            window.removeEventListener('message', handler);
        }, { once: true });
    });
});