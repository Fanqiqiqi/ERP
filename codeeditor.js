// codeeditor.js

const form = document.getElementById('codeForm');
const categorySelect = document.getElementById('category');
const prefixInput = document.getElementById('prefix');
const digitsInput = document.getElementById('digits');
const suffixInput = document.getElementById('suffix');
const title = document.getElementById('title');
const cancelBtn = document.querySelector('.cancel-btn');

// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const item = urlParams.get('item');
const isEditMode = urlParams.get('edit') === 'true';

// 初始化表单
function initForm() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const categories = {
        'customer': '客户',
        'supplier': '供应商',
        'product': '产品',
        'price': '价格表',
        'purchasequote': '采购报价单',
        'purchaseorder': '采购订单',
        'instock': '入库单',
        'salesquote': '销售报价单',
        'salesorder': '销售订单',
        'salesdespatch': '销售出货单',
        'salesinvoice': '销售发票'
    };

    if (item) {
        const categoryKey = Object.keys(categories).find(key => categories[key] === item);
        if (categoryKey) {
            categorySelect.value = categoryKey;
            const rule = codeRules[categoryKey] || {};
            prefixInput.value = rule.prefix || '';
            digitsInput.value = rule.digits || '';
            suffixInput.value = rule.suffix || '';
            categorySelect.disabled = true; // 编辑或查看时禁用类别选择
            title.textContent = isEditMode ? '编辑代码规则' : '查看代码规则';
            if (!isEditMode) {
                prefixInput.readOnly = true;
                digitsInput.readOnly = true;
                suffixInput.readOnly = true;
                form.querySelector('.save-btn').style.display = 'none';
            }
        }
    }
}

// 保存规则
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const category = categorySelect.value;
    const prefix = prefixInput.value.trim();
    const digits = parseInt(digitsInput.value);
    const suffix = suffixInput.value.trim();

    if (!category || !prefix || !digits) {
        alert('请填写所有必填字段！');
        return;
    }

    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    codeRules[category] = {
        prefix: prefix,
        digits: digits,
        suffix: suffix,
        counter: codeRules[category]?.counter || 0 // 保留现有计数器
    };
    localStorage.setItem('codeRules', JSON.stringify(codeRules));

    window.opener.postMessage('update', '*');
    window.close();
});

// 取消按钮
cancelBtn.addEventListener('click', function() {
    window.close();
});

document.addEventListener('DOMContentLoaded', initForm);