const tbody = document.querySelector('.receivables-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const supplierCodeSelect = document.querySelector('#supplierCode');
const supplierNameInput = document.querySelector('#supplierName');
const payableNumberInput = document.querySelector('#payableNumber');
const invoiceDateInput = document.querySelector('#invoiceDate');
const dueDateInput = document.querySelector('#dueDate');
const tableContainer = document.querySelector('.table-container');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');
const generatePayableBtn = document.querySelector('#generatePayableBtn');

// 从供应商数据中加载供应商
function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

// 从发票数据中获取货币单位
function getInvoiceCurrency(invoiceNo) {
    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const invoice = invoiceData.find(inv => inv.invoiceNumber === invoiceNo);
    console.log('Invoice for', invoiceNo, ':', invoice);
    return invoice && invoice.currency ? invoice.currency : '€';
}

// 动态调整表格容器高度
function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const availableHeight = totalsSectionRect.top - tableContainerRect.top - 20;
    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = document.querySelector('.receivables-table').offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

// 加载供应商下拉框
function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">请选择供应商</option>';
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.code;
        option.textContent = supplier.code;
        supplierCodeSelect.appendChild(option);
    });
}

// 设置默认日期
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    invoiceDateInput.value = today;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    dueDateInput.value = dueDate.toISOString().split('T')[0];
}

// 更新总额显示
function updateTotals() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let grandTotal = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let currency = '€';

    if (rows.length > 0) {
        const firstInvoiceNo = rows[0].querySelector('.invoice-no').value.trim();
        currency = getInvoiceCurrency(firstInvoiceNo);
    }

    if (rows.length === 0) {
        document.querySelector('.grand-total').textContent = `0.00 ${currency}`;
        totalsContainer.innerHTML = '';
        adjustTableHeight();
        return;
    }

    rows.forEach(row => {
        const amount = parseFloat(row.querySelector('.amount').value) || 0;
        const paidAmount = parseFloat(row.querySelector('.paid-amount').value) || 0;
        const unpaidAmount = parseFloat(row.querySelector('.unpaid-amount').value) || 0;

        grandTotal += amount;
        totalPaid += paidAmount;
        totalUnpaid += unpaidAmount;
    });

    document.querySelector('.grand-total').textContent = `${grandTotal.toFixed(2)} ${currency}`;
    totalsContainer.innerHTML = `
        <div class="totals-row">
            <div><label>总金额:</label><span>${grandTotal.toFixed(2)} ${currency}</span></div>
            <div><label>已付金额:</label><span>${totalPaid.toFixed(2)} ${currency}</span></div>
            <div><label>未付金额:</label><span>${totalUnpaid.toFixed(2)} ${currency}</span></div>
        </div>
    `;
    adjustTableHeight();
}

// 生成临时应付账款编号
function generateTemporaryPayableNumber() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const payableRule = codeRules['payables'] || { prefix: 'PAY', digits: 4, suffix: '', counter: 0 };
    const payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');
    const existingNumbers = payablesData.map(r => r.payableNo);
    
    let counter = payableRule.counter || 0;
    let newNumber;
    do {
        counter++;
        const number = String(counter).padStart(payableRule.digits, '0');
        newNumber = `${payableRule.prefix}${number}${payableRule.suffix}`;
    } while (existingNumbers.includes(newNumber));
    return newNumber;
}

// 确认并占用编号
function confirmPayableNumber(payableNo) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const payableRule = codeRules['payables'] || { prefix: 'PAY', digits: 4, suffix: '', counter: 0 };
    const payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');
    const existingNumbers = payablesData.map(r => r.payableNo);
    
    if (!existingNumbers.includes(payableNo)) {
        const number = parseInt(payableNo.replace(payableRule.prefix, '').replace(payableRule.suffix, ''));
        payableRule.counter = Math.max(payableRule.counter || 0, number);
        codeRules['payables'] = payableRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

// 加载应付详情并添加新行（仅针对部分结账）
function loadPayableDetails(payableNo) {
    const payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');
    const payablesList = JSON.parse(localStorage.getItem('payablesList') || '[]');
    const payable = payablesData.find(r => r.payableNo === payableNo);
    const details = payablesList.filter(r => r.payableNo === payableNo);
    const today = new Date().toISOString().split('T')[0];

    if (payable) {
        payableNumberInput.value = payable.payableNo;
        supplierNameInput.value = payable.supplierName;
        invoiceDateInput.value = payable.invoiceDate;
        dueDateInput.value = payable.dueDate;

        const suppliers = getSuppliers();
        const supplier = suppliers.find(c => c.name === payable.supplierName);
        if (supplier) supplierCodeSelect.value = supplier.code;

        tbody.innerHTML = '';
        let totalPaidSoFar = 0;
        let lastUnpaidAmount = 0;

        // 根据状态决定是否只读
        const isEditable = payable.status === '未付款';

        // 加载已有记录
        details.forEach(item => {
            const currency = getInvoiceCurrency(item.invoiceNo);
            const paymentDate = item.paymentDate || today;
            const isFullyPaid = item.paidAmount >= item.amount;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="invoice-no" value="${item.invoiceNo}" ${isEditable ? '' : 'readonly'}></td>
                <td><input type="number" class="amount" value="${item.amount}" step="0.01" ${isEditable ? '' : 'readonly'}> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="paid-amount" value="${item.paidAmount}" step="0.01" ${isFullyPaid || !isEditable ? 'readonly' : ''}> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="unpaid-amount" value="${item.unpaidAmount}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="date" class="payment-date" value="${paymentDate}" ${isFullyPaid || !isEditable ? 'readonly' : ''}></td>
                <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
            `;
            tbody.appendChild(row);
            totalPaidSoFar += parseFloat(item.paidAmount) || 0;
            lastUnpaidAmount = parseFloat(item.unpaidAmount) || 0;
            if (isEditable || !isFullyPaid) bindInputEvents(row);
        });

        // 仅在部分结账状态下自动添加新行，新行金额基于最后一行的未付金额
        if (payable.status === '部分结账' && lastUnpaidAmount > 0) {
            const firstInvoiceNo = details[0]?.invoiceNo || '';
            const currency = payablesList[0]?.currency || getInvoiceCurrency(firstInvoiceNo) || '€';
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="invoice-no" value="${firstInvoiceNo}" readonly></td>
                <td><input type="number" class="amount" value="${lastUnpaidAmount.toFixed(2)}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="paid-amount" placeholder="输入已付金额" step="0.01"> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="unpaid-amount" value="${lastUnpaidAmount.toFixed(2)}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="date" class="payment-date" value="${today}"></td>
                <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
            `;
            tbody.appendChild(newRow);
            bindInputEvents(newRow);
        }

        bindIconEvents();
        updateTotals();
    }
}

// 添加新行
addBtn.addEventListener('click', function() {
    const today = new Date().toISOString().split('T')[0];
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="invoice-no" placeholder="输入发票号码"></td>
        <td><input type="number" class="amount" placeholder="输入金额" step="0.01"> <span class="currency-span">€</span></td>
        <td><input type="number" class="paid-amount" placeholder="输入已付金额" step="0.01"> <span class="currency-span">€</span></td>
        <td><input type="number" class="unpaid-amount" placeholder="输入未付金额" step="0.01" readonly> <span class="currency-span">€</span></td>
        <td><input type="date" class="payment-date" value="${today}"></td>
        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
    `;
    tbody.appendChild(row);
    bindInputEvents(row);
    bindIconEvents();
    adjustTableHeight();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// 返回应付管理页面
backBtn.addEventListener('click', function() {
    window.location.href = 'payables.html';
});

// 保存所有数据
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const payableNumber = payableNumberInput.value.trim();
    const supplierCode = supplierCodeSelect.value;
    const supplierName = supplierNameInput.value.trim();
    const invoiceDate = invoiceDateInput.value;
    const dueDate = dueDateInput.value;

    if (!payableNumber || !supplierCode || !invoiceDate || !dueDate) {
        alert('请确保应付编号、供应商代码、应付日期和到期日期填写完整！');
        return;
    }

    const payablesListData = rows.map(row => {
        const invoiceNo = row.querySelector('.invoice-no').value.trim();
        const amount = parseFloat(row.querySelector('.amount').value) || 0;
        const paidAmount = parseFloat(row.querySelector('.paid-amount').value) || 0;
        const unpaidAmount = parseFloat(row.querySelector('.unpaid-amount').value) || 0;
        const paymentDate = row.querySelector('.payment-date').value;
        const currency = getInvoiceCurrency(invoiceNo);

        if (!invoiceNo || amount <= 0) return null;

        return {
            invoiceNo,
            amount,
            paidAmount,
            unpaidAmount,
            paymentDate,
            payableNo: payableNumber,
            supplierCode,
            supplierName,
            invoiceDate,
            dueDate,
            status: unpaidAmount > 0 ? '未付款' : '已付款', // 单行状态
            currency
        };
    }).filter(item => item !== null);

    if (payablesListData.length === 0) {
        alert('请至少添加一条有效的应付账款明细！');
        return;
    }

    const payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');
    const existingPayable = payablesData.find(r => r.payableNo === payableNumber);
    const totalPaid = payablesListData.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalUnpaid = payablesListData.reduce((sum, item) => sum + item.unpaidAmount, 0);

    // 计算整体状态
    const roundedTotalUnpaid = Number(totalUnpaid.toFixed(2));
    const totalAmount = existingPayable ? existingPayable.amount : payablesListData.reduce((sum, item) => sum + item.amount, 0);

    let status;
    if (roundedTotalUnpaid === 0) {
        status = '已付款'; // 所有未付金额为0，状态为“已付款”
    } else if (totalPaid > 0 && roundedTotalUnpaid > 0) {
        // 检查是否为部分结账状态，且最后一行的未付金额是否为0
        const lastRowUnpaid = parseFloat(rows[rows.length - 1].querySelector('.unpaid-amount').value) || 0;
        status = lastRowUnpaid === 0 ? '已付款' : '部分结账';
    } else {
        status = '未付款';
    }

    const payable = {
        payableNo: payableNumber,
        invoiceDate,
        dueDate,
        supplierName,
        amount: totalAmount,
        status: status,
        currency: payablesListData[0].currency || '€'
    };

    console.log('Saving payable:', payable);

    const existingIndex = payablesData.findIndex(r => r.payableNo === payableNumber);
    if (existingIndex >= 0) {
        payablesData[existingIndex] = payable;
    } else {
        payablesData.push(payable);
        confirmPayableNumber(payableNumber);
    }

    localStorage.setItem('payablesData', JSON.stringify(payablesData));
    localStorage.setItem('payablesList', JSON.stringify(payablesListData));

    window.location.href = 'payables.html';
});

// 绑定输入框事件（动态更新未付金额）
function bindInputEvents(row) {
    const invoiceNoInput = row.querySelector('.invoice-no');
    const amountInput = row.querySelector('.amount');
    const paidAmountInput = row.querySelector('.paid-amount');
    const unpaidAmountInput = row.querySelector('.unpaid-amount');

    invoiceNoInput.addEventListener('input', function() {
        const currency = getInvoiceCurrency(this.value);
        const currencySpans = row.querySelectorAll('.currency-span');
        currencySpans.forEach(span => span.textContent = currency);
    });

    paidAmountInput.addEventListener('input', function() {
        const amount = parseFloat(amountInput.value) || 0;
        const paidAmount = parseFloat(this.value) || 0;
        unpaidAmountInput.value = (amount - paidAmount).toFixed(2);
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
    const invoiceNo = row.querySelector('.invoice-no').value;
    if (confirm(`确定删除发票号码：${invoiceNo} 的应付账款明细吗？`)) {
        row.remove();
        updateTotals();
    }
};

// 供应商代码和名称联动
supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(c => c.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

// 生成应付编号按钮事件
generatePayableBtn.addEventListener('click', function() {
    const newPayableNumber = generateTemporaryPayableNumber();
    payableNumberInput.value = newPayableNumber;
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    setDefaultDate();
    updateTotals();
    window.addEventListener('resize', adjustTableHeight);

    // 检查是否为编辑模式
    const urlParams = new URLSearchParams(window.location.search);
    const payableNo = urlParams.get('payableNo');
    const isEdit = urlParams.get('edit') === 'true';

    if (isEdit && payableNo) {
        loadPayableDetails(payableNo);
    }
});