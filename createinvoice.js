const tbody = document.querySelector('.invoice-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const customerCodeSelect = document.querySelector('#customerCode');
const customerNameInput = document.querySelector('#customerName');
const invoiceNumberInput = document.querySelector('#invoiceNumber');
const invoiceDateInput = document.querySelector('#invoiceDate');
const dueDateInput = document.querySelector('#dueDate');
const tableContainer = document.querySelector('.table-container');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');
const generateInvoiceBtn = document.querySelector('#generateInvoiceBtn');

// 从客户数据中加载客户
function getCustomers() {
    return JSON.parse(localStorage.getItem('customers') || '[]');
}

// 从产品数据中加载产品
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

// 获取产品币种
function getProductCurrency(productCode) {
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
}

// 获取销售价格和税率
function getSalePriceAndTaxRate(productCode, customerCode) {
    const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
    const products = getProducts();
    
    let price, taxRate;
    const customerCotation = cotations.find(c => c.customerCode === customerCode);
    if (customerCotation && customerCotation.products) {
        const cotationProduct = customerCotation.products.find(p => p.productCode === productCode);
        if (cotationProduct) {
            price = cotationProduct.price || '0';
            taxRate = cotationProduct.taxRate ? (parseFloat(cotationProduct.taxRate) * 100).toFixed(0) : '0';
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

    return { price, taxRate };
}

// 动态调整表格容器高度
function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const availableHeight = totalsSectionRect.top - tableContainerRect.top - 20;
    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = document.querySelector('.invoice-table').offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

// 加载客户下拉框
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

// 设置默认日期
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    invoiceDateInput.value = today;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 默认到期日为30天后
    dueDateInput.value = dueDate.toISOString().split('T')[0];
}

// 更新总额显示
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
            <div><label>税前总价:</label><span>${group.subtotal.toFixed(2)}</span></div>
            <div><label>税率:</label><span>${taxRate}%</span></div>
            <div><label>税值:</label><span>${group.taxValue.toFixed(2)}</span></div>
            <div><label>税后总价:</label><span>${group.totalWithTax.toFixed(2)}</span></div>
        `;
        totalsContainer.appendChild(totalsRow);
    });
    adjustTableHeight();
}

// 生成临时销售发票号（不占用计数器）
function generateTemporaryInvoiceNumber() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const invoiceRule = codeRules['salesinvoice'] || { prefix: 'INV', digits: 4, suffix: '', counter: 0 };
    
    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const existingInvoiceNumbers = invoiceData.map(i => i.invoiceNumber);
    
    let counter = invoiceRule.counter || 0;
    let newInvoiceNumber;
    do {
        counter++;
        const number = String(counter).padStart(invoiceRule.digits, '0');
        newInvoiceNumber = `${invoiceRule.prefix}${number}${invoiceRule.suffix}`;
    } while (existingInvoiceNumbers.includes(newInvoiceNumber));
    
    return newInvoiceNumber;
}

// 确认并占用发票号（保存时调用）
function confirmInvoiceNumber(invoiceNumber) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const invoiceRule = codeRules['salesinvoice'] || { prefix: 'INV', digits: 4, suffix: '', counter: 0 };
    
    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const existingInvoiceNumbers = invoiceData.map(i => i.invoiceNumber);
    
    if (!existingInvoiceNumbers.includes(invoiceNumber)) {
        const number = parseInt(invoiceNumber.replace(invoiceRule.prefix, '').replace(invoiceRule.suffix, ''));
        invoiceRule.counter = Math.max(invoiceRule.counter || 0, number);
        codeRules['salesinvoice'] = invoiceRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

// 添加新行
addBtn.addEventListener('click', function() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="输入产品代码"></td>
        <td><input type="text" class="product-name" placeholder="输入产品名称"></td>
        <td><input type="text" class="lote" placeholder="输入批次号"></td>
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

// 返回销售发票列表页面
backBtn.addEventListener('click', function() {
    window.location.href = 'salesinvoicelist.html';
});

// 打印按钮事件
printBtn.addEventListener('click', function() {
    window.print();
});

// 保存所有数据到发票列表
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const invoiceNumber = invoiceNumberInput.value.trim();
    const customerCode = customerCodeSelect.value;
    const customerName = customerNameInput.value.trim();
    const invoiceDate = invoiceDateInput.value;
    const dueDate = dueDateInput.value;

    if (!invoiceNumber || !customerCode || !invoiceDate || !dueDate) {
        alert('请确保发票编号、客户代码、发票日期和到期日期填写完整！');
        return;
    }

    const invoiceListData = rows.map(row => {
        const productCode = row.querySelector('.product-code').value.trim();
        const productName = row.querySelector('.product-name').value.trim();
        const lote = row.querySelector('.lote').value.trim();
        const quantity = row.querySelector('.quantity').value.trim();
        const salePrice = row.querySelector('.sale-price').value.trim();
        const taxRate = row.querySelector('.tax-rate').value.replace('%', '').trim();
        const totalPrice = row.querySelector('.total-price').value.trim();
        const currency = row.querySelector('.sale-price').nextElementSibling.textContent;

        if (!productCode || !quantity) return null;

        return {
            productCode,
            productName,
            lote: lote || '',
            quantity,
            salePrice,
            taxRate,
            totalPrice,
            invoiceNumber,
            customerCode,
            currency
        };
    }).filter(item => item !== null);

    if (invoiceListData.length === 0) {
        alert('请至少添加一条有效的发票明细！');
        return;
    }

    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const totalAmount = invoiceListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);
    const invoice = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        customerName,
        invoiceAmount: totalAmount,
        currency: invoiceListData[0].currency || '€' // 确保保存欧元
    };

    console.log('Saving invoice:', invoice); // 调试

    const existingIndex = invoiceData.findIndex(i => i.invoiceNumber === invoiceNumber);
    if (existingIndex >= 0) {
        invoiceData[existingIndex] = invoice;
    } else {
        invoiceData.push(invoice);
        confirmInvoiceNumber(invoiceNumber);
    }

    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    localStorage.setItem('invoiceList', JSON.stringify(invoiceListData));
    localStorage.removeItem('tempInvoiceData');

    window.location.href = 'salesinvoicelist.html';
});
// 绑定输入框事件
function bindInputEvents(row) {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const loteInput = row.querySelector('.lote');
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
                        const saleData = getSalePriceAndTaxRate(product.code, customerCode);
                        salePriceInput.value = saleData.price;
                        taxRateInput.value = `${saleData.taxRate}%`;
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

// 绑定操作图标事件
function bindIconEvents() {
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

const deleteHandler = function() {
    const row = this.closest('tr');
    const productCode = row.querySelector('.product-code').value;
    if (confirm(`确定删除产品：${productCode} 的发票明细吗？`)) {
        row.remove();
        updateTotals();
    }
};

// 客户代码和名称联动
customerCodeSelect.addEventListener('change', function() {
    const customers = getCustomers();
    const selectedCustomer = customers.find(c => c.code === this.value);
    customerNameInput.value = selectedCustomer ? selectedCustomer.name : '';
    updateTotals();
});

// 加载现有发票数据（编辑模式）或从出货单传递的数据
function loadInvoiceData() {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceNumber = decodeURIComponent(urlParams.get('invoiceNumber') || '');
    const isEdit = urlParams.get('edit') === 'true';
    const fromDespatch = urlParams.get('fromDespatch') === 'true';

    if (invoiceNumber && isEdit) {
        const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
        const invoice = invoiceData.find(i => i.invoiceNumber === invoiceNumber);
        if (invoice) {
            invoiceNumberInput.value = invoice.invoiceNumber;
            const customers = getCustomers();
            const customer = customers.find(c => c.name === invoice.customerName);
            if (customer) {
                customerCodeSelect.value = customer.code;
                customerNameInput.value = customer.name;
            }
            invoiceDateInput.value = invoice.invoiceDate;
            dueDateInput.value = invoice.dueDate;

            const invoiceList = JSON.parse(localStorage.getItem('invoiceList') || '[]');
            const items = invoiceList.filter(item => item.invoiceNumber === invoiceNumber);
            tbody.innerHTML = '';
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">暂无发票明细数据</td></tr>';
            } else {
                items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode}" placeholder="输入产品代码"></td>
                        <td><input type="text" class="product-name" value="${item.productName}" placeholder="输入产品名称"></td>
                        <td><input type="text" class="lote" value="${item.lote}" placeholder="输入批次号"></td>
                        <td><input type="number" class="quantity" value="${item.quantity}" placeholder="输入数量"></td>
                        <td><input type="number" class="sale-price" value="${item.salePrice}" placeholder="销售价格" step="0.01" readonly> <span class="currency-span">${item.currency || getProductCurrency(item.productCode)}</span></td>
                        <td><input type="text" class="tax-rate" value="${item.taxRate}%" placeholder="税率 (%)" step="0.01"></td>
                        <td><input type="number" class="total-price" value="${item.totalPrice}" placeholder="总价" step="0.01" readonly> <span class="currency-span">${item.currency || getProductCurrency(item.productCode)}</span></td>
                        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
                    `;
                    tbody.appendChild(row);
                    bindInputEvents(row);
                });
                bindIconEvents();
                updateTotals();
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="8">未找到该发票数据</td></tr>';
        }
    } else if (fromDespatch) {
        const tempInvoiceData = JSON.parse(localStorage.getItem('tempInvoiceData') || '{}');
        if (tempInvoiceData && tempInvoiceData.items) {
            invoiceNumberInput.value = generateTemporaryInvoiceNumber(); // 确保每次生成唯一发票号
            customerCodeSelect.value = tempInvoiceData.customerCode;
            customerNameInput.value = tempInvoiceData.customerName;
            invoiceDateInput.value = tempInvoiceData.despatchDate;
            const despatchDate = new Date(tempInvoiceData.despatchDate);
            despatchDate.setDate(despatchDate.getDate() + 30);
            dueDateInput.value = despatchDate.toISOString().split('T')[0];

            tbody.innerHTML = '';
            tempInvoiceData.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="text" class="product-code" value="${item.productCode}" placeholder="输入产品代码"></td>
                    <td><input type="text" class="product-name" value="${item.productName}" placeholder="输入产品名称"></td>
                    <td><input type="text" class="lote" value="${item.lote}" placeholder="输入批次号"></td>
                    <td><input type="number" class="quantity" value="${item.quantity}" placeholder="输入数量"></td>
                    <td><input type="number" class="sale-price" value="${item.salePrice}" placeholder="销售价格" step="0.01" readonly> <span class="currency-span">${item.currency}</span></td>
                    <td><input type="text" class="tax-rate" value="${item.taxRate}%" placeholder="税率 (%)" step="0.01"></td>
                    <td><input type="number" class="total-price" value="${item.totalPrice}" placeholder="总价" step="0.01" readonly> <span class="currency-span">${item.currency}</span></td>
                    <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
                `;
                tbody.appendChild(row);
                bindInputEvents(row);
            });
            bindIconEvents();
            updateTotals();
        }
    }
}

// 在编辑模式下禁用生成按钮和发票号输入框
function disableGenerateButtonInEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = urlParams.get('edit') === 'true';
    if (isEdit) {
        generateInvoiceBtn.style.display = 'none';
        invoiceNumberInput.setAttribute('readonly', 'readonly');
    } else {
        generateInvoiceBtn.style.display = 'block';
        invoiceNumberInput.removeAttribute('readonly');
    }
}

// 生成发票号按钮事件
generateInvoiceBtn.addEventListener('click', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = urlParams.get('edit') === 'true';
    
    if (!isEdit) {
        const newInvoiceNumber = generateTemporaryInvoiceNumber();
        invoiceNumberInput.value = newInvoiceNumber;
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    setDefaultDate();
    updateTotals();
    loadInvoiceData();
    disableGenerateButtonInEditMode();
    window.addEventListener('resize', adjustTableHeight);

    // 如果是从出货单跳转过来，隐藏生成按钮
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fromDespatch') === 'true') {
        generateInvoiceBtn.style.display = 'none';
    }
});