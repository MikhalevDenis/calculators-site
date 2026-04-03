// Калькулятор процентов
// С кнопкой очистки и стилизованными ошибками

const scenarioSelect = document.getElementById('percent-scenario-select');
const percentForms = document.querySelectorAll('.percent-form');
const clearButtons = document.querySelectorAll('.percent-clear-btn');

// Кнопки и блок описаний
const scenarioInfoButtons = document.querySelectorAll('.scenario-info-btn');
const scenarioInfoContent = document.getElementById('scenario-info-content');

// Описания сценариев (HTML‑текст)
const scenarioDescriptions = {
  'percent-of-number': `
    <h4>1. Найти процент от числа</h4>
    <p>Классическая задача: нужно узнать, какое значение составляет <strong>Х&nbsp;%</strong> от выбранного числа.</p>
    <p>Формула: <code>результат = число × процент / 100</code>.</p>
    <p><strong>Пример.</strong> Сколько будет 15&nbsp;% от 200?</p>
    <ul><li>200 × 0,15 = 30.</li></ul>
    <p><strong>Ответ:</strong> 30.</p>
  `,
  'number-by-percent': `
    <h4>2. Найти число по его проценту</h4>
    <p>Известно значение, которое является <strong>Х&nbsp;%</strong> от неизвестного числа.</p>
    <p>Формула: <code>число = известное_значение × 100 / процент</code>.</p>
    <p><strong>Пример.</strong> 30 — это 15&nbsp;% от какого числа?</p>
    <ul><li>число = 30 × 100 / 15 = 200.</li></ul>
    <p><strong>Ответ:</strong> 200.</p>
  `,
  'part-of-whole': `
    <h4>3. Сколько процентов одно число составляет от другого</h4>
    <p>Определяем, какой процент <strong>часть</strong> составляет от <strong>целого</strong>.</p>
    <p>Формула: <code>процент = часть / целое × 100</code>.</p>
    <p><strong>Пример.</strong> Какой процент составляет 30 от 200?</p>
    <ul><li>процент = 30 / 200 × 100 = 15&nbsp;%.</li></ul>
    <p><strong>Ответ:</strong> 15&nbsp;%.</p>
  `,
  'increase-by-percent': `
    <h4>4. Увеличить число на N процентов</h4>
    <p>Используется, когда нужно применить наценку, рост цены или увеличение показателя.</p>
    <p>Формула: <code>новое = исходное × (1 + процент / 100)</code>.</p>
    <p><strong>Пример.</strong> Увеличить 200 на 10&nbsp;%:</p>
    <ul><li>новое = 200 × 1,10 = 220.</li></ul>
    <p><strong>Ответ:</strong> 220.</p>
  `,
  'decrease-by-percent': `
    <h4>5. Уменьшить число на N процентов</h4>
    <p>Типичный пример — скидка или снижение показателя.</p>
    <p>Формула: <code>новое = исходное × (1 − процент / 100)</code>.</p>
    <p><strong>Пример.</strong> Уменьшить 200 на 15&nbsp;%:</p>
    <ul><li>новое = 200 × 0,85 = 170.</li></ul>
    <p><strong>Ответ:</strong> 170.</p>
  `,
  'growth-percent': `
    <h4>6. На сколько процентов число выросло</h4>
    <p>Показывает относительный рост: на сколько процентов значение <strong>стало больше</strong>.</p>
    <p>Формула: <code>рост&nbsp;% = (стало − было) / было × 100</code>.</p>
    <p><strong>Пример.</strong> Было 200, стало 260:</p>
    <ul><li>рост&nbsp;% = (260 − 200) / 200 × 100 = 30&nbsp;%.</li></ul>
    <p><strong>Ответ:</strong> рост на 30&nbsp;%.</p>
  `,
  'drop-percent': `
    <h4>7. На сколько процентов число уменьшилось</h4>
    <p>Показывает, на сколько процентов значение <strong>уменьшилось</strong>.</p>
    <p>Формула: <code>падение&nbsp;% = (было − стало) / было × 100</code>.</p>
    <p><strong>Пример.</strong> Было 200, стало 150:</p>
    <ul><li>падение&nbsp;% = (200 − 150) / 200 × 100 = 25&nbsp;%.</li></ul>
    <p><strong>Ответ:</strong> уменьшилось на 25&nbsp;%.</p>
  `,
  'compound-interest': `
    <h4>8. Сложные проценты (рост суммы по периодам)</h4>
    <p>При сложных процентах начисление идёт не только на исходную сумму, но и на уже накопленные проценты.</p>
    <p>Формула: <code>итог = сумма × (1 + ставка / 100)<sup>периодов</sup></code>.</p>
    <p><strong>Пример.</strong> Вклад 10&nbsp;000 под 10&nbsp;% в год на 3 года:</p>
    <ul><li>итог = 10&nbsp;000 × 1,10³ ≈ 13&nbsp;310.</li></ul>
    <p><strong>Ответ:</strong> около 13&nbsp;310.</p>
  `
};

function updateScenarioInfo(id) {
  const html = scenarioDescriptions[id];
  if (scenarioInfoContent) {
    scenarioInfoContent.innerHTML = html || '';
  }
}

function setActiveScenario(id) {
  percentForms.forEach((form) => {
    form.classList.toggle('active', form.dataset.scenario === id);
  });
  if (scenarioSelect && scenarioSelect.value !== id) {
    scenarioSelect.value = id;
  }
  scenarioInfoButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.scenario === id);
  });
  updateScenarioInfo(id);
}

function showError(form, message) {
  const noteEl = form.querySelector('.percent-note');
  const resultEl = form.querySelector('.percent-result-value');
  if (resultEl) resultEl.textContent = '—';
  if (noteEl) {
    noteEl.textContent = message;
    noteEl.classList.add('error');
  }
}

function showSuccess(form, message, result) {
  const resultEl = form.querySelector('.percent-result-value');
  const noteEl = form.querySelector('.percent-note');
  if (resultEl) resultEl.textContent = result;
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
  const resultEl = form.querySelector('.percent-result-value');
  const noteEl = form.querySelector('.percent-note');
  if (resultEl) resultEl.textContent = '—';
  if (noteEl) {
    noteEl.textContent = 'Заполните поля и нажмите «Рассчитать».';
    noteEl.classList.remove('error');
  }
}

// ================== Обработчики ==================

if (scenarioSelect) {
  scenarioSelect.addEventListener('change', () => {
    setActiveScenario(scenarioSelect.value);
  });
}

scenarioInfoButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.scenario;
    scenarioInfoButtons.forEach((b) => b.classList.toggle('active', b === btn));
    updateScenarioInfo(id);
  });
});

function parseInput(form, name) {
  const input = form.querySelector(`input[name="${name}"]`);
  if (!input) return NaN;
  const value = parseFloat(String(input.value).replace(',', '.'));
  return value;
}

function formatNumber(num, digits = 4) {
  if (!isFinite(num)) return '—';
  const rounded = parseFloat(num.toFixed(digits));
  return String(rounded).replace('.', ',');
}

percentForms.forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const scenario = form.dataset.scenario;
    let result = NaN;
    let note = '';

    try {
      switch (scenario) {
        case 'percent-of-number': {
          const number = parseInput(form, 'number');
          const percent = parseInput(form, 'percent');
          if (isNaN(number) || isNaN(percent)) throw new Error('Заполните оба поля.');
          result = (number * percent) / 100;
          note = `${percent}% от ${formatNumber(number)} = ${formatNumber(result, 6)}`;
          break;
        }
        case 'number-by-percent': {
          const part = parseInput(form, 'part');
          const percent = parseInput(form, 'percent');
          if (isNaN(part) || isNaN(percent)) throw new Error('Заполните оба поля.');
          if (percent === 0) throw new Error('Процент не может быть равен нулю.');
          result = (part * 100) / percent;
          note = `${part} — это ${percent}% от ${formatNumber(result, 6)}`;
          break;
        }
        case 'part-of-whole': {
          const part = parseInput(form, 'part');
          const whole = parseInput(form, 'whole');
          if (isNaN(part) || isNaN(whole)) throw new Error('Заполните оба поля.');
          if (whole === 0) throw new Error('Целое не может быть нулём.');
          result = (part / whole) * 100;
          note = `${part} составляет ${formatNumber(result, 6)}% от ${whole}`;
          break;
        }
        case 'increase-by-percent': {
          const number = parseInput(form, 'number');
          const percent = parseInput(form, 'percent');
          if (isNaN(number) || isNaN(percent)) throw new Error('Заполните оба поля.');
          result = number * (1 + percent / 100);
          note = `${number} увеличено на ${percent}% = ${formatNumber(result, 6)}`;
          break;
        }
        case 'decrease-by-percent': {
          const number = parseInput(form, 'number');
          const percent = parseInput(form, 'percent');
          if (isNaN(number) || isNaN(percent)) throw new Error('Заполните оба поля.');
          result = number * (1 - percent / 100);
          note = `${number} уменьшено на ${percent}% = ${formatNumber(result, 6)}`;
          break;
        }
        case 'growth-percent': {
          const from = parseInput(form, 'from');
          const to = parseInput(form, 'to');
          if (isNaN(from) || isNaN(to)) throw new Error('Заполните оба поля.');
          if (from === 0) throw new Error('Исходное значение не может быть нулём.');
          result = ((to - from) / from) * 100;
          note = `Рост с ${from} до ${to} = ${formatNumber(result, 6)}%`;
          break;
        }
        case 'drop-percent': {
          const from = parseInput(form, 'from');
          const to = parseInput(form, 'to');
          if (isNaN(from) || isNaN(to)) throw new Error('Заполните оба поля.');
          if (from === 0) throw new Error('Исходное значение не может быть нулём.');
          result = ((from - to) / from) * 100;
          note = `Падение с ${from} до ${to} = ${formatNumber(result, 6)}%`;
          break;
        }
        case 'compound-interest': {
          const amount = parseInput(form, 'amount');
          const rate = parseInput(form, 'rate');
          const periods = parseInput(form, 'periods');
          if (isNaN(amount) || isNaN(rate) || isNaN(periods)) throw new Error('Заполните все поля.');
          if (periods < 0) throw new Error('Число периодов не может быть отрицательным.');
          result = amount * Math.pow(1 + rate / 100, periods);
          note = `Сумма ${amount} при ставке ${rate}% за ${periods} период(а/ов) вырастет до ${formatNumber(result, 6)}`;
          break;
        }
        default:
          throw new Error('Неизвестный сценарий.');
      }
      showSuccess(form, note, formatNumber(result, 6));
    } catch (err) {
      showError(form, err.message || 'Ошибка ввода.');
    }
  });
});

// Обработчики кнопок "Очистить"
clearButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.percent-form');
    if (form) clearForm(form);
  });
});

// Инициализация по умолчанию
setActiveScenario('percent-of-number');