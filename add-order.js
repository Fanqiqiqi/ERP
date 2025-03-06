// add-order.js (Updated)

const tbody = document.querySelector('.order-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const customerCodeSelect = document.querySelector('#customerCode');
const customerNameInput = document.querySelector('#customerName');
const orderCodeInput = document.querySelector('#orderCode');
const orderDateInput = document.querySelector('#orderDate');
const generateCodeBtn = document.querySelector('#generateCodeBtn');
const tableContainer = document.querySelector('.table-container');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');
const topBarTitle = document.querySelector('.top-bar h1');

// Parse URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const orderCodeParam = urlParams.get('code');
const isViewMode = urlParams.get('view') === 'true';
const isEditMode = urlParams.get('edit') === 'true';

// From customer data
function getCustomers() {
    return JSON.parse(localStorage.getItem('customers') || '[]');
}

// From product data
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

// From cotations data
function getCotations() {
    return JSON.parse(localStorage.getItem('cotations') || '[]');
}

// From stock data
function getStockData() {
    return JSON.parse(localStorage.getItem('stockData') || '[]');
}

// Save stock data to localStorage
function saveStockData(stockData) {
    localStorage.setItem('stockData', JSON.stringify(stockData));
}

// Get product currency
function getProductCurrency(productCode) {
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
}

// Generate sales order code
function generateOrderCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const orderRule = codeRules['salesorder'] || { prefix: 'ORD', digits: 6, suffix: '', counter: 0 };
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const existingCodes = orders.map(o => o.code);
    
    let counter = orderRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(orderRule.digits, '0');
        newCode = `${orderRule.prefix}${number}${orderRule.suffix}`;
    } while (existingCodes.includes(newCode));
    
    return newCode;
}

// Update order counter (called on save)
function updateOrderCounter(newCode) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const orderRule = codeRules['salesorder'] || { prefix: 'ORD', digits: 6, suffix: '', counter: 0 };
    
    const prefix = orderRule.prefix || 'ORD';
    const suffix = orderRule.suffix || '';
    const digits = orderRule.digits || 6;
    
    const numberStr = newCode.replace(prefix, '').replace(suffix, '');
    const counter = parseInt(numberStr, 10);
    
    if (counter > orderRule.counter) {
        orderRule.counter = counter;
        codeRules['salesorder'] = orderRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

// Get sale price, tax rate, lote, and stock
function getSalePriceAndStock(productCode, customerCode) {
    const cotations = getCotations();
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

// Adjust table height dynamically
function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const availableHeight = totalsSectionRect.top - tableContainerRect.top - 20;
    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = document.querySelector('.order-table').offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

// Load customers into dropdown
function loadCustomers() {
    const customers = getCustomers();
    customerCodeSelect.innerHTML = '<option value="">请选择客户</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.code;
        option.textContent = customer.code;
        customerCodeSelect.appendChild(option);
    });
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    orderDateInput.value = today;
}

// Update totals display
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
        const salePrice = parseFloat(row.querySelector('.sale-price')?.value || row.cells[5].textContent) || 0;
        const quantity = parseFloat(row.querySelector('.quantity')?.value || row.cells[4].textContent) || 0;
        const taxRate = parseFloat(row.querySelector('.tax-rate')?.value.replace('%', '') || row.cells[6].textContent.replace('%', '')) || 0;

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
            <div><label>税前总价:</label><span>${group.subtotal.toFixed(2)}</span></div>
            <div><label>税率:</label><span>${taxRate}%</span></div>
            <div><label>税值:</label><span>${group.taxValue.toFixed(2)}</span></div>
            <div><label>税后总价:</label><span>${group.totalWithTax.toFixed(2)}</span></div>
        `;
        totalsContainer.appendChild(totalsRow);
    });
    adjustTableHeight();
}

// Load existing order data
function loadOrderData() {
    if (!orderCodeParam) return;

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
    const order = orders.find(o => o.code === orderCodeParam);
    const orderItems = orderList.filter(item => item.orderCode === orderCodeParam);

    if (order) {
        orderCodeInput.value = order.code;
        const customers = getCustomers();
        const customer = customers.find(c => c.name === order.customerName);
        customerCodeSelect.value = customer ? customer.code : '';
        customerNameInput.value = order.customerName;
        orderDateInput.value = order.date;
        document.querySelector('#priceListCode').value = order.priceListCode || '';

        orderItems.forEach(item => {
            const row = document.createElement('tr');
            const currency = getProductCurrency(item.productCode);
            row.innerHTML = `
                <td><input type="text" class="product-code" value="${item.productCode}"></td>
                <td><input type="text" class="product-name" value="${item.productName}"></td>
                <td><input type="text" class="lote" value="${item.lote}"></td>
                <td><input type="number" class="stock" value="${item.stock}" readonly></td>
                <td><input type="number" class="quantity" value="${item.quantity}"></td>
                <td><input type="number" class="sale-price" value="${item.salePrice}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="text" class="tax-rate" value="${item.taxRate}%"></td>
                <td><input type="number" class="total-price" value="${item.totalPrice}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
            `;
            tbody.appendChild(row);
            bindInputEvents(row);
        });

        updateTotals();
        bindIconEvents();

        // Adjust UI based on mode
        if (isViewMode) {
            topBarTitle.textContent = '查看订单';
            addBtn.style.display = 'none';
            saveAllBtn.style.display = 'none';
            document.querySelectorAll('input, select').forEach(el => el.disabled = true);
            document.querySelectorAll('.delete-icon').forEach(el => el.style.display = 'none');
        } else if (isEditMode) {
            topBarTitle.textContent = '编辑订单';
            generateCodeBtn.style.display = 'none';
            orderCodeInput.disabled = true;
            document.querySelectorAll('.sale-price, .stock, .total-price').forEach(el => el.readOnly = true);
        } else {
            topBarTitle.textContent = '添加订单';
        }
    }
}

// Add new row
addBtn.addEventListener('click', function() {
    if (isViewMode) return;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="输入产品代码"></td>
        <td><input type="text" class="product-name" placeholder="输入产品名称"></td>
        <td><input type="text" class="lote" placeholder="输入批次号"></td>
        <td><input type="number" class="stock" placeholder="库存" readonly></td>
        <td><input type="number" class="quantity" placeholder="输入数量"></td>
        <td><input type="number" class="sale-price" placeholder="销售价格" step="0.01" readonly> <span class="currency-span"></span></td>
        <td><input type="text" class="tax-rate" placeholder="税率 (%)" step="0.01"></td>
        <td><input type="number" class="total-price" placeholder="总价" step="0.01" readonly> <span class="currency-span"></span></td>
        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
    `;
    tbody.appendChild(row);
    bindInputEvents(row);
    bindIconEvents();
    adjustTableHeight();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Back to main page
backBtn.addEventListener('click', function() {
    window.location.href = 'order.html';
});

// Save all data and update stock
saveAllBtn.addEventListener('click', function() {
    if (isViewMode) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const orderCode = orderCodeInput.value.trim();
    const customerCode = customerCodeSelect.value;
    const customerName = customerNameInput.value.trim();
    const orderDate = orderDateInput.value;
    const priceListCode = document.querySelector('#priceListCode').value.trim();

    if (!orderCode || !customerCode || !orderDate) {
        alert('请确保订单编号、客户代码和订单日期填写完整！');
        return;
    }

    const orderListData = rows.map(row => {
        const productCode = row.querySelector('.product-code').value.trim();
        const productName = row.querySelector('.product-name').value.trim();
        const lote = row.querySelector('.lote').value.trim();
        const stock = row.querySelector('.stock').value.trim();
        const quantity = row.querySelector('.quantity').value.trim();
        const salePrice = row.querySelector('.sale-price').value.trim();
        const taxRate = row.querySelector('.tax-rate').value.replace('%', '').trim();
        const totalPrice = row.querySelector('.total-price').value.trim();
        const currency = row.querySelector('.sale-price').nextElementSibling.textContent;

        if (!productCode || !productName || !quantity || !salePrice || !taxRate || !totalPrice) {
            return null;
        }

        return {
            productCode,
            productName,
            lote: lote || '',
            stock,
            quantity,
            salePrice,
            taxRate,
            totalPrice,
            orderCode,
            customerCode,
            currency,
            priceListCode
        };
    }).filter(item => item !== null);

    if (orderListData.length === 0) {
        alert('请至少添加一条有效的订单明细！');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const totalPrice = orderListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
    const orderIndex = orders.findIndex(o => o.code === orderCode);
    if (orderIndex >= 0) {
        orders[orderIndex] = {
            code: orderCode,
            customerName,
            totalAmount: totalPrice,
            date: orderDate,
            priceListCode
        };
    } else {
        orders.push({
            code: orderCode,
            customerName,
            totalAmount: totalPrice,
            date: orderDate,
            priceListCode
        });
        updateOrderCounter(orderCode);
    }
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('orderList', JSON.stringify(orderListData));

    let stockData = getStockData();
    orderListData.forEach(orderItem => {
        const productCode = orderItem.productCode;
        const lote = orderItem.lote;
        const quantitySold = parseFloat(orderItem.quantity);

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
        } else {
            const availableStock = stockData.find(item => item.productCode === productCode);
            if (availableStock) {
                const currentStock = parseFloat(availableStock.quantity);
                availableStock.quantity = Math.max(0, currentStock - quantitySold);
                availableStock.lastUpdated = new Date().toISOString().split('T')[0];
                if (availableStock.quantity === 0) {
                    stockData.splice(stockData.indexOf(availableStock), 1);
                }
            }
        }
    });

    saveStockData(stockData);
    window.location.href = 'order.html';
});

// Bind input events
function bindInputEvents(row) {
    if (isViewMode) return;

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
                        stockInput.value = saleData.stock;
                        loteInput.value = saleData.lote;
                        quantityInput.value = '';
                        totalPriceInput.value = '';
                        const currency = getProductCurrency(product.code);
                        priceCurrencySpan.textContent = currency;
                        totalPriceCurrencySpan.textContent = currency;
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
            alert('请先选择产品代码！');
            return;
        }

        const stockData = getStockData();
        const productStocks = stockData.filter(s => s.productCode === productCode);

        const existingSuggestions = document.querySelector('.lote-suggestions');
        if (existingSuggestions) existingSuggestions.remove();

        if (productStocks.length > 0) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'autocomplete-suggestions lote-suggestions';
            productStocks.forEach(stock => {
                const suggestion = document.createElement('div');
                suggestion.textContent = `${stock.lote || '无批次'} - 库存: ${stock.quantity}`;
                suggestion.addEventListener('click', function() {
                    loteInput.value = stock.lote || '';
                    stockInput.value = stock.quantity;
                    quantityInput.value = '';
                    totalPriceInput.value = '';
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
        const salePrice = parseFloat(salePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const taxRate = parseFloat(taxRateInput.value.replace('%', '')) || 0;
        const subtotal = salePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        updateTotals();
    });

    taxRateInput.addEventListener('input', function() {
        const salePrice = parseFloat(salePriceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        let taxRate = this.value.replace('%', '').trim();
        if (taxRate === '' || isNaN(taxRate)) taxRate = '0';
        taxRate = parseFloat(taxRate);
        const subtotal = salePrice * quantity;
        const taxValue = subtotal * (taxRate / 100);
        totalPriceInput.value = (subtotal + taxValue).toFixed(2);
        this.value = `${taxRate}%`;
        updateTotals();
    });
}

// Bind action icon events
function bindIconEvents() {
    if (isViewMode) return;
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

const deleteHandler = function() {
    const row = this.closest('tr');
    const productCode = row.querySelector('.product-code').value;
    if (confirm(`确定删除产品：${productCode} 的订单明细吗？`)) {
        row.remove();
        updateTotals();
    }
};

// Customer code and name linkage
customerCodeSelect.addEventListener('change', function() {
    const customers = getCustomers();
    const selectedCustomer = customers.find(c => c.code === this.value);
    customerNameInput.value = selectedCustomer ? selectedCustomer.name : '';
    const priceListCodeInput = document.querySelector('#priceListCode');
    priceListCodeInput.value = selectedCustomer && selectedCustomer.priceCategory ? selectedCustomer.priceCategory : '';
    if (!orderCodeParam) {
        tbody.innerHTML = '';
        updateTotals();
    }
});

// Generate code button event
generateCodeBtn.addEventListener('click', function() {
    if (isEditMode || isViewMode) return;
    const newCode = generateOrderCode();
    orderCodeInput.value = newCode;
});

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    if (!orderCodeParam) {
        setDefaultDate();
    }
    loadOrderData();
    updateTotals();
    window.addEventListener('resize', adjustTableHeight);
});