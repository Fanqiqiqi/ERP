// index.js
// 初始化下拉菜单为隐藏状态
document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.style.display = 'none';
  });
  
  // 下拉菜单切换功能 - 绑定所有下拉菜单
  document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const dropdownMenu = this.nextElementSibling;
      const sidebar = document.querySelector('.sidebar');
      const isOpen = dropdownMenu.style.display === 'block';
  
      // 关闭所有其他下拉菜单
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.style.display = 'none';
        }
      });
  
      // 切换当前下拉菜单的显示状态
      dropdownMenu.style.display = isOpen ? 'none' : 'block';
  
      // 如果是展开状态，调整 sidebar 的滚动位置
      if (!isOpen) {
        // 计算 toggle 元素相对于 sidebar 的位置
        const togglePosition = toggle.getBoundingClientRect().top;
        const sidebarPosition = sidebar.getBoundingClientRect().top;
        const offset = togglePosition - sidebarPosition;
  
        // 将 sidebar 滚动到 toggle 的位置
        sidebar.scrollTo({
          top: offset,
          behavior: 'smooth' // 平滑滚动，可改为 'auto' 以立即滚动
        });
      }
    });
  });
  
  // 点击菜单项跳转或切换内容
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.classList.contains('dropdown-toggle')) return;
      e.preventDefault();
      const page = this.getAttribute('data-page');
      if (page) {
        window.location.href = page;
      } else {
        const section = this.textContent;
        const content = document.querySelector('.content');
        content.innerHTML = `
            <h2>${section}</h2>
            <p>这里是${section}的内容区域。</p>
          `;
      }
    });
  });
  
  // 点击顶部标题跳转到主页
  document.querySelector('.top-bar h1').addEventListener('click', function() {
    window.location.href = 'index.html';
  });

const productForm = document.getElementById('productForm');
const cancelBtn = document.getElementById('cancelBtn');
const currencyInput = document.getElementById('currency');
const currencyDropdown = document.getElementById('currencyDropdown');
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
let tempGeneratedCode = null; // 临时存储生成的代码和计数器

// 加载产品类别
function loadProductCategories() {
    const categories = JSON.parse(localStorage.getItem('pcategories') || '[]');
    const productCategorySelect = document.getElementById('productCategory');
    productCategorySelect.innerHTML = '<option value="">请选择类别</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.code;
        option.textContent = category.name;
        productCategorySelect.appendChild(option);
    });
}

// 计算总价（含税）
function calculateTotalPrice(price, taxRate) {
    const priceNum = parseFloat(price) || 0;
    const taxRateNum = parseFloat(taxRate) || 0;
    const totalPrice = priceNum * (1 + taxRateNum);
    return totalPrice.toFixed(2);
}

// 生成产品代码（仅生成，不保存计数器）
function generateProductCode() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const productRule = codeRules['product'] || { prefix: 'PROD', digits: 4, suffix: '', counter: 0 };
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const existingCodes = products.map(p => p.code);
    
    let counter = productRule.counter || 0;
    let newCode;
    do {
        counter++;
        const number = String(counter).padStart(productRule.digits, '0');
        newCode = `${productRule.prefix}${number}${productRule.suffix}`;
    } while (existingCodes.includes(newCode));
    
    // 临时存储代码和计数器，不更新 localStorage
    tempGeneratedCode = { code: newCode, counter: counter };
    return newCode;
}

// 保存计数器到 localStorage（在保存产品时调用）
function saveProductCodeCounter(counter) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const productRule = codeRules['product'] || { prefix: 'PROD', digits: 4, suffix: '', counter: 0 };
    productRule.counter = counter;
    codeRules['product'] = productRule;
    localStorage.setItem('codeRules', JSON.stringify(codeRules));
}

// 币种选择功能
currencyInput.addEventListener('click', function() {
    currencyDropdown.style.display = 
        currencyDropdown.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('.currency-option').forEach(option => {
    option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        const text = this.textContent;
        currencyInput.value = text;
        currencyInput.dataset.value = value; // 保存币种代码
        currencyDropdown.style.display = 'none';
    });
});

// 点击页面其他地方关闭币种下拉菜单
document.addEventListener('click', function(e) {
    if (!currencyInput.contains(e.target) && !currencyDropdown.contains(e.target)) {
        currencyDropdown.style.display = 'none';
    }
});

// 设置表单根据模式
function setupFormBasedOnMode() {
    const viewProduct = JSON.parse(sessionStorage.getItem('viewProduct') || 'null');
    const editProduct = JSON.parse(sessionStorage.getItem('editProduct') || 'null');
    const pageTitle = document.querySelector('.page-title');
    const submitBtn = document.querySelector('.save-btn');
    const generateBtn = document.getElementById('generateCodeBtn');

    if (mode === 'view' && viewProduct) {
        pageTitle.textContent = '查看产品信息';
        fillForm(viewProduct);
        disableFormInputs();
        submitBtn.style.display = 'none';
        cancelBtn.textContent = '返回';
        generateBtn.style.display = 'none';
    } else if (mode === 'edit' && editProduct) {
        pageTitle.textContent = '编辑产品信息';
        fillForm(editProduct);
        submitBtn.textContent = '保存修改';
        generateBtn.style.display = 'none';
    } else {
        pageTitle.textContent = '添加新产品';
        generateBtn.style.display = 'block';
        tempGeneratedCode = null; // 重置临时代码
    }
}

function fillForm(product) {
    const productCodeInput = document.getElementById('productCode');
    productCodeInput.value = product.code || '';
    if (mode === 'edit') {
        productCodeInput.setAttribute('readonly', 'readonly');
    }
    document.getElementById('supplierProductCode').value = product.supplierProductCode || '';
    document.getElementById('productName').value = product.name || '';
    document.getElementById('supplierProductName').value = product.supplierProductName || '';
    document.getElementById('unit').value = product.unit || '';
    document.getElementById('specification').value = product.specification || '';
    document.getElementById('purchasePrice').value = product.purchasePrice || '';
    document.getElementById('sellingPrice').value = product.sellingPrice || '';
    document.getElementById('retailPrice').value = product.retailPrice || '';
    document.getElementById('taxRate').value = product.taxRate || '';
    document.getElementById('currency').value = getCurrencyText(product.currency);
    document.getElementById('currency').dataset.value = product.currency || '';
    document.getElementById('safetyStock').value = product.safetyStock || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category || '';
}

function disableFormInputs() {
    const inputs = document.querySelectorAll('#productForm input, #productForm select, #productForm textarea');
    inputs.forEach(input => {
        input.disabled = true;
    });
    currencyInput.style.pointerEvents = 'none';
}

function getCurrencyText(currencyCode) {
    const currencyMap = {
        'EUR': '欧元 (EUR)',
        'USD': '美元 (USD)',
        'JPY': '日元 (JPY)',
        'CNY': '人民币 (CNY)',
        'GBP': '英镑 (GBP)'
    };
    return currencyMap[currencyCode] || '';
}

function getFormData() {
    return {
        code: document.getElementById('productCode').value.trim(),
        supplierProductCode: document.getElementById('supplierProductCode').value.trim(),
        name: document.getElementById('productName').value.trim(),
        supplierProductName: document.getElementById('supplierProductName').value.trim(),
        unit: document.getElementById('unit').value.trim(),
        specification: document.getElementById('specification').value.trim(),
        purchasePrice: document.getElementById('purchasePrice').value.trim(),
        sellingPrice: document.getElementById('sellingPrice').value.trim(),
        retailPrice: document.getElementById('retailPrice').value.trim(),
        taxRate: document.getElementById('taxRate').value,
        currency: document.getElementById('currency').dataset.value || '',
        safetyStock: document.getElementById('safetyStock').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        category: document.getElementById('productCategory').value,
        price: document.getElementById('purchasePrice').value.trim()
    };
}

// 生成代码按钮事件
document.getElementById('generateCodeBtn').addEventListener('click', function() {
    if (mode !== 'edit') { // 编辑模式下不允许修改产品代码
        const newCode = generateProductCode();
        document.getElementById('productCode').value = newCode;
    }
});

// 表单提交
productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    if (mode === 'edit') {
        const editProduct = JSON.parse(sessionStorage.getItem('editProduct') || 'null');
        if (!editProduct) return;

        const updatedProduct = getFormData();
        const index = products.findIndex(p => p.code === editProduct.code);
        if (index !== -1) {
            products[index] = updatedProduct;
            localStorage.setItem('products', JSON.stringify(products));
            sessionStorage.removeItem('editProduct');
            window.location.href = 'product.html';
        }
    } else {
        const code = document.getElementById('productCode').value.trim();
        const existingProduct = products.find(p => p.code === code);
        if (existingProduct) {
            alert('产品编码已存在，请使用唯一的编码！');
            return;
        }
        
        const productData = getFormData();
        const photoFile = document.getElementById('productPhoto').files[0];

        const reader = new FileReader();
        reader.onload = function(event) {
            productData.photo = event.target.result || '';
            products.push(productData);
            // 如果使用了临时生成的代码，则保存计数器
            if (tempGeneratedCode && tempGeneratedCode.code === productData.code) {
                saveProductCodeCounter(tempGeneratedCode.counter);
            }
            localStorage.setItem('products', JSON.stringify(products));
            tempGeneratedCode = null; // 保存后清空临时代码
            window.location.href = 'product.html';
        };

        if (photoFile) {
            reader.readAsDataURL(photoFile);
        } else {
            reader.onload({ target: { result: '' } });
        }
    }
});

cancelBtn.addEventListener('click', function() {
    sessionStorage.removeItem('viewProduct');
    sessionStorage.removeItem('editProduct');
    tempGeneratedCode = null; // 取消时清空临时代码
    window.location.href = 'product.html';
});

document.addEventListener('DOMContentLoaded', function() {
    loadProductCategories();
    setupFormBasedOnMode();
});

document.querySelector('.top-bar h1').addEventListener('click', function() {
    window.location.href = 'index.html';
});