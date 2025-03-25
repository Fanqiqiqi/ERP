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

// Cargar clientes
function getCustomers() {
    return JSON.parse(localStorage.getItem('customers') || '[]');
}

// Obtener moneda de factura
function getInvoiceCurrency(invoiceNo) {
    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const invoice = invoiceData.find(inv => inv.invoiceNumber === invoiceNo);
    console.log('Factura para', invoiceNo, ':', invoice);
    return invoice && invoice.currency ? invoice.currency : '€';
}

// Ajustar altura tabla
function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const availableHeight = totalsSectionRect.top - tableContainerRect.top - 20;
    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = document.querySelector('.receivables-table').offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

// Cargar clientes en select
function loadCustomers() {
    const customers = getCustomers();
    customerCodeSelect.innerHTML = '<option value="">Elige cliente</option>';
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.code;
        option.textContent = customer.code;
        customerCodeSelect.appendChild(option);
    });
}

// Fecha por defecto
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    invoiceDateInput.value = today;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    dueDateInput.value = dueDate.toISOString().split('T')[0];
}

// Actualizar totales
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
            <div><label>Total:</label><span>${grandTotal.toFixed(2)} ${currency}</span></div>
            <div><label>Pagado:</label><span>${totalPaid.toFixed(2)} ${currency}</span></div>
            <div><label>Pendiente:</label><span>${totalUnpaid.toFixed(2)} ${currency}</span></div>
        </div>
    `;
    adjustTableHeight();
}

// Generar número temporal
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

// Confirmar número
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

// Cargar detalles
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

        details.forEach(item => {
            const currency = getInvoiceCurrency(item.invoiceNo);
            const paymentDate = item.paymentDate || today;
            const isFullyPaid = item.paidAmount >= item.amount;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="invoice-no" value="${item.invoiceNo}" readonly></td>
                <td><input type="number" class="amount" value="${item.amount}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="paid-amount" value="${item.paidAmount}" step="0.01"> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="unpaid-amount" value="${item.unpaidAmount}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="date" class="payment-date" value="${paymentDate}"></td>
                <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
            `;
            tbody.appendChild(row);
            totalPaidSoFar += parseFloat(item.paidAmount) || 0;
            lastUnpaidAmount = parseFloat(item.unpaidAmount) || 0;
            bindInputEvents(row);
        });

        if (receivable.status === 'Parcial' && lastUnpaidAmount > 0) {
            const firstInvoiceNo = details[0]?.invoiceNo || '';
            const currency = receivablesList[0]?.currency || getInvoiceCurrency(firstInvoiceNo) || '€';
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="invoice-no" value="${firstInvoiceNo}" readonly></td>
                <td><input type="number" class="amount" value="${lastUnpaidAmount.toFixed(2)}" step="0.01" readonly> <span class="currency-span">${currency}</span></td>
                <td><input type="number" class="paid-amount" placeholder="Ingresa monto pagado" step="0.01"> <span class="currency-span">${currency}</span></td>
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

// Añadir fila
addBtn.addEventListener('click', function() {
    const today = new Date().toISOString().split('T')[0];
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="invoice-no" placeholder="Ingresa nº factura"></td>
        <td><input type="number" class="amount" placeholder="Ingresa monto" step="0.01"> <span class="currency-span">€</span></td>
        <td><input type="number" class="paid-amount" placeholder="Ingresa monto pagado" step="0.01"> <span class="currency-span">€</span></td>
        <td><input type="number" class="unpaid-amount" placeholder="Ingresa monto pendiente" step="0.01" readonly> <span class="currency-span">€</span></td>
        <td><input type="date" class="payment-date" value="${today}"></td>
        <td><span class="action-icon delete-icon"><i class="fas fa-trash-alt"></i></span></td>
    `;
    tbody.appendChild(row);
    bindInputEvents(row);
    bindIconEvents();
    adjustTableHeight();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Volver
backBtn.addEventListener('click', function() {
    window.location.href = 'receivables.html';
});

// Guardar todo
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const receivableNumber = receivableNumberInput.value.trim();
    const customerCode = customerCodeSelect.value;
    const customerName = customerNameInput.value.trim();
    const invoiceDate = invoiceDateInput.value;
    const dueDate = dueDateInput.value;

    if (!receivableNumber || !customerCode || !invoiceDate || !dueDate) {
        alert('¡Asegúrate de completar nº cuenta, cód. cliente, fecha cuenta y fecha venc.!');
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
            status: unpaidAmount > 0 ? 'No Pagado' : 'Pagado',
            currency
        };
    }).filter(item => item !== null);

    if (receivablesListData.length === 0) {
        alert('¡Añade al menos un detalle válido de cuenta por cobrar!');
        return;
    }

    const receivablesData = JSON.parse(localStorage.getItem('receivablesData') || '[]');
    const existingReceivable = receivablesData.find(r => r.receivableNo === receivableNumber);
    const totalPaid = receivablesListData.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalUnpaid = receivablesListData.reduce((sum, item) => sum + item.unpaidAmount, 0);

    const roundedTotalUnpaid = Number(totalUnpaid.toFixed(2));
    const totalAmount = existingReceivable ? existingReceivable.amount : receivablesListData.reduce((sum, item) => sum + item.amount, 0);

    let status;
    if (roundedTotalUnpaid === 0) {
        status = 'Pagado';
    } else if (totalPaid > 0 && roundedTotalUnpaid > 0) {
        const lastRowUnpaid = parseFloat(rows[rows.length - 1].querySelector('.unpaid-amount').value) || 0;
        status = lastRowUnpaid === 0 ? 'Pagado' : 'Parcial';
    } else {
        status = 'No Pagado';
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

    console.log('Guardando cuenta:', receivable);

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

// Vincular eventos inputs
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

// Vincular eventos iconos
function bindIconEvents() {
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

const deleteHandler = function() {
    const row = this.closest('tr');
    const invoiceNo = row.querySelector('.invoice-no').value;
    if (confirm(`¿Seguro de eliminar detalle de factura nº: ${invoiceNo}?`)) {
        row.remove();
        updateTotals();
    }
};

// Vincular código y nombre cliente
customerCodeSelect.addEventListener('change', function() {
    const customers = getCustomers();
    const selectedCustomer = customers.find(c => c.code === this.value);
    customerNameInput.value = selectedCustomer ? selectedCustomer.name : '';
});

// Botón generar número
generateReceivableBtn.addEventListener('click', function() {
    const newReceivableNumber = generateTemporaryReceivableNumber();
    receivableNumberInput.value = newReceivableNumber;
});

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    setDefaultDate();
    updateTotals();
    window.addEventListener('resize', adjustTableHeight);

    const urlParams = new URLSearchParams(window.location.search);
    const receivableNo = urlParams.get('receivableNo');
    const isEdit = urlParams.get('edit') === 'true';

    if (isEdit && receivableNo) {
        loadReceivableDetails(receivableNo);
    }
});