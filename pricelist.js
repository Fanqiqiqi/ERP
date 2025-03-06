const tbody = document.querySelector('.pricelist-table tbody');
const addBtn = document.querySelector('.add-btn');
const backBtn = document.querySelector('.back-btn');
const saveAllBtn = document.querySelector('.save-all-btn');
const printBtn = document.querySelector('.print-btn');
const priceCategorySelect = document.querySelector('#priceCategory');
const table = document.querySelector('.pricelist-table');
const theadRow = table.querySelector('thead tr');

// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const priceCode = urlParams.get('priceCode');
const isEditMode = urlParams.get('edit') === 'true';
const isViewMode = !isEditMode && priceCode; // 查看模式：有 priceCode 且非编辑模式

// 从产品数据中加载已有产品
function getProducts() {
  return JSON.parse(localStorage.getItem('products') || '[]');
}

// 从 localStorage 中加载价格表类别（键名：prcategories）
function loadPriceCategories() {
  const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
  priceCategorySelect.innerHTML = '<option value="">请选择类别</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.code;
    option.textContent = category.name;
    priceCategorySelect.appendChild(option);
  });

  if (priceCode) {
    const prices = JSON.parse(localStorage.getItem('prices') || '[]');
    const price = prices.find(p => p.code === priceCode);
    if (price) {
      const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
      const category = categories.find(c => c.name === price.category);
      if (category) {
        priceCategorySelect.value = category.code;
      }
    }
  }

  // 查看模式下禁用价格表类别选择
  if (isViewMode) {
    priceCategorySelect.disabled = true;
  }
}

// 加载价格表明细数据
function loadPriceList() {
  const priceList = JSON.parse(localStorage.getItem('priceList') || '[]');
  const products = getProducts(); // 获取产品数据
  tbody.innerHTML = '';

  // 动态调整表头
  if (isViewMode) {
    table.classList.add('view-mode');
    theadRow.innerHTML = `
      <th>产品代码</th>
      <th>产品名称</th>
      <th>采购价格</th>
      <th>销售价格</th>
      <th>新销售价格</th>
    `;
  } else {
    table.classList.remove('view-mode');
    theadRow.innerHTML = `
      <th>产品代码</th>
      <th>产品名称</th>
      <th>采购价格</th>
      <th>销售价格</th>
      <th>新销售价格</th>
      <th>操作</th>
    `;
  }

  // 如果有 priceCode 参数，加载对应数据；否则保持清空
  if (priceCode) {
    const prices = JSON.parse(localStorage.getItem('prices') || '[]');
    const price = prices.find(p => p.code === priceCode);
    if (price) {
      const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
      const category = categories.find(c => c.name === price.category);
      const filteredPriceList = priceList.filter(item => item.categoryCode === category.code);

      filteredPriceList.forEach((item, index) => {
        const product = products.find(p => p.code === item.productCode); // 查找对应产品
        const currency = product ? product.currency || '' : ''; // 获取货币单位
        const row = document.createElement('tr');
        if (isEditMode) {
          row.innerHTML = `
            <td><input type="text" class="product-code" value="${item.productCode || ''}" placeholder="输入产品代码"></td>
            <td><input type="text" class="product-name" value="${item.productName || ''}" placeholder="输入产品名称"></td>
            <td><input type="number" class="purchase-price" value="${item.purchasePrice || ''}" placeholder="采购价格" step="0.01" readonly> <span>${currency}</span></td>
            <td><input type="number" class="selling-price" value="${item.sellingPrice || ''}" placeholder="销售价格" step="0.01" readonly> <span>${currency}</span></td>
            <td><input type="number" class="new-selling-price" value="${item.newSellingPrice || ''}" placeholder="新销售价" step="0.01"> <span>${currency}</span></td>
            <td>
              <span class="action-icon delete-icon" data-index="${index}"><i class="fas fa-trash-alt"></i></span>
            </td>
          `;
          bindInputEvents(row);
        } else {
          // 查看模式显示 5 列，无操作列
          row.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td>${item.purchasePrice} ${currency}</td>
            <td>${item.sellingPrice} ${currency}</td>
            <td>${item.newSellingPrice || ''} ${currency}</td>
          `;
        }
        tbody.appendChild(row);
      });
    }
  } else {
    tbody.innerHTML = '';
  }

  // 根据模式显示/隐藏按钮
  if (isViewMode) {
    addBtn.style.display = 'none';
    saveAllBtn.style.display = 'none';
    printBtn.style.display = 'block';
  } else {
    addBtn.style.display = 'block';
    saveAllBtn.style.display = 'block';
    printBtn.style.display = 'none';
  }
  bindIconEvents();
}

// 保存价格表明细数据到 prices（价格表资料）
function savePriceListToPrices() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const selectedCategoryCode = priceCategorySelect.value;
  if (!selectedCategoryCode) {
    alert('请选择价格表类别！');
    return false;
  }

  let allValid = true;
  const priceListData = rows.map(row => {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const sellingPriceInput = row.querySelector('.selling-price');
    const newSellingPriceInput = row.querySelector('.new-selling-price');

    let productCode, productName, purchasePrice, sellingPrice, newSellingPrice;

    if (codeInput && nameInput && purchasePriceInput && sellingPriceInput && newSellingPriceInput) {
      productCode = codeInput.value.trim();
      productName = nameInput.value.trim();
      purchasePrice = purchasePriceInput.value.trim();
      sellingPrice = sellingPriceInput.value.trim();
      newSellingPrice = newSellingPriceInput.value.trim();
    } else {
      productCode = row.cells[0].textContent.trim();
      productName = row.cells[1].textContent.trim();
      purchasePrice = row.cells[2].textContent.split(' ')[0].trim();
      sellingPrice = row.cells[3].textContent.split(' ')[0].trim();
      newSellingPrice = row.cells[4].textContent.split(' ')[0].trim();
    }

    if (!productCode || !productName || !purchasePrice || !sellingPrice) {
      allValid = false;
    }

    return {
      productCode,
      productName,
      purchasePrice,
      sellingPrice,
      newSellingPrice,
      categoryCode: selectedCategoryCode
    };
  });

  if (!allValid) {
    alert('请确保所有产品信息填写完整！');
    return false;
  }

  const prices = JSON.parse(localStorage.getItem('prices') || '[]');
  const categories = JSON.parse(localStorage.getItem('prcategories') || '[]');
  const selectedCategory = categories.find(c => c.code === selectedCategoryCode);

  if (priceCode && isEditMode) {
    const priceIndex = prices.findIndex(p => p.code === priceCode);
    if (priceIndex !== -1) {
      prices[priceIndex].category = selectedCategory ? selectedCategory.name : selectedCategoryCode;
    }
  } else {
    const priceCodeGenerated = `PRICE${String(prices.length + 1).padStart(3, '0')}`;
    prices.push({
      code: priceCodeGenerated,
      category: selectedCategory ? selectedCategory.name : selectedCategoryCode
    });
  }

  const existingPriceList = JSON.parse(localStorage.getItem('priceList') || '[]');
  const updatedPriceList = existingPriceList.filter(item => 
    item.categoryCode !== selectedCategoryCode || 
    !priceListData.some(newItem => newItem.productCode === item.productCode)
  ).concat(priceListData);

  localStorage.setItem('prices', JSON.stringify(prices));
  localStorage.setItem('priceList', JSON.stringify(updatedPriceList));

  window.dispatchEvent(new Event('storage'));
  return true;
}

// 添加新行
addBtn.addEventListener('click', function() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="product-code" placeholder="输入产品代码"></td>
    <td><input type="text" class="product-name" placeholder="输入产品名称"></td>
    <td><input type="number" class="purchase-price" placeholder="采购价格" step="0.01" readonly> <span></span></td>
    <td><input type="number" class="selling-price" placeholder="销售价格" step="0.01" readonly> <span></span></td>
    <td><input type="number" class="new-selling-price" placeholder="新销售价" step="0.01"> <span></span></td>
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
  window.location.href = 'price.html';
  window.close();
});

// 保存所有数据并跳转回主页面
saveAllBtn.addEventListener('click', function() {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach(row => {
    const codeInput = row.querySelector('.product-code');
    const nameInput = row.querySelector('.product-name');
    const purchasePriceInput = row.querySelector('.purchase-price');
    const sellingPriceInput = row.querySelector('.selling-price');
    const newSellingPriceInput = row.querySelector('.new-selling-price');

    if (codeInput && nameInput && purchasePriceInput && sellingPriceInput && newSellingPriceInput) {
      const code = codeInput.value.trim();
      const name = nameInput.value.trim();
      const purchasePrice = purchasePriceInput.value.trim();
      const sellingPrice = sellingPriceInput.value.trim();
      const newSellingPrice = newSellingPriceInput.value.trim();
      const currencySpan = newSellingPriceInput.nextElementSibling.textContent.trim();

      if (code && name && purchasePrice && sellingPrice) {
        row.cells[0].textContent = code;
        row.cells[1].textContent = name;
        row.cells[2].innerHTML = `${purchasePrice} <span>${currencySpan}</span>`;
        row.cells[3].innerHTML = `${sellingPrice} <span>${currencySpan}</span>`;
        row.cells[4].innerHTML = `${newSellingPrice} <span>${currencySpan}</span>`;
      }
    }
  });

  if (savePriceListToPrices()) {
    window.location.href = 'price.html';
    window.close();
  }
});

// 打印功能
printBtn.addEventListener('click', function() {
  window.print();
});

// 绑定输入框事件（自动补全）
function bindInputEvents(row) {
  const codeInput = row.querySelector('.product-code');
  const nameInput = row.querySelector('.product-name');
  const purchasePriceInput = row.querySelector('.purchase-price');
  const sellingPriceInput = row.querySelector('.selling-price');
  const newSellingPriceInput = row.querySelector('.new-selling-price');

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
            sellingPriceInput.value = product.sellingPrice || '';
            newSellingPriceInput.placeholder = `新销售价 (${product.currency || ''})`;
            const currency = product.currency || '';
            purchasePriceInput.nextElementSibling.textContent = currency;
            sellingPriceInput.nextElementSibling.textContent = currency;
            newSellingPriceInput.nextElementSibling.textContent = currency;
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

    document.addEventListener('click', function(e) {
      const suggestions = row.querySelector('.autocomplete-suggestions');
      if (suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.remove();
      }
    });
  });
}

// 绑定操作图标事件
function bindIconEvents() {
  if (isViewMode) return; // 查看模式不绑定事件
  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.removeEventListener('click', deleteHandler);
    icon.addEventListener('click', deleteHandler);
  });
}

const deleteHandler = function() {
  const row = this.closest('tr');
  const productCode = row.cells[0].textContent;
  if (confirm(`确定删除产品：${productCode} 的价格明细吗？`)) {
    row.remove();
    savePriceListToPrices();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  loadPriceCategories();
  loadPriceList();
});