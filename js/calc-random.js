// Генератор случайных чисел (рандомайзер)

const randomForm = document.getElementById('random-form');
const randomOutputEl = document.getElementById('random-output');
const randomNoteEl = document.getElementById('random-note');
const randomHistoryEl = document.getElementById('random-history');
const randomClearBtn = document.getElementById('random-clear');

const presetButtons = document.querySelectorAll('.random-preset-btn');

function toNum(value) {
  if (value === '' || value == null) return NaN;
  return parseFloat(String(value).replace(',', '.'));
}

function formatFloat(num, precision) {
  if (!isFinite(num)) return '—';
  const p = Math.max(0, Math.min(10, precision || 0));
  const r = parseFloat(num.toFixed(p));
  // форматируем по-русски
  return String(r).replace('.', ',');
}

function generateRandomInt(min, max) {
  // включительно [min, max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomFloat(min, max, precision) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(precision));
}

function addToHistory(resultStr, params) {
  if (!randomHistoryEl) return;

  const time = new Date();
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  const row = document.createElement('div');
  row.className = 'random-history-row';
  row.innerHTML = `
    <div class="random-history-time">${hh}:${mm}:${ss}</div>
    <div class="random-history-data">${resultStr}</div>
  `;

  randomHistoryEl.prepend(row);

  // ограничим историю последними 10 записями
  const rows = randomHistoryEl.querySelectorAll('.random-history-row');
  if (rows.length > 10) {
    rows[rows.length - 1].remove();
  }
}

if (randomForm) {
  randomForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(randomForm);
    const minVal = toNum(formData.get('min'));
    const maxVal = toNum(formData.get('max'));
    let count = parseInt(formData.get('count'), 10);
    const type = formData.get('type') || 'int';
    const precision = parseInt(formData.get('precision'), 10) || 0;
    const sort = formData.get('sort') || 'none';
    const unique = formData.get('unique') === 'on';

    try {
      if (isNaN(minVal) || isNaN(maxVal)) {
        throw new Error('Укажите минимальное и максимальное значения.');
      }
      if (maxVal < minVal) {
        throw new Error('Максимальное значение должно быть не меньше минимального.');
      }

      if (isNaN(count) || count <= 0) count = 1;
      if (count > 1000) {
        throw new Error('Количество чисел не должно превышать 1000.');
      }

      const rangeSize = maxVal - minVal;
      if (unique && type === 'int') {
        const available = Math.floor(maxVal) - Math.ceil(minVal) + 1;
        if (available < count) {
          throw new Error(
            `Нельзя сгенерировать ${count} уникальных целых чисел в диапазоне с таким количеством значений.`
          );
        }
      }

      let results = [];

      if (type === 'int') {
        // целые числа
        if (unique) {
          const used = new Set();
          while (results.length < count) {
            const v = generateRandomInt(Math.ceil(minVal), Math.floor(maxVal));
            if (!used.has(v)) {
              used.add(v);
              results.push(v);
            }
          }
        } else {
          for (let i = 0; i < count; i++) {
            const v = generateRandomInt(Math.ceil(minVal), Math.floor(maxVal));
            results.push(v);
          }
        }
      } else {
        // числа с дробной частью
        const p = Math.max(0, Math.min(10, precision));
        if (unique) {
          const used = new Set();
          let safety = 0;
          while (results.length < count) {
            const v = generateRandomFloat(minVal, maxVal, p);
            const key = v.toFixed(p);
            if (!used.has(key)) {
              used.add(key);
              results.push(v);
            }
            safety++;
            if (safety > count * 50) break; // защита от вечного цикла
          }
          if (results.length < count) {
            throw new Error(
              'Не удалось сгенерировать указанное количество уникальных значений с заданной точностью.'
            );
          }
        } else {
          for (let i = 0; i < count; i++) {
            const v = generateRandomFloat(minVal, maxVal, p);
            results.push(v);
          }
        }
      }

      // сортировка
      if (sort === 'asc') {
        results.sort((a, b) => a - b);
      } else if (sort === 'desc') {
        results.sort((a, b) => b - a);
      }

      // форматируем вывод
      const formatted =
        type === 'int'
          ? results.join(', ')
          : results.map((v) => formatFloat(v, precision)).join(', ');

      randomOutputEl.textContent = formatted || '—';

      randomNoteEl.textContent =
        `Сгенерировано ${results.length} значен(ия/ий) в диапазоне от ${minVal} до ${maxVal}.` +
        (unique ? ' Повторы исключены.' : '');
      randomNoteEl.classList.remove('error');

      addToHistory(formatted, { minVal, maxVal, count, type, precision, sort, unique });
    } catch (err) {
      randomOutputEl.textContent = '—';
      randomNoteEl.textContent = err.message || 'Ошибка ввода.';
      randomNoteEl.classList.add('error');
    }
  });

  // пресеты (кубик, монетка, 6 из 49)
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const minInput = randomForm.elements['min'];
      const maxInput = randomForm.elements['max'];
      const countInput = randomForm.elements['count'];
      const typeSelect = randomForm.elements['type'];
      const precisionInput = randomForm.elements['precision'];
      const sortSelect = randomForm.elements['sort'];
      const uniqueCheckbox = randomForm.elements['unique'];

      if (!minInput || !maxInput || !countInput) return;

      if (preset === 'dice') {
        minInput.value = 1;
        maxInput.value = 6;
        countInput.value = 1;
        typeSelect.value = 'int';
        precisionInput.value = 0;
        sortSelect.value = 'none';
        uniqueCheckbox.checked = false;
      } else if (preset === 'coin') {
        // монетка будем показывать текстом
        minInput.value = 0;
        maxInput.value = 1;
        countInput.value = 1;
        typeSelect.value = 'int';
        precisionInput.value = 0;
        sortSelect.value = 'none';
        uniqueCheckbox.checked = false;

        // сразу "подменим" вывод
        const flip = Math.random() < 0.5 ? 'Орёл' : 'Решка';
        randomOutputEl.textContent = flip;
        randomNoteEl.textContent = 'Брошена монетка (имитация случайного выбора).';
        randomNoteEl.classList.remove('error');
        addToHistory(flip, { preset: 'coin' });
        return;
      } else if (preset === '6of49') {
        minInput.value = 1;
        maxInput.value = 49;
        countInput.value = 6;
        typeSelect.value = 'int';
        precisionInput.value = 0;
        sortSelect.value = 'asc';
        uniqueCheckbox.checked = true;
      }

      // после пресета просто фокус на кнопку "Сгенерировать"
      randomForm.querySelector('.btn-calc')?.focus();
    });
  });

  // очистка результата и истории
  if (randomClearBtn) {
    randomClearBtn.addEventListener('click', () => {
      randomOutputEl.textContent = '—';
      randomNoteEl.textContent =
        'Укажите диапазон, количество чисел и нажмите «Сгенерировать».';
      randomNoteEl.classList.remove('error');
      if (randomHistoryEl) randomHistoryEl.innerHTML = '';
    });
  }
}
