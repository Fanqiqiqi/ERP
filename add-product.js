const productForm = document.getElementById('productForm');
const cancelBtn = document.getElementById('cancelBtn');
const currencyInput = document.getElementById('currency');
const currencyDropdown = document.getElementById('currencyDropdown');
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
let tempGeneratedCode = null;

// Cargar categorías de productos
function loadProductCategories() {
    const categories = JSON.parse(localStorage.getItem('pcategories') || '[]');
    const productCategorySelect = document.getElementById('productCategory');
    productCategorySelect.innerHTML = '<option value="">Selecciona categoría</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.code;
        option.textContent = category.name;
        productCategorySelect.appendChild(option);
    });
}

// Cargar marcas
function loadBrands() {
    const brands = JSON.parse(localStorage.getItem('brands') || '[]');
    const brandSelect = document.getElementById('brand');
    brandSelect.innerHTML = '<option value="">Selecciona marca</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.code;
        option.textContent = brand.name;
        brandSelect.appendChild(option);
    });
}

// Calcular precio total (con impuesto)
function calculateTotalPrice(price, taxRate) {
    const priceNum = parseFloat(price) || 0;
    const taxRateNum = parseFloat(taxRate) || 0;
    const totalPrice = priceNum * (1 + taxRateNum);
    return totalPrice.toFixed(2);
}

// Generar código de producto
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
    
    tempGeneratedCode = { code: newCode, counter: counter };
    return newCode;
}

// Guardar contador de código
function saveProductCodeCounter(counter) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const productRule = codeRules['product'] || { prefix: 'PROD', digits: 4, suffix: '', counter: 0 };
    productRule.counter = counter;
    codeRules['product'] = productRule;
    localStorage.setItem('codeRules', JSON.stringify(codeRules));
}

// Selección de moneda
currencyInput.addEventListener('click', function() {
    currencyDropdown.style.display = 
        currencyDropdown.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('.currency-option').forEach(option => {
    option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        const text = this.textContent;
        currencyInput.value = text;
        currencyInput.dataset.value = value;
        currencyDropdown.style.display = 'none';
    });
});

document.addEventListener('click', function(e) {
    if (!currencyInput.contains(e.target) && !currencyDropdown.contains(e.target)) {
        currencyDropdown.style.display = 'none';
    }
});

// Configurar formulario según modo
function setupFormBasedOnMode() {
    const viewProduct = JSON.parse(sessionStorage.getItem('viewProduct') || 'null');
    const editProduct = JSON.parse(sessionStorage.getItem('editProduct') || 'null');
    const pageTitle = document.querySelector('.page-title');
    const submitBtn = document.querySelector('.save-btn');
    const generateBtn = document.getElementById('generateCodeBtn');

    if (mode === 'view' && viewProduct) {
        pageTitle.textContent = 'Ver info producto';
        fillForm(viewProduct);
        disableFormInputs();
        submitBtn.style.display = 'none';
        cancelBtn.textContent = 'Volver';
        generateBtn.style.display = 'none';
    } else if (mode === 'edit' && editProduct) {
        pageTitle.textContent = 'Editar info producto';
        fillForm(editProduct);
        submitBtn.textContent = 'Guardar cambios';
        generateBtn.style.display = 'none';
    } else {
        pageTitle.textContent = 'Agregar producto nuevo';
        generateBtn.style.display = 'block';
        tempGeneratedCode = null;
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
    document.getElementById('brand').value = product.brand || '';
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
        'EUR': 'Euro (EUR)',
        'USD': 'Dólar (USD)',
        'JPY': 'Yen (JPY)',
        'CNY': 'Yuan (CNY)',
        'GBP': 'Libra (GBP)'
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
        brand: document.getElementById('brand').value,
        price: document.getElementById('purchasePrice').value.trim()
    };
}

// Evento botón generar código
document.getElementById('generateCodeBtn').addEventListener('click', function() {
    if (mode !== 'edit') {
        const newCode = generateProductCode();
        document.getElementById('productCode').value = newCode;
    }
});

// Enviar formulario
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
            alert('¡El código producto ya existe, usa uno único!');
            return;
        }
        
        const productData = getFormData();
        const photoFile = document.getElementById('productPhoto').files[0];

        const reader = new FileReader();
        reader.onload = function(event) {
            productData.photo = event.target.result || '';
            products.push(productData);
            if (tempGeneratedCode && tempGeneratedCode.code === productData.code) {
                saveProductCodeCounter(tempGeneratedCode.counter);
            }
            localStorage.setItem('products', JSON.stringify(products));
            tempGeneratedCode = null;
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
    tempGeneratedCode = null;
    window.location.href = 'product.html';
});

document.addEventListener('DOMContentLoaded', function() {
    loadProductCategories();
    loadBrands();
    setupFormBasedOnMode();
});

document.querySelector('.top-bar h1').addEventListener('click', function() {
    window.location.href = 'index.html';
});