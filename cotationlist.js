// cotationlist.js

// 菜单交互逻辑
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
  
  // 从产品数据中加载货币单位
  function getProductCurrency(productCode) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.code === productCode);
    return product ? product.currency || '' : '';
  }
  
  // 加载报价数据（仅用于查看/编辑模式）
  function loadCotations() {
    const tbody = document.querySelector('.cotationlist-table tbody');
    if (!tbody) {
        console.error('tbody element not found');
        return;
    }
    const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
    tbody.innerHTML = '';
  
    const sortedCotations = [...cotations].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // 降序排列
    });
  
    sortedCotations.forEach(cotation => {
        const totalAmount = cotation.totalAmount || '0.00';
        const currency = cotation.products && cotation.products.length > 0 ? getProductCurrency(cotation.products[0].productCode) : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cotation.code}</td>
            <td>${cotation.customerName}</td>
            <td>${cotation.priceCategory || '无'}</td>
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
  
  // 操作图标事件绑定
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
  
  // 查看事件
  const viewHandler = function() {
    const row = this.closest('tr');
    const code = row.cells[0].textContent;
    window.location.href = `cotationlist.html?cotationCode=${code}&view=true`;
  };
  
  // 编辑事件
  const editHandler = function() {
    const row = this.closest('tr');
    const code = row.cells[0].textContent;
    window.location.href = `cotationlist.html?cotationCode=${code}&edit=true`;
  };
  
  // 删除事件
  const deleteHandler = function() {
    const row = this.closest('tr');
    const code = row.cells[0].textContent;
    if (confirm(`确定删除报价：${code} 吗？`)) {
        row.remove();
        const cotations = JSON.parse(localStorage.getItem('cotations') || '[]');
        const updatedCotations = cotations.filter(c => c.code !== code);
        localStorage.setItem('cotations', JSON.stringify(updatedCotations));
    }
  };
  
  // 生成销售报价单代码（临时生成，不占用计数器）
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
  
  // 格式化税率为百分比字符串
  function formatTaxRate(taxRate) {
    if (!taxRate) return '0%';
    if (typeof taxRate === 'string' && taxRate.endsWith('%')) return taxRate;
    const rate = parseFloat(taxRate);
    return isNaN(rate) ? '0%' : `${(rate * 100).toFixed(0)}%`;
  }
  
  // 计算总价（税前价格 * (1 + 税率)）
  function calculateTotalPrice(priceInput, taxRateInput, totalPriceInput) {
    const price = parseFloat(priceInput.value) || 0;
    const taxRateStr = taxRateInput.value || '0%';
    const taxRate = parseFloat(taxRateStr.replace('%', '')) / 100 || 0;
    const totalPrice = price * (1 + taxRate);
    totalPriceInput.value = totalPrice.toFixed(2);
  }
  
  // 产品自动补全功能（根据价格表类别填充价格和税率，并计算总价）
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
  
                // 根据价格表类别获取价格
                const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
                const priceItem = priceList.find(item => 
                    item.category === priceCategory && item.productCode === product.code
                );
                priceInput.value = priceItem ? 
                    (priceItem.newSellingPrice || priceItem.sellingPrice || '') : 
                    (product.price || '');
  
                // 自动填充税率（格式化为百分比）
                taxRateInput.value = formatTaxRate(product.taxRate);
  
                // 计算总价
                calculateTotalPrice(priceInput, taxRateInput, totalPriceInput);
  
                // 添加价格和税率变化时的监听器
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
  
  // 监听 storage 事件以更新报价列表
  window.addEventListener('storage', function() {
    loadCotations();
  });
  
  // 页面加载时初始化
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded triggered');
  
    // 获取页面元素
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
  
    // 检查 URL 参数以确定模式
    const urlParams = new URLSearchParams(window.location.search);
    const isViewMode = urlParams.get('view') === 'true';
    const isEditMode = urlParams.get('edit') === 'true';
    const cotationCode = urlParams.get('cotationCode');
  
    if (isViewMode || isEditMode) {
        cotationCodeInput.value = cotationCode || '';
        cotationCodeInput.setAttribute('readonly', 'true');
        if (generateCodeBtn) generateCodeBtn.style.display = 'none';
  
        // 加载已有报价数据
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
        // 对于新报价，不加载任何数据，保持表格为空
    }
  
    // 设置默认日期为今天
    if (cotationDateInput && !cotationDateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        cotationDateInput.value = today;
    } else if (!cotationDateInput) {
        console.error('Cotation date input not found');
    }
  
    // 加载价格表类别（从 prices 中获取）
    function loadPriceCategories() {
        const prices = JSON.parse(localStorage.getItem('prices') || '[]');
        priceCategorySelect.innerHTML = '<option value="">请选择价格表类别</option>';
        prices.forEach(price => {
            const option = document.createElement('option');
            option.value = price.category;
            option.textContent = price.category;
            priceCategorySelect.appendChild(option);
        });
    }
  
    if (priceCategorySelect) {
        loadPriceCategories();
    } else {
        console.error('Price category select not found');
    }
  
    // 生成按钮事件
    if (generateCodeBtn) {
        generateCodeBtn.addEventListener('click', function() {
            const newCode = generateCotationCode();
            cotationCodeInput.value = newCode;
            console.log('Generated code (not yet saved):', newCode);
        });
    } else {
        console.error('Generate button not found');
    }
  
    // 返回按钮事件
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            console.log('Back button clicked');
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    } else {
        console.error('Back button not found');
    }
  
    // 加号按钮事件 - 添加新产品行
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            console.log('Add button clicked');
            const tbody = document.querySelector('.cotationlist-table tbody');
            if (!tbody) {
                console.error('Table body not found');
                return;
            }
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input class="product-code" type="text" placeholder="产品代码"></td>
                <td><input class="product-name" type="text" placeholder="产品名称"></td>
                <td><input type="text" placeholder="规格"></td>
                <td><input type="text" placeholder="单位"></td>
                <td><input type="text" placeholder="价格"></td>
                <td><input type="text" placeholder="税率"></td>
                <td><input type="text" placeholder="总价" readonly></td>
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
        console.error('Add button not found');
    }
  
    // 保存按钮事件 - 保存报价数据并占用代码，然后跳转并清空（移除提示）
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            console.log('Save button clicked');
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
            // 移除 alert('报价已保存'); 直接跳转
  
            // 清空表单
            cotationCodeInput.value = '';
            customerCodeSelect.value = '';
            customerNameInput.value = '';
            cotationDateInput.value = '';
            priceCategorySelect.value = '';
            const tbody = document.querySelector('.cotationlist-table tbody');
            if (tbody) tbody.innerHTML = '';
            generateCodeBtn.style.display = 'block'; // 恢复生成按钮可见性
  
            // 跳转到 cotation.html
            window.location.href = 'cotation.html';
        });
    } else {
        console.error('Save button not found');
    }
  
    // 打印按钮事件
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            console.log('Print button clicked');
            window.print();
        });
    } else {
        console.error('Print button not found');
    }
  
    // 加载客户代码选项并自动填充价格表类别
    function loadCustomers() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        customerCodeSelect.innerHTML = '<option value="">请选择客户代码</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.code;
            option.textContent = customer.code;
            customerCodeSelect.appendChild(option);
        });
    }
  
    if (customerCodeSelect && customerNameInput && priceCategorySelect) {
        loadCustomers();
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
        console.error('Customer code, name, or price category elements not found');
    }
  });
  
  // 顶部标题点击事件
  document.querySelector('.top-bar h1').addEventListener('click', function() {
    console.log('Top bar title clicked');
    window.location.href = 'index.html';
  });