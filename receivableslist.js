const tbody = document.querySelector('.receivables-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const customerCodeSelect = document.querySelector('#customerCode');
const customerNameInput = document.querySelector('#customerName');
const receivableNumberInput = document.querySelector('#receivableNumber');
const invoiceDateInput = document.querySelector('#invoiceDate');
const dueDateInput = document.querySelector('#dueDate');
const tableContainer = document.querySelector('.table-container');
const totalsContainer = document.querySelector('#totals-container');
const totalsSection = document.querySelector('.totals-section');
const generateReceivableBtn = document.querySelector('#generateReceivableBtn');

// 从客户数据中加载客户
function getCustomers() {
    return JSON.parse(localStorage.getItem('customers') || '[]');
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

// 生成临时应收账款编号
function generateTemporaryReceivableNumber() {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const receivableRule = codeRules['receivables'] || { prefix: 'REC', digits: 4, suffix: '', counter: 0 };
    const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
    const existingNumbers = receivablesData.map(r => r.receivableNo);
    
    let counter = receivableRule.counter || 0;
    let newNumber;
    do {
        counter++;
        const number = String(counter).padStart(receivableRule.digits, '0');
        newNumber = `${receivableRule.prefix}${number}${receivableRule.suffix}`;
    } while (existingNumbers.includes(newNumber));
    return newNumber;
}

// 确认并占用编号
function confirmReceivableNumber(receivableNo) {
    const codeRules = JSON.parse(localStorage.getItem('codeRules') || '{}');
    const receivableRule = codeRules['receivables'] || { prefix: 'REC', digits: 4, suffix: '', counter: 0 };
    const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
    const existingNumbers = receivablesData.map(r => r.receivableNo);
    
    if (!existingNumbers.includes(receivableNo)) {
        const number = parseInt(receivableNo.replace(receivableRule.prefix, '').replace(receivableRule.suffix, ''));
        receivableRule.counter = Math.max(receivableRule.counter || 0, number);
        codeRules['receivables'] = receivableRule;
        localStorage.setItem('codeRules', JSON.stringify(codeRules));
    }
}

// 加载应收详情并添加新行（仅针对部分结账）
function loadReceivableDetails(receivableNo) {
    const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
    const receivablesList = JSON.parse(localStorage.getItem('receivablesList') || '[]');
    const receivable = receivablesData.find(r => r.receivableNo === receivableNo);
    const details = receivablesList.filter(r => r.receivableNo === receivableNo);
    const today = new Date().toISOString().split('T')[0];

    if (receivable) {
        receivableNumberInput.value = receivable.receivableNo;
        customerNameInput.value = receivable.customerName;
        invoiceDateInput.value = receivable.invoiceDate;
        dueDateInput.value = receivable.dueDate;

        const customers = getCustomers();
        const customer = customers.find(c => c.name === receivable.customerName);
        if (customer) customerCodeSelect.value = customer.code;

        tbody.innerHTML = '';
        let totalPaidSoFar = 0;
        let lastUnpaidAmount = 0;

        // 根据状态决定是否只读
        const isEditable = receivable.status === '未付款';

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
        if (receivable.status === '部分结账' && lastUnpaidAmount > 0) {
            const firstInvoiceNo = details[0]?.invoiceNo || '';
            const currency = receivablesList[0]?.currency || getInvoiceCurrency(firstInvoiceNo) || '€';
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

// 返回应收管理页面
backBtn.addEventListener('click', function() {
    window.location.href = 'receivables.html';
});

// 保存所有数据
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const receivableNumber = receivableNumberInput.value.trim();
    const customerCode = customerCodeSelect.value;
    const customerName = customerNameInput.value.trim();
    const invoiceDate = invoiceDateInput.value;
    const dueDate = dueDateInput.value;

    if (!receivableNumber || !customerCode || !invoiceDate || !dueDate) {
        alert('请确保应收编号、客户代码、应收日期和到期日期填写完整！');
        return;
    }

    const receivablesListData = rows.map(row => {
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
            receivableNo: receivableNumber,
            customerCode,
            customerName,
            invoiceDate,
            dueDate,
            status: unpaidAmount > 0 ? '未付款' : '已付款', // 单行状态
            currency
        };
    }).filter(item => item !== null);

    if (receivablesListData.length === 0) {
        alert('请至少添加一条有效的应收账款明细！');
        return;
    }

    const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
    const existingReceivable = receivablesData.find(r => r.receivableNo === receivableNumber);
    const totalPaid = receivablesListData.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalUnpaid = receivablesListData.reduce((sum, item) => sum + item.unpaidAmount, 0);

    // 计算整体状态
    const roundedTotalUnpaid = Number(totalUnpaid.toFixed(2));
    const totalAmount = existingReceivable ? existingReceivable.amount : receivablesListData.reduce((sum, item) => sum + item.amount, 0);

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

    const receivable = {
        receivableNo: receivableNumber,
        invoiceDate,
        dueDate,
        customerName,
        amount: totalAmount,
        status: status,
        currency: receivablesListData[0].currency || '€'
    };

    console.log('Saving receivable:', receivable);

    const existingIndex = receivablesData.findIndex(r => r.receivableNo === receivableNumber);
    if (existingIndex >= 0) {
        receivablesData[existingIndex] = receivable;
    } else {
        receivablesData.push(receivable);
        confirmReceivableNumber(receivableNumber);
    }

    localStorage.setItem('receivablesData', JSON.stringify(receivablesData));
    localStorage.setItem('receivablesList', JSON.stringify(receivablesListData));

    window.location.href = 'receivables.html';
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
    if (confirm(`确定删除发票号码：${invoiceNo} 的应收账款明细吗？`)) {
        row.remove();
        updateTotals();
    }
};

// 客户代码和名称联动
customerCodeSelect.addEventListener('change', function() {
    const customers = getCustomers();
    const selectedCustomer = customers.find(c => c.code === this.value);
    customerNameInput.value = selectedCustomer ? selectedCustomer.name : '';
});

// 生成应收编号按钮事件
generateReceivableBtn.addEventListener('click', function() {
    const newReceivableNumber = generateTemporaryReceivableNumber();
    receivableNumberInput.value = newReceivableNumber;
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    setDefaultDate();
    updateTotals();
    window.addEventListener('resize', adjustTableHeight);

    // 检查是否为编辑模式
    const urlParams = new URLSearchParams(window.location.search);
    const receivableNo = urlParams.get('receivableNo');
    const isEdit = urlParams.get('edit') === 'true';

    if (isEdit && receivableNo) {
        loadReceivableDetails(receivableNo);
    }
});