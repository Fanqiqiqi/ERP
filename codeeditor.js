// codeeditor.js

const form = document.getElementById('codeForm');
const categorySelect = document.getElementById('category');
const prefixInput = document.getElementById('prefix');
const digitsInput = document.getElementById('digits');
const suffixInput = document.getElementById('suffix');
const title = document.getElementById('title');
const cancelBtn = document.querySelector('.cancel-btn');

// Obtener parámetros URL
const urlParams = new URLSearchParams(window.location.search);
const item = urlParams.get('item');
const isEditMode = urlParams.get('edit') === 'true';

// Inicializar formulario
function initForm() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const categories = {
        'customer': 'Cliente',
        'supplier': 'Proveedor',
        'product': 'Producto',
        'price': 'Precios',
        'purchasequote': 'Cotiz. Compra',
        'purchaseorder': 'Pedido de Compra',
        'instock': 'Albarán de compra',
        'salesquote': 'Cotiz. Venta',
        'salesorder': 'Pedido de Venta',
        'salesdespatch': 'Albarán de Venta',
        'salesinvoice': 'Factura Venta',
        'invoiceseries': 'Serie de Factura' // 新增 Serie de Factura
    };

    // 动态填充 categorySelect 下拉菜单
    Object.entries(categories).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        categorySelect.appendChild(option);
    });

    if (item) {
        const categoryKey = Object.keys(categories).find(key => categories[key] === item);
        if (categoryKey) {
            categorySelect.value = categoryKey;
            const rule = codeRules[categoryKey] || {};
            prefixInput.value = rule.prefix || '';
            digitsInput.value = rule.digits || '';
            suffixInput.value = rule.suffix || '';
            categorySelect.disabled = true; // Deshabilitar selección en edición o vista
            title.textContent = isEditMode ? 'Editar Regla Código' : 'Ver Regla Código';
            if (!isEditMode) {
                prefixInput.readOnly = true;
                digitsInput.readOnly = true;
                suffixInput.readOnly = true;
                form.querySelector('.save-btn').style.display = 'none';
            }
        }
    }
}

// Guardar regla
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const category = categorySelect.value;
    const prefix = prefixInput.value.trim();
    const digits = parseInt(digitsInput.value);
    const suffix = suffixInput.value.trim();

    if (!category || !prefix || !digits) {
        alert('¡Llena todos los campos requeridos!');
        return;
    }

    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    codeRules[category] = {
        prefix: prefix,
        digits: digits,
        suffix: suffix,
        counter: codeRules[category]?.counter || 0 // Mantener contador existente
    };
    localStorage.setItem('codeRules', JSON.stringify(codeRules));

    window.opener.postMessage('update', '*');
    window.close();
});

// Botón cancelar
cancelBtn.addEventListener('click', function() {
    window.close();
});

document.addEventListener('DOMContentLoaded', initForm);