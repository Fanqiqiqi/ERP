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

// Cargar proveedores desde datos
function getSuppliers() {
    return JSON.parse(localStorage.getItem('suppliers') || '[]');
}

// Obtener moneda de la factura
function getInvoiceCurrency(invoiceNo) {
    const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
    const invoice = invoiceData.find(inv => inv.invoiceNumber === invoiceNo);
    console.log('Factura para', invoiceNo, ':', invoice);
    return invoice && invoice.currency ? invoice.currency : '€';
}

// Ajustar altura del contenedor de la tabla
function adjustTableHeight() {
    const totalsSectionRect = totalsSection.getBoundingClientRect();
    const tableContainerRect = tableContainer.getBoundingClientRect();
    const availableHeight = totalsSectionRect.top - tableContainerRect.top - 20;
    tableContainer.style.maxHeight = `${availableHeight}px`;
    const tableHeight = document.querySelector('.receivables-table').offsetHeight;
    tableContainer.style.overflowY = tableHeight > availableHeight ? 'auto' : 'hidden';
}

// Cargar lista desplegable de proveedores
function loadSuppliers() {
    const suppliers = getSuppliers();
    supplierCodeSelect.innerHTML = '<option value="">Selecciona proveedor</option>';
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.code;
        option.textContent = supplier.code;
        supplierCodeSelect.appendChild(option);
    });
}

// Establecer fechas por defecto
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
            <div><label>Monto Total:</label><span>${grandTotal.toFixed(2)} ${currency}</span></div>
            <div><label>Monto Pagado:</label><span>${totalPaid.toFixed(2)} ${currency}</span></div>
            <div><label>Monto Pendiente:</label><span>${totalUnpaid.toFixed(2)} ${currency}</span></div>
        </div>
    `;
    adjustTableHeight();
}

// Generar número temporal de cuenta por pagar
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

// Confirmar y ocupar número
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

// Cargar detalles de cuenta por pagar (para pago parcial)
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

        const isEditable = payable.status === 'No Pagado';

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

        if (payable.status === 'Parcialmente Pagado' && lastUnpaidAmount > 0) {
            const firstInvoiceNo = details[0]?.invoiceNo || '';
            const currency = payablesList[0]?.currency || getInvoiceCurrency(firstInvoiceNo) || '€';
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

// Agregar nueva fila
addBtn.addEventListener('click', function() {
    const today = new Date().toISOString().split('T')[0];
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="invoice-no" placeholder="Ingresa Nº factura"></td>
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

// Volver a la página de gestión de cuentas por pagar
backBtn.addEventListener('click', function() {
    window.location.href = 'payables_es.html';
});

// Guardar todos los datos
saveAllBtn.addEventListener('click', function() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const payableNumber = payableNumberInput.value.trim();
    const supplierCode = supplierCodeSelect.value;
    const supplierName = supplierNameInput.value.trim();
    const invoiceDate = invoiceDateInput.value;
    const dueDate = dueDateInput.value;

    if (!payableNumber || !supplierCode || !invoiceDate || !dueDate) {
        alert('¡Asegúrate de completar Nº cuenta, código proveedor, fecha cuenta y fecha vencimiento!');
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
            status: unpaidAmount > 0 ? 'No Pagado' : 'Pagado',
            currency
        };
    }).filter(item => item !== null);

    if (payablesListData.length === 0) {
        alert('¡Agrega al menos un detalle válido de cuenta por pagar!');
        return;
    }

    const payablesData = JSON.parse(localStorage.getItem('payablesData') || '[]');
    const existingPayable = payablesData.find(r => r.payableNo === payableNumber);
    const totalPaid = payablesListData.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalUnpaid = payablesListData.reduce((sum, item) => sum + item.unpaidAmount, 0);

    const roundedTotalUnpaid = Number(totalUnpaid.toFixed(2));
    const totalAmount = existingPayable ? existingPayable.amount : payablesListData.reduce((sum, item) => sum + item.amount, 0);

    let status;
    if (roundedTotalUnpaid === 0) {
        status = 'Pagado';
    } else if (totalPaid > 0 && roundedTotalUnpaid > 0) {
        const lastRowUnpaid = parseFloat(rows[rows.length - 1].querySelector('.unpaid-amount').value) || 0;
        status = lastRowUnpaid === 0 ? 'Pagado' : 'Parcialmente Pagado';
    } else {
        status = 'No Pagado';
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

    console.log('Guardando cuenta por pagar:', payable);

    const existingIndex = payablesData.findIndex(r => r.payableNo === payableNumber);
    if (existingIndex >= 0) {
        payablesData[existingIndex] = payable;
    } else {
        payablesData.push(payable);
        confirmPayableNumber(payableNumber);
    }

    localStorage.setItem('payablesData', JSON.stringify(payablesData));
    localStorage.setItem('payablesList', JSON.stringify(payablesListData));

    window.location.href = 'payables_es.html';
});

// Vincular eventos de entrada (actualizar monto pendiente)
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

// Vincular eventos de iconos
function bindIconEvents() {
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.removeEventListener('click', deleteHandler);
        icon.addEventListener('click', deleteHandler);
    });
}

const deleteHandler = function() {
    const row = this.closest('tr');
    const invoiceNo = row.querySelector('.invoice-no').value;
    if (confirm(`¿Seguro de eliminar el detalle de factura Nº ${invoiceNo}?`)) {
        row.remove();
        updateTotals();
    }
};

// Vincular código y nombre de proveedor
supplierCodeSelect.addEventListener('change', function() {
    const suppliers = getSuppliers();
    const selectedSupplier = suppliers.find(c => c.code === this.value);
    supplierNameInput.value = selectedSupplier ? selectedSupplier.name : '';
});

// Evento botón generar número
generatePayableBtn.addEventListener('click', function() {
    const newPayableNumber = generateTemporaryPayableNumber();
    payableNumberInput.value = newPayableNumber;
});

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadSuppliers();
    setDefaultDate();
    updateTotals();
    window.addEventListener('resize', adjustTableHeight);

    const urlParams = new URLSearchParams(window.location.search);
    const payableNo = urlParams.get('payableNo');
    const isEdit = urlParams.get('edit') === 'true';

    if (isEdit && payableNo) {
        loadPayableDetails(payableNo);
    }
});