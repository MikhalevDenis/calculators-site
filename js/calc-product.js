// Калькулятор стоимости товара

const productScenarioSelect = document.getElementById('product-scenario-select');
const productForms = document.querySelectorAll('.product-form');

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

// Описания сценариев (HTML)
const productScenarioDescriptions = {
  'sale-from-cost': `
    <h4>1. Цена продажи по закупке и наценке</h4>
    <p>
      Сценарий помогает определить рекомендуемую цену продажи товара
      на основе закупочной цены, дополнительных расходов (доставка,
      упаковка и т.п.) и желаемой наценки в процентах.
    </p>
    <p>
      Калькулятор рассчитывает себестоимость единицы, применяет наценку
      и, при необходимости, добавляет НДС. В результате вы видите цену
      без НДС, цену с НДС, прибыль с единицы товара и маржу в процентах.
    </p>
  `,
  'margin-from-prices': `
    <h4>2. Наценка и маржа по закупке и продаже</h4>
    <p>
      Здесь вы вводите только закупочную цену и цену продажи. Калькулятор
      определяет прибыль с единицы, а также:
    </p>
    <ul>
      <li><strong>Наценку</strong> — насколько цена продажи выше себестоимости (по закупке);</li>
      <li><strong>Маржу</strong> — долю прибыли в цене продажи.</li>
    </ul>
    <p>
      Это удобно при анализе ассортимента и проверке рентабельности
      конкретных позиций.
    </p>
  `,
  'unit-from-total': `
    <h4>3. Цена за единицу по общей сумме и количеству</h4>
    <p>
      Сценарий пригодится, когда известна общая сумма покупки и количество
      позиций, но нужно узнать цену за одну единицу товара.
    </p>
    <p>
      Калькулятор делит общую сумму на количество и показывает стоимость
      одной единицы с выбранной точностью округления.
    </p>
  `,
  'vat': `
    <h4>4. Цена с НДС и без НДС</h4>
    <p>
      Помогает быстро перевести цену с НДС в цену без НДС и наоборот.
      Вы можете ввести либо цену без НДС, либо цену с НДС (или обе) и
      указать ставку НДС.
    </p>
    <p>
      Калькулятор досчитает недостающее значение, а также сумму налога.
      Подходит для подготовки коммерческих предложений, договоров и
      анализа цен поставщиков.
    </p>
  `,
  'weight-cost-from-kg': `
    <h4>5. Стоимость товара по весу и цене за 1 кг</h4>
    <p>
      Если указана цена за 1&nbsp;кг и нужно узнать, сколько будет стоить
      определённый вес (в граммах), используйте этот сценарий.
    </p>
    <p>
      Калькулятор показывает стоимость конкретного веса, а также цену
      за 100&nbsp;г и за 1&nbsp;кг — это удобно при сравнении упаковок
      и планировании покупки.
    </p>
  `,
  'weight-grams-from-money': `
    <h4>6. Сколько граммов можно купить на сумму</h4>
    <p>
      Здесь вы вводите цену за 1&nbsp;кг и сумму денег, которую готовы
      потратить. Калькулятор определяет, какой вес товара вы сможете
      купить: в граммах и килограммах.
    </p>
    <p>
      Подходит, когда есть фиксированный бюджет, а нужно прикинуть,
      сколько продукта получится приобрести.
    </p>
  `,
  'price-per-kg': `
    <h4>7. Цена товара за 1 кг (по цене и весу)</h4>
    <p>
      Сценарий позволяет вычислить стоимость 1&nbsp;кг и 100&nbsp;г товара
      по известной цене упаковки и её весу. Это один из самых удобных
      способов сравнивать выгодность разных упаковок.
    </p>
    <p>
      Просто введите цену и вес каждой упаковки по очереди — по цене
      за 1&nbsp;кг сразу видно, какой вариант дешевле.
    </p>
  `,
  'price-for-weight': `
    <h4>8. Цена за другой вес товара</h4>
    <p>
      Если вы знаете цену и вес стандартной упаковки (например, 120 ₽ за
      900 г), этот сценарий поможет посчитать, сколько будет стоить
      другой вес (например, 500 г).
    </p>
    <p>
      Калькулятор рассчитывает стоимость нужного веса, а также показывает
      эквивалентную цену за 1&nbsp;кг и за 100&nbsp;г.
    </p>
  `
};

function updateProductScenarioInfo(id) {
  const html = productScenarioDescriptions[id];
  if (productInfoContent) {
    productInfoContent.innerHTML = html || '';
  }
}

// переключение форм по select
function setActiveProductScenario(id) {
  productForms.forEach((form) => {
    form.classList.toggle('active', form.dataset.scenario === id);
  });

  if (productScenarioSelect && productScenarioSelect.value !== id) {
    productScenarioSelect.value = id;
  }

  // подсветка и описание сценариев
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

// клики по описаниям сценариев (не меняют сам калькулятор, только описание)
productInfoButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.scenario;
    productInfoButtons.forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
    updateProductScenarioInfo(id);
  });
});

// обработка форм
productForms.forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const scenario = form.dataset.scenario;

    try {
      if (scenario === 'sale-from-cost') {
        const cost = pNum(form.elements['costPrice'].value);
        const extra = pNum(form.elements['extraCosts'].value);
        const markup = pNum(form.elements['markup'].value);
        const vatRate = pNum(form.elements['vat'].value);

        const salePriceEl = document.getElementById('prod-sale-price');
        const costTotalEl = document.getElementById('prod-cost-total');
        const saleNoVatEl = document.getElementById('prod-sale-no-vat');
        const saleWithVatEl = document.getElementById('prod-sale-with-vat');
        const profitEl = document.getElementById('prod-profit');
        const marginPctEl = document.getElementById('prod-margin-pct');
        const noteEl = document.getElementById('prod-note-1');

        if (!cost || isNaN(markup)) {
          throw new Error('Укажите закупочную цену и наценку.');
        }

        const extraSafe = isNaN(extra) ? 0 : extra;
        const vatSafe = isNaN(vatRate) ? 0 : vatRate;

        const costTotal = cost + extraSafe;
        const saleNoVat = costTotal * (1 + markup / 100);
        const saleWithVat =
          vatSafe > 0 ? saleNoVat * (1 + vatSafe / 100) : saleNoVat;

        const profit = saleNoVat - costTotal;
        const marginPct = (profit / saleNoVat) * 100;

        salePriceEl.textContent = pMoney(saleWithVat);
        costTotalEl.textContent = pMoney(costTotal);
        saleNoVatEl.textContent = pMoney(saleNoVat);
        saleWithVatEl.textContent = pMoney(saleWithVat);
        profitEl.textContent = pMoney(profit);
        marginPctEl.textContent = pNumber(marginPct, 1) + ' %';

        noteEl.textContent =
          'Цена продажи рассчитана исходя из себестоимости и указанной наценки. Маржа показывает долю прибыли в цене продажи.';
        noteEl.classList.remove('error');
      } else if (scenario === 'margin-from-prices') {
        const cost = pNum(form.elements['costPrice'].value);
        const sale = pNum(form.elements['salePrice'].value);

        const profitEl = document.getElementById('prod-profit2');
        const markupPctEl = document.getElementById('prod-markup-pct');
        const marginPctEl = document.getElementById('prod-margin2-pct');
        const noteEl = document.getElementById('prod-note-2');

        if (!cost || !sale) {
          throw new Error('Укажите закупочную и продажную цену.');
        }
        if (sale <= 0) {
          throw new Error('Цена продажи должна быть больше нуля.');
        }

        const profit = sale - cost;
        const markupPct = (profit / cost) * 100; // наценка по себестоимости
        const marginPct = (profit / sale) * 100; // маржа по цене продажи

        profitEl.textContent = pMoney(profit);
        markupPctEl.textContent = pNumber(markupPct, 1) + ' %';
        marginPctEl.textContent = pNumber(marginPct, 1) + ' %';

        noteEl.textContent =
          'Наценка показывает, на сколько процентов цена продажи выше себестоимости. Маржа показывает долю прибыли в цене продажи.';
        noteEl.classList.remove('error');
      } else if (scenario === 'unit-from-total') {
        const total = pNum(form.elements['total'].value);
        const quantity = pNum(form.elements['quantity'].value);
        let precision = parseInt(form.elements['precision'].value, 10);

        const unitPriceEl = document.getElementById('prod-unit-price');
        const noteEl = document.getElementById('prod-note-3');

        if (!total || !quantity) {
          throw new Error('Укажите общую сумму и количество единиц.');
        }
        if (quantity <= 0) {
          throw new Error('Количество единиц должно быть больше нуля.');
        }
        if (isNaN(precision) || precision < 0) precision = 2;
        if (precision > 6) precision = 6;

        const unit = total / quantity;

        unitPriceEl.textContent = pNumber(unit, precision) + ' ₽';

        noteEl.textContent =
          'Цена за единицу рассчитана как общая сумма, делённая на количество товаров. При необходимости можно изменить точность округления.';
        noteEl.classList.remove('error');
      } else if (scenario === 'vat') {
        const net = pNum(form.elements['net'].value);
        const gross = pNum(form.elements['gross'].value);
        const vatRate = pNum(form.elements['vatRate'].value);

        const mainEl = document.getElementById('prod-vat-main');
        const netEl = document.getElementById('prod-vat-net');
        const grossEl = document.getElementById('prod-vat-gross');
        const vatEl = document.getElementById('prod-vat-amount');
        const noteEl = document.getElementById('prod-note-4');

        if (vatRate == null || isNaN(vatRate)) {
          throw new Error('Укажите ставку НДС.');
        }

        const r = vatRate / 100;
        let netPrice;
        let grossPrice;

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

        mainEl.textContent = `Цена без НДС: ${pMoney(
          netPrice
        )}, с НДС: ${pMoney(grossPrice)}`;
        netEl.textContent = pMoney(netPrice);
        grossEl.textContent = pMoney(grossPrice);
        vatEl.textContent = pMoney(vatAmount);

        noteEl.textContent =
          'Расчёт выполнен по указанной ставке НДС. Если вы заполнили только одно поле (с НДС или без НДС), второе значение досчитано автоматически.';
        noteEl.classList.remove('error');
      } else if (scenario === 'weight-cost-from-kg') {
        const pricePerKg = pNum(form.elements['pricePerKg'].value);
        const weightGr = pNum(form.elements['weightGr'].value);

        const costEl = document.getElementById('prod-w-cost');
        const price100El = document.getElementById('prod-w-100g');
        const priceKgEl = document.getElementById('prod-w-kg');
        const noteEl = document.getElementById('prod-note-5');

        if (!pricePerKg || !weightGr) {
          throw new Error('Укажите цену за 1 кг и вес товара.');
        }

        const cost = pricePerKg * (weightGr / 1000);
        const price100g = pricePerKg / 10;

        costEl.textContent = pMoney(cost);
        price100El.textContent = pNumber(price100g, 2) + ' ₽';
        priceKgEl.textContent = pMoney(pricePerKg);

        noteEl.textContent =
          'Стоимость товара рассчитана исходя из указанного веса и цены за 1 кг. Цена за 100 г помогает сравнить несколько вариантов между собой.';
        noteEl.classList.remove('error');
      } else if (scenario === 'weight-grams-from-money') {
        const pricePerKg = pNum(form.elements['pricePerKg'].value);
        const amount = pNum(form.elements['amount'].value);

        const mainEl = document.getElementById('prod-w-main-grams');
        const gramsEl = document.getElementById('prod-w-grams');
        const kgEl = document.getElementById('prod-w-kg-2');
        const noteEl = document.getElementById('prod-note-6');

        if (!pricePerKg || !amount) {
          throw new Error('Укажите цену за 1 кг и сумму.');
        }

        const grams = (amount / pricePerKg) * 1000;
        const kg = grams / 1000;

        mainEl.textContent = `${pNumber(grams, 0)} г`;
        gramsEl.textContent = pNumber(grams, 0) + ' г';
        kgEl.textContent = pNumber(kg, 3) + ' кг';

        noteEl.textContent =
          'Вес рассчитан исходя из указанной суммы и цены за 1 кг. Значения в граммах и килограммах помогут оценить, хватит ли товара для ваших задач.';
        noteEl.classList.remove('error');
      } else if (scenario === 'price-per-kg') {
        const totalPrice = pNum(form.elements['totalPrice'].value);
        const weightGr = pNum(form.elements['weightGr'].value);

        const mainEl = document.getElementById('prod-w-price-kg-main');
        const priceKgEl = document.getElementById('prod-w-price-kg');
        const price100gEl = document.getElementById('prod-w-price-100g');
        const noteEl = document.getElementById('prod-note-7');

        if (!totalPrice || !weightGr) {
          throw new Error('Укажите цену упаковки и её вес.');
        }

        if (weightGr <= 0) {
          throw new Error('Вес упаковки должен быть больше нуля.');
        }

        const priceKg = totalPrice / (weightGr / 1000);
        const price100g = priceKg / 10;

        mainEl.textContent = `Цена за 1 кг: ${pMoney(priceKg)}`;
        priceKgEl.textContent = pMoney(priceKg);
        price100gEl.textContent = pNumber(price100g, 2) + ' ₽';

        noteEl.textContent =
          'Чем ниже цена за 1 кг, тем выгоднее упаковка. Сравните несколько вариантов одного товара по этой величине.';
        noteEl.classList.remove('error');
      } else if (scenario === 'price-for-weight') {
        const packagePrice = pNum(form.elements['packagePrice'].value);
        const packageWeightGr = pNum(form.elements['packageWeightGr'].value);
        const targetWeightGr = pNum(form.elements['targetWeightGr'].value);

        const mainEl = document.getElementById('prod-w-target-price');
        const kgPriceEl = document.getElementById('prod-w-target-kg-price');
        const price100gEl = document.getElementById('prod-w-target-100g-price');
        const noteEl = document.getElementById('prod-note-8');

        if (!packagePrice || !packageWeightGr || !targetWeightGr) {
          throw new Error('Укажите цену упаковки, её вес и нужный вес.');
        }
        if (packageWeightGr <= 0 || targetWeightGr <= 0) {
          throw new Error('Вес должен быть больше нуля.');
        }

        const pricePerGram = packagePrice / packageWeightGr;
        const targetPrice = pricePerGram * targetWeightGr;

        const pricePerKg = pricePerGram * 1000;
        const pricePer100g = pricePerGram * 100;

        mainEl.textContent = pMoney(targetPrice);
        kgPriceEl.textContent = pMoney(pricePerKg);
        price100gEl.textContent = pNumber(pricePer100g, 2) + ' ₽';

        noteEl.textContent =
          'Стоимость нужного веса рассчитана исходя из цены и веса исходной упаковки. Дополнительно отображается эквивалентная цена за 1 кг и за 100 г.';
        noteEl.classList.remove('error');
      }
    } catch (err) {
      const noteId =
        scenario === 'sale-from-cost'
          ? 'prod-note-1'
          : scenario === 'margin-from-prices'
          ? 'prod-note-2'
          : scenario === 'unit-from-total'
          ? 'prod-note-3'
          : scenario === 'vat'
          ? 'prod-note-4'
          : scenario === 'weight-cost-from-kg'
          ? 'prod-note-5'
          : scenario === 'weight-grams-from-money'
          ? 'prod-note-6'
          : scenario === 'price-per-kg'
          ? 'prod-note-7'
          : 'prod-note-8';

      const noteEl = document.getElementById(noteId);
      noteEl.textContent = err.message || 'Ошибка ввода.';
      noteEl.classList.add('error');

      // Сбрасываем основные результаты для конкретного сценария
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
  });
});

// инициализация: первый сценарий и его описание
setActiveProductScenario('sale-from-cost');
