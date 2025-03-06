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

// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const instockCode = urlParams.get('instockCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && instockCode;

// 临时存储生成的入库单号
let tempInstockCode = null;

// 从产品数据中加载已有产品
function getProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    console.log('All registered products:', products);
    return products;
}

// 从供应商数据中加载供应商
function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

// 从采购报价中获取确认的新采购价格和税率
// 从采购报价中获取确认的新采购价格和税率，并支持 fallback 到产品价格
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
    let taxRate = '0'; // 默认值为 '0'，不带百分比

    if (confirmedPrice) {
        purchasePrice = confirmedPrice.newPurchasePrice;
    } else if (product) {
        purchasePrice = product.purchasePrice;
    }

    if (product && product.taxRate !== undefined) {
        taxRate = product.taxRate.toString(); // 转换为字符串，确保一致性
        if (!taxRate.includes('%')) {
            // 如果没有百分比符号，且是数值，转换为百分比格式
            const rateValue = parseFloat(taxRate);
            taxRate = isNaN(rateValue) ? '0' : rateValue < 1 ? `${(rateValue * 100).toFixed(0)}%` : `${rateValue.toFixed(0)}%`;
        }
    }

    console.log(`For product ${productCode} with supplier ${supplierCode}: Price = ${purchasePrice}, Tax Rate = ${taxRate}`);

    return {
        price: purchasePrice,
        taxRate: taxRate
    };
}
// 动态调整表格容器高度
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

// 加载供应商下拉框并初始化字段
function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">请选择供应商</option>';
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

// 设置默认日期为今天
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    instockDateInput.value = today;
}

// 更新总额显示
function updateTotals() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const taxGroups = {};
    let grandTotalWithTax = 0;

    if (rows.length === 0) {
        const h3 = totalsContainer.parentElement.querySelector('h3');
        h3.innerHTML = `入库总额: <span class="grand-total">0.00</span>`;
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
    h3.innerHTML = `入库总额: <span class="grand-total">${grandTotalWithTax.toFixed(2)}</span>`;

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

// 加载采购入库明细数据
function loadInstockList() {
    const instockList = JSON.parse(localStorage.getItem('purchaseInstockList') || '[]');
    const products = getProducts();
    tbody.innerHTML = '';

    if (isViewMode) {
        table.classList.add('view-mode');
        theadRow.innerHTML = `
            <th>产品代码</th>
            <th>产品名称</th>
            <th>采购价格</th>
            <th>采购数量</th>
            <th>入库数量</th>
            <th>税率</th>
            <th>总价</th>
        `;
    } else {
        table.classList.remove('view-mode');
        theadRow.innerHTML = `
            <th>产品代码</th>
            <th>产品名称</th>
            <th>采购价格</th>
            <th>采购数量</th>
            <th>入库数量</th>
            <th>税率</th>
            <th>总价</th>
            <th>操作</th>
        `;
    }

    if (instockCode) {
        const instocks = JSON.parse(localStorage.getItem('purchaseInstocks') || '[]');
        const instock = instocks.find(i => i.instockCode === instockCode);
        if (instock) {
            const items = instock.items || instockList.filter(item => item.instockCode === instockCode); // Fallback to purchaseInstockList
            items.forEach((item, index) => {
                const product = products.find(p => p.code === item.productCode);
                const currency = product ? product.currency || '' : '';
                const row = document.createElement('tr');
                if (isEditMode) {
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="输入产品代码"></td>
                        <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="输入产品名称"></td>
                        <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                        <td><input type="number" class="purchase-quantity" value="${item.purchaseQuantity || ''}" step="1" readonly></td>
                        <td><input type="number" class="quantity" value="${item.quantity || ''}" placeholder="输入数量"></td>
                        <td><input type="text" class="tax-rate" value="${item.taxRate || '0'}%" step="0.01" placeholder="输入税率 (%)"></td>
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

// 保存采购入库明细数据到 purchaseInstocks 并更新库存
// 保存采购入库明细数据到 purchaseInstocks 并更新库存
function saveInstockListToPurchaseInstocks() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedSupplierCode = supplierCodeSelect.value;
    const instockCode = instockCodeInput.value.trim();
    const orderCode = orderCodeInput.value.trim();
    const lote = loteInput.value.trim();
    const instockDate = instockDateInput.value.trim();

    // 获取供应商名称
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === selectedSupplierCode);
    const supplierName = selectedSupplier ? selectedSupplier.name : '未指定';

    if (!instockCode || !selectedSupplierCode || !instockDate) {
        alert('请确保入库单号、供应商代码和入库日期填写完整！');
        return false;
    }

    const instocks = JSON.parse(localStorage.getItem('purchaseInstocks') || '[]');
    const existingInstock = instocks.find(i => 
        i.instockCode === instockCode && 
        (!isEditMode || i.instockCode !== urlParams.get('instockCode'))
    );
    if (existingInstock) {
        alert('该入库单号已存在，请使用不同的入库单号！');
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
            purchasePrice = row.cells[2].textContent.replace(/[^0-9.]/g, '').trim(); // Remove currency
            purchaseQuantity = row.cells[3].textContent.trim();
            quantity = row.cells[4].textContent.trim();
            taxRate = row.cells[5].textContent.replace('%', '').trim();
            totalPrice = row.cells[6].textContent.replace(/[^0-9.]/g, '').trim(); // Remove currency
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
            supplierName: supplierName // 新增供应商名称
        };
    });

    if (!allValid) {
        alert('请确保所有产品信息填写完整！');
        return false;
    }

    const instockIndex = instocks.findIndex(i => i.instockCode === instockCode);

    const totalPrice = instockListData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toFixed(2);

    const instockData = {
        instockCode: instockCode,
        supplierCode: selectedSupplierCode,
        orderCode: orderCode,
        lote: lote,
        items: instockListData, // Store all line items
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

    window.dispatchEvent(new Event('storage'));
    return true;
}

// 更新库存数据
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
            stockData[existingStockIndex].supplierName = item.supplierName; // 更新供应商名称
        } else {
            stockData.push({
                productCode: item.productCode,
                productName: item.productName,
                supplierName: item.supplierName, // 新增供应商名称
                quantity: quantity,
                lote: lote || '',
                amount: amount,
                lastUpdated: new Date().toISOString().split('T')[0]
            });
        }
    });

    localStorage.setItem('stockData', JSON.stringify(stockData));
}
// 生成入库单号（仅生成，不占用）
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
    console.log('Generated temporary instock code:', newCode);
    return newCode;
}

// 添加新行（手动输入模式）
addBtn.addEventListener('click', function() {
    if (orderCodeInput.value) {
        if (!confirm('当前已有采购订单数据，手动添加将清空现有数据并进入手动模式，是否继续？')) return;
        tbody.innerHTML = '';
        orderCodeInput.value = '';
        supplierCodeSelect.value = '';
        supplierNameInput.value = '';
    }
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="输入产品代码"></td>
        <td><input type="text" class="product-name" placeholder="输入产品名称"></td>
        <td><input type="number" class="purchase-price" placeholder="输入采购价格" step="0.01"> <span class="currency-span"></span></td>
        <td><input type="number" class="purchase-quantity" placeholder="输入采购数量" step="1"></td>
        <td><input type="number" class="quantity" placeholder="输入实际入库数量"></td>
        <td><input type="text" class="tax-rate" placeholder="输入税率 (%)" step="0.01"></td>
        <td><input type="number" class="total-price" placeholder="总价" step="0.01" readonly> <span class="currency-span"></span></td>
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

// 返回主页面
backBtn.addEventListener('click', function() {
    window.location.href = 'purchaseorderinstocklist.html';
    window.close();
});

// 保存所有数据并跳转回主页面
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
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

    if (saveInstockListToPurchaseInstocks()) {
        window.location.href = 'purchaseorderinstocklist.html';
        window.close();
    }
});

// 打印功能
printBtn.addEventListener('click', function() {
    window.print();
});

// 绑定输入框事件（用于采购订单模式）
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

    // Existing quantity and tax rate input listeners remain unchanged
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

// 绑定手动输入事件（显示所有注册产品）
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

    // Existing listeners for price, quantity, and tax rate remain unchanged
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
// 绑定操作图标事件
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
    if (confirm(`确定删除产品：${productCode} 的入库明细吗？`)) {
        row.remove();
        saveInstockListToPurchaseInstocks();
        updateTotals();
    }
};

// 联动供应商代码和名称
supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

// 添加供应商名称自动补全
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

// 点击采购订单号输入框弹出采购单选择页面并接收数据
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
        console.log('Received message in purchaseinstock:', event.data);
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
                    <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="输入产品代码"></td>
                    <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="输入产品名称"></td>
                    <td><input type="number" class="purchase-price" value="${priceAndTax.price || ''}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                    <td><input type="number" class="purchase-quantity" value="${item.purchaseQuantity || ''}" step="1" readonly></td>
                    <td><input type="number" class="quantity" value="" placeholder="输入实际入库数量"></td>
                    <td><input type="text" class="tax-rate" value="${priceAndTax.taxRate || '0%'}" step="0.01" placeholder="输入税率 (%)"></td>
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

// 页面加载时初始化
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
        console.error('generateInstockCodeBtn not found in DOM');
    }
});