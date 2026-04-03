// Калькулятор стоимости товара
// С кнопками очистки и стилизованными ошибками

const productScenarioSelect = document.getElementById('product-scenario-select');
const productForms = document.querySelectorAll('.product-form');
const clearButtons = document.querySelectorAll('.product-clear-btn');

const productInfoButtons = document.querySelectorAll('.product-scenario-info-btn');
const productInfoContent = document.getElementById('product-scenario-info-content');

function pNum(value) {
  if (value === '' || value == null) return NaN;
  return parseFloat(String(value).replace(/\s+/g, '').replace(',', '.'));
}

function pMoney(n) {
  if (!isFinite(n)) return '—';
  const rounded = Math.round(n);
  return rounded.toLocaleString('ru-RU') + ' ₽';
}

function pNumber(n, digits = 2) {
  if (!isFinite(n)) return '—';
  const r = parseFloat(n.toFixed(digits));
  return r.toLocaleString('ru-RU');
}

function showError(noteEl, message) {
  if (noteEl) {
    noteEl.textContent = message;
    noteEl.classList.add('error');
  }
}

function showSuccess(noteEl, message) {
  if (noteEl) {
    noteEl.textContent = message;
    noteEl.classList.remove('error');
  }
}

function clearForm(form) {
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.value = '';
  });
  const scenario = form.dataset.scenario;
  const noteId = getNoteIdForScenario(scenario);
  const noteEl = document.getElementById(noteId);
  if (noteEl) {
    showSuccess(noteEl, 'Поля очищены. Введите данные и нажмите «Рассчитать».');
  }
  // Сброс результатов для сценария
  resetResultsForScenario(scenario);
}

function getNoteIdForScenario(scenario) {
  const map = {
    'sale-from-cost': 'prod-note-1',
    'margin-from-prices': 'prod-note-2',
    'unit-from-total': 'prod-note-3',
    'vat': 'prod-note-4',
    'weight-cost-from-kg': 'prod-note-5',
    'weight-grams-from-money': 'prod-note-6',
    'price-per-kg': 'prod-note-7',
    'price-for-weight': 'prod-note-8'
  };
  return map[scenario] || 'prod-note-1';
}

function resetResultsForScenario(scenario) {
  if (scenario === 'sale-from-cost') {
    document.getElementById('prod-sale-price').textContent = '—';
    document.getElementById('prod-cost-total').textContent = '—';
    document.getElementById('prod-sale-no-vat').textContent = '—';
    document.getElementById('prod-sale-with-vat').textContent = '—';
    document.getElementById('prod-profit').textContent = '—';
    document.getElementById('prod-margin-pct').textContent = '—';
  } else if (scenario === 'margin-from-prices') {
    document.getElementById('prod-profit2').textContent = '—';
    document.getElementById('prod-markup-pct').textContent = '—';
    document.getElementById('prod-margin2-pct').textContent = '—';
  } else if (scenario === 'unit-from-total') {
    document.getElementById('prod-unit-price').textContent = '—';
  } else if (scenario === 'vat') {
    document.getElementById('prod-vat-main').textContent = '—';
    document.getElementById('prod-vat-net').textContent = '—';
    document.getElementById('prod-vat-gross').textContent = '—';
    document.getElementById('prod-vat-amount').textContent = '—';
  } else if (scenario === 'weight-cost-from-kg') {
    document.getElementById('prod-w-cost').textContent = '—';
    document.getElementById('prod-w-100g').textContent = '—';
    document.getElementById('prod-w-kg').textContent = '—';
  } else if (scenario === 'weight-grams-from-money') {
    document.getElementById('prod-w-main-grams').textContent = '—';
    document.getElementById('prod-w-grams').textContent = '—';
    document.getElementById('prod-w-kg-2').textContent = '—';
  } else if (scenario === 'price-per-kg') {
    document.getElementById('prod-w-price-kg-main').textContent = '—';
    document.getElementById('prod-w-price-kg').textContent = '—';
    document.getElementById('prod-w-price-100g').textContent = '—';
  } else if (scenario === 'price-for-weight') {
    document.getElementById('prod-w-target-price').textContent = '—';
    document.getElementById('prod-w-target-kg-price').textContent = '—';
    document.getElementById('prod-w-target-100g-price').textContent = '—';
  }
}

// Описания сценариев
const productScenarioDescriptions = {
  'sale-from-cost': `<h4>1. Цена продажи по закупке и наценке</h4><p>Сценарий помогает определить рекомендуемую цену продажи товара на основе закупочной цены, дополнительных расходов и желаемой наценки в процентах.</p>`,
  'margin-from-prices': `<h4>2. Наценка и маржа по закупке и продаже</h4><p>Здесь вы вводите только закупочную цену и цену продажи. Калькулятор определяет прибыль с единицы, наценку и маржу.</p>`,
  'unit-from-total': `<h4>3. Цена за единицу по общей сумме и количеству</h4><p>Сценарий пригодится, когда известна общая сумма покупки и количество позиций, но нужно узнать цену за одну единицу товара.</p>`,
  'vat': `<h4>4. Цена с НДС и без НДС</h4><p>Помогает быстро перевести цену с НДС в цену без НДС и наоборот.</p>`,
  'weight-cost-from-kg': `<h4>5. Стоимость товара по весу и цене за 1 кг</h4><p>Если указана цена за 1 кг и нужно узнать, сколько будет стоить определённый вес (в граммах), используйте этот сценарий.</p>`,
  'weight-grams-from-money': `<h4>6. Сколько граммов можно купить на сумму</h4><p>Здесь вы вводите цену за 1 кг и сумму денег, которую готовы потратить. Калькулятор определяет, какой вес товара вы сможете купить.</p>`,
  'price-per-kg': `<h4>7. Цена товара за 1 кг (по цене и весу)</h4><p>Сценарий позволяет вычислить стоимость 1 кг и 100 г товара по известной цене упаковки и её весу.</p>`,
  'price-for-weight': `<h4>8. Цена за другой вес товара</h4><p>Если вы знаете цену и вес стандартной упаковки, этот сценарий поможет посчитать, сколько будет стоить другой вес.</p>`
};

function updateProductScenarioInfo(id) {
  const html = productScenarioDescriptions[id];
  if (productInfoContent) productInfoContent.innerHTML = html || '';
}

function setActiveProductScenario(id) {
  productForms.forEach((form) => {
    form.classList.toggle('active', form.dataset.scenario === id);
  });
  if (productScenarioSelect && productScenarioSelect.value !== id) {
    productScenarioSelect.value = id;
  }
  productInfoButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.scenario === id);
  });
  updateProductScenarioInfo(id);
}

if (productScenarioSelect) {
  productScenarioSelect.addEventListener('change', () => {
    setActiveProductScenario(productScenarioSelect.value);
  });
}

productInfoButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.scenario;
    productInfoButtons.forEach((b) => b.classList.toggle('active', b === btn));
    updateProductScenarioInfo(id);
  });
});

clearButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.product-form');
    if (form) clearForm(form);
  });
});

// Обработка форм
productForms.forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const scenario = form.dataset.scenario;
    const noteId = getNoteIdForScenario(scenario);
    const noteEl = document.getElementById(noteId);

    try {
      if (scenario === 'sale-from-cost') {
        const cost = pNum(form.elements['costPrice'].value);
        const extra = pNum(form.elements['extraCosts'].value);
        const markup = pNum(form.elements['markup'].value);
        const vatRate = pNum(form.elements['vat'].value);
        if (!cost || isNaN(markup)) throw new Error('Укажите закупочную цену и наценку.');
        const extraSafe = isNaN(extra) ? 0 : extra;
        const vatSafe = isNaN(vatRate) ? 0 : vatRate;
        const costTotal = cost + extraSafe;
        const saleNoVat = costTotal * (1 + markup / 100);
        const saleWithVat = vatSafe > 0 ? saleNoVat * (1 + vatSafe / 100) : saleNoVat;
        const profit = saleNoVat - costTotal;
        const marginPct = (profit / saleNoVat) * 100;
        document.getElementById('prod-sale-price').textContent = pMoney(saleWithVat);
        document.getElementById('prod-cost-total').textContent = pMoney(costTotal);
        document.getElementById('prod-sale-no-vat').textContent = pMoney(saleNoVat);
        document.getElementById('prod-sale-with-vat').textContent = pMoney(saleWithVat);
        document.getElementById('prod-profit').textContent = pMoney(profit);
        document.getElementById('prod-margin-pct').textContent = pNumber(marginPct, 1) + ' %';
        showSuccess(noteEl, 'Цена продажи рассчитана исходя из себестоимости и указанной наценки.');
      } else if (scenario === 'margin-from-prices') {
        const cost = pNum(form.elements['costPrice'].value);
        const sale = pNum(form.elements['salePrice'].value);
        if (!cost || !sale) throw new Error('Укажите закупочную и продажную цену.');
        if (sale <= 0) throw new Error('Цена продажи должна быть больше нуля.');
        const profit = sale - cost;
        const markupPct = (profit / cost) * 100;
        const marginPct = (profit / sale) * 100;
        document.getElementById('prod-profit2').textContent = pMoney(profit);
        document.getElementById('prod-markup-pct').textContent = pNumber(markupPct, 1) + ' %';
        document.getElementById('prod-margin2-pct').textContent = pNumber(marginPct, 1) + ' %';
        showSuccess(noteEl, 'Наценка и маржа рассчитаны.');
      } else if (scenario === 'unit-from-total') {
        const total = pNum(form.elements['total'].value);
        const quantity = pNum(form.elements['quantity'].value);
        let precision = parseInt(form.elements['precision'].value, 10);
        if (!total || !quantity) throw new Error('Укажите общую сумму и количество единиц.');
        if (quantity <= 0) throw new Error('Количество единиц должно быть больше нуля.');
        if (isNaN(precision) || precision < 0) precision = 2;
        if (precision > 6) precision = 6;
        const unit = total / quantity;
        document.getElementById('prod-unit-price').textContent = pNumber(unit, precision) + ' ₽';
        showSuccess(noteEl, 'Цена за единицу рассчитана.');
      } else if (scenario === 'vat') {
        const net = pNum(form.elements['net'].value);
        const gross = pNum(form.elements['gross'].value);
        const vatRate = pNum(form.elements['vatRate'].value);
        if (vatRate == null || isNaN(vatRate)) throw new Error('Укажите ставку НДС.');
        const r = vatRate / 100;
        let netPrice, grossPrice;
        if (!isNaN(net) && net > 0) {
          netPrice = net;
          grossPrice = net * (1 + r);
        } else if (!isNaN(gross) && gross > 0) {
          grossPrice = gross;
          netPrice = gross / (1 + r);
        } else {
          throw new Error('Укажите цену без НДС или цену с НДС.');
        }
        const vatAmount = grossPrice - netPrice;
        document.getElementById('prod-vat-main').textContent = `Цена без НДС: ${pMoney(netPrice)}, с НДС: ${pMoney(grossPrice)}`;
        document.getElementById('prod-vat-net').textContent = pMoney(netPrice);
        document.getElementById('prod-vat-gross').textContent = pMoney(grossPrice);
        document.getElementById('prod-vat-amount').textContent = pMoney(vatAmount);
        showSuccess(noteEl, 'НДС рассчитан.');
      } else if (scenario === 'weight-cost-from-kg') {
        const pricePerKg = pNum(form.elements['pricePerKg'].value);
        const weightGr = pNum(form.elements['weightGr'].value);
        if (!pricePerKg || !weightGr) throw new Error('Укажите цену за 1 кг и вес товара.');
        const cost = pricePerKg * (weightGr / 1000);
        const price100g = pricePerKg / 10;
        document.getElementById('prod-w-cost').textContent = pMoney(cost);
        document.getElementById('prod-w-100g').textContent = pNumber(price100g, 2) + ' ₽';
        document.getElementById('prod-w-kg').textContent = pMoney(pricePerKg);
        showSuccess(noteEl, 'Стоимость товара рассчитана.');
      } else if (scenario === 'weight-grams-from-money') {
        const pricePerKg = pNum(form.elements['pricePerKg'].value);
        const amount = pNum(form.elements['amount'].value);
        if (!pricePerKg || !amount) throw new Error('Укажите цену за 1 кг и сумму.');
        const grams = (amount / pricePerKg) * 1000;
        const kg = grams / 1000;
        document.getElementById('prod-w-main-grams').textContent = `${pNumber(grams, 0)} г`;
        document.getElementById('prod-w-grams').textContent = pNumber(grams, 0) + ' г';
        document.getElementById('prod-w-kg-2').textContent = pNumber(kg, 3) + ' кг';
        showSuccess(noteEl, 'Вес рассчитан.');
      } else if (scenario === 'price-per-kg') {
        const totalPrice = pNum(form.elements['totalPrice'].value);
        const weightGr = pNum(form.elements['weightGr'].value);
        if (!totalPrice || !weightGr) throw new Error('Укажите цену упаковки и её вес.');
        if (weightGr <= 0) throw new Error('Вес упаковки должен быть больше нуля.');
        const priceKg = totalPrice / (weightGr / 1000);
        const price100g = priceKg / 10;
        document.getElementById('prod-w-price-kg-main').textContent = `Цена за 1 кг: ${pMoney(priceKg)}`;
        document.getElementById('prod-w-price-kg').textContent = pMoney(priceKg);
        document.getElementById('prod-w-price-100g').textContent = pNumber(price100g, 2) + ' ₽';
        showSuccess(noteEl, 'Цена за 1 кг рассчитана.');
      } else if (scenario === 'price-for-weight') {
        const packagePrice = pNum(form.elements['packagePrice'].value);
        const packageWeightGr = pNum(form.elements['packageWeightGr'].value);
        const targetWeightGr = pNum(form.elements['targetWeightGr'].value);
        if (!packagePrice || !packageWeightGr || !targetWeightGr) throw new Error('Укажите цену упаковки, её вес и нужный вес.');
        if (packageWeightGr <= 0 || targetWeightGr <= 0) throw new Error('Вес должен быть больше нуля.');
        const pricePerGram = packagePrice / packageWeightGr;
        const targetPrice = pricePerGram * targetWeightGr;
        const pricePerKg = pricePerGram * 1000;
        const pricePer100g = pricePerGram * 100;
        document.getElementById('prod-w-target-price').textContent = pMoney(targetPrice);
        document.getElementById('prod-w-target-kg-price').textContent = pMoney(pricePerKg);
        document.getElementById('prod-w-target-100g-price').textContent = pNumber(pricePer100g, 2) + ' ₽';
        showSuccess(noteEl, 'Стоимость нужного веса рассчитана.');
      }
    } catch (err) {
      showError(noteEl, err.message || 'Ошибка ввода.');
      resetResultsForScenario(scenario);
    }
  });
});

setActiveProductScenario('sale-from-cost');