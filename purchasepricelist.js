// purchasepricelist.js

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

// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const priceCode = urlParams.get('priceCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && priceCode;

let tempGeneratedCode = null; // 临时存储生成的代码和计数器

// 从产品数据中加载已有产品
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

// 从供应商数据中加载供应商
function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

// 生成采购报价单号（仅生成，不保存计数器）
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
    
    // 临时存储代码和计数器，不更新 localStorage
    tempGeneratedCode = { code: newCode, counter: counter };
    return newCode;
}

// 保存计数器到 localStorage（在保存时调用）
function savePurchasePriceCodeCounter(counter) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const purchasePriceRule = codeRules['purchasequote'] || { prefix: 'PP', digits: 4, suffix: '', counter: 0 };
    purchasePriceRule.counter = counter;
    codeRules['purchasequote'] = purchasePriceRule;
    localStorage.setItem('codeRules', JSON.stringify(codeRules));
}

// 计算总价（含税）
function calculateTotalPrice(newPurchasePrice, taxRate) {
    const price = parseFloat(newPurchasePrice) || 0;
    const tax = parseFloat(taxRate.replace('%', '')) / 100 || 0; // 处理百分比格式
    return (price * (1 + tax)).toFixed(2);
}

// 加载供应商下拉框（只显示代码）
function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">请选择供应商</option>';
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

// 设置默认日期为今天
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    quoteDateInput.value = today;
}

// 加载采购报价表明细数据
function loadPriceList() {
    const priceList = JSON.parse(localStorage.getItem('purchasePriceList') || '[]');
    const products = getProducts();
    tbody.innerHTML = '';

    if (isViewMode) {
        table.classList.add('view-mode');
        theadRow.innerHTML = `
            <th>产品代码</th>
            <th>产品名称</th>
            <th>产品采购价格</th>
            <th>新采购价格</th>
            <th>税率</th>
            <th>总价</th>
            <th>报价日期</th>
        `;
    } else {
        table.classList.remove('view-mode');
        theadRow.innerHTML = `
            <th>产品代码</th>
            <th>产品名称</th>
            <th>产品采购价格</th>
            <th>新采购价格</th>
            <th>税率</th>
            <th>总价</th>
            <th>报价日期</th>
            <th>操作</th>
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
                let taxRate = product ? product.taxRate || '0%' : '0%'; // 从产品数据中获取税率
                // 如果 taxRate 是小数，转换为百分比
                if (!taxRate.includes('%') && !isNaN(parseFloat(taxRate))) {
                    taxRate = `${(parseFloat(taxRate) * 100).toFixed(0)}%`;
                }
                const totalPrice = calculateTotalPrice(item.newPurchasePrice, taxRate);
                const row = document.createElement('tr');
                if (isEditMode) {
                    row.innerHTML = `
                        <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="输入产品代码"></td>
                        <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="输入产品名称"></td>
                        <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" placeholder="采购价格" step="0.01" readonly> <span>${currency}</span></td>
                        <td><input type="number" class="new-purchase-price" value="${item.newPurchasePrice || ''}" placeholder="新采购价格" step="0.01"> <span>${currency}</span></td>
                        <td><input type="text" class="tax-rate" value="${taxRate}" placeholder="税率" readonly></td>
                        <td><input type="text" class="total-price" value="${totalPrice}" placeholder="总价" readonly> <span>${currency}</span></td>
                        <td><input type="date" class="quote-date" value="${item.quoteDate || ''}" placeholder="报价日期"></td>
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
        tempGeneratedCode = null; // 重置临时代码
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

// 保存采购报价表明细数据到 purchasePrices
function savePriceListToPurchasePrices() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedSupplierCode = supplierCodeSelect.value;
    const quoteCode = quoteCodeInput.value.trim();
    const quoteDate = quoteDateInput.value.trim();
    const status = statusSelect.value;

    if (!quoteCode || !selectedSupplierCode || !quoteDate) {
        alert('请确保采购报价单号、供应商代码和日期填写完整！');
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
        alert('请确保所有产品信息填写完整！');
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
        // 如果使用了临时生成的代码，则保存计数器
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

    // 如果状态为“确认”，更新产品的新采购价格
    if (status === '确认') {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        priceListData.forEach(item => {
            const productIndex = products.findIndex(p => p.code === item.productCode);
            if (productIndex !== -1 && item.newPurchasePrice) {
                products[productIndex].purchasePrice = item.newPurchasePrice;
            }
        });
        localStorage.setItem('products', JSON.stringify(products));
    }

    window.dispatchEvent(new Event('storage'));
    tempGeneratedCode = null; // 保存后清空临时代码
    return true;
}

// 添加新行
addBtn.addEventListener('click', function() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="product-code" placeholder="输入产品代码"></td>
        <td><input type="text" class="product-name" placeholder="输入产品名称"></td>
        <td><input type="number" class="purchase-price" placeholder="采购价格" step="0.01" readonly> <span></span></td>
        <td><input type="number" class="new-purchase-price" placeholder="新采购价格" step="0.01"> <span></span></td>
        <td><input type="text" class="tax-rate" placeholder="税率" readonly></td>
        <td><input type="text" class="total-price" placeholder="总价" readonly> <span></span></td>
        <td><input type="date" class="quote-date" value="${quoteDateInput.value}" placeholder="报价日期"></td>
        <td>
            <span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span>
        </td>
    `;
    tbody.appendChild(row);
    bindInputEvents(row);
    bindIconEvents();
});

// 返回主页面
backBtn.addEventListener('click', function() {
    tempGeneratedCode = null; // 返回时清空临时代码
    window.location.href = 'purchaseprice.html';
    window.close();
});

// 保存所有数据并跳转回主页面
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

    // 保存成功后跳转到 purchaseprice.html
    if (savePriceListToPurchasePrices()) {
        window.location.href = 'purchaseprice.html';
    }
});

// 打印功能
printBtn.addEventListener('click', function() {
    window.print();
});

// 生成代码按钮事件
generateCodeBtn.addEventListener('click', function() {
    if (!isEditMode && !isViewMode) {
        const newCode = generatePurchasePriceCode();
        quoteCodeInput.value = newCode;
    }
});

// 绑定输入框事件（自动补全）
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
                        newPurchasePriceInput.placeholder = `新采购价格 (${product.currency || ''})`;
                        let taxRate = product.taxRate || '0%';
                        // 如果 taxRate 是小数，转换为百分比
                        if (!taxRate.includes('%') && !isNaN(parseFloat(taxRate))) {
                            taxRate = `${(parseFloat(taxRate) * 100).toFixed(0)}%`;
                        }
                        taxRateInput.value = taxRate; // 自动填充税率
                        const currency = product.currency || '';
                        purchasePriceInput.nextElementSibling.textContent = currency;
                        newPurchasePriceInput.nextElementSibling.textContent = currency;
                        totalPriceInput.nextElementSibling.textContent = currency;
                        totalPriceInput.value = calculateTotalPrice(newPurchasePriceInput.value || product.purchasePrice, taxRate); // 计算总价
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

    // 新采购价格变化时自动更新总价
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
    if (confirm(`确定删除产品：${productCode} 的采购报价明细吗？`)) {
        row.remove();
        savePriceListToPurchasePrices();
    }
};

// 联动供应商代码和名称
supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(s => s.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    loadPriceList();
});