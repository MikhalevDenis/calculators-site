// Калькулятор индекса массы тела (ИМТ) по формуле ВОЗ

const bmiForm = document.getElementById('bmi-form');

const bmiValueEl = document.getElementById('bmi-value');
const bmiCategoryEl = document.getElementById('bmi-category');
const bmiNormalRangeEl = document.getElementById('bmi-normal-range');
const bmiIdealWeightEl = document.getElementById('bmi-ideal-weight');
const bmiNoteEl = document.getElementById('bmi-note');

function toNum(value) {
  if (value === '' || value == null) return NaN;
  return parseFloat(String(value).replace(',', '.'));
}

function formatNumber(num, digits = 1) {
  if (!isFinite(num)) return '—';
  const r = parseFloat(num.toFixed(digits));
  // заменяем точку на запятую и форматируем по-русски
  return String(r).replace('.', ',');
}

function getBmiCategory(bmi) {
  if (bmi < 16) {
    return 'Выраженный дефицит массы тела';
  } else if (bmi < 17) {
    return 'Умеренный дефицит массы тела';
  } else if (bmi < 18.5) {
    return 'Небольшой дефицит массы тела';
  } else if (bmi < 25) {
    return 'Нормальная масса тела';
  } else if (bmi < 30) {
    return 'Избыточная масса тела (предожирение)';
  } else if (bmi < 35) {
    return 'Ожирение I степени';
  } else if (bmi < 40) {
    return 'Ожирение II степени';
  } else {
    return 'Ожирение III степени';
  }
}

if (bmiForm) {
  bmiForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(bmiForm);
    const sex = formData.get('sex') || 'male';
    const age = toNum(formData.get('age'));
    const heightCm = toNum(formData.get('height'));
    const weight = toNum(formData.get('weight'));

    try {
      if (!heightCm || !weight) {
        throw new Error('Заполните рост и вес.');
      }

      const heightM = heightCm / 100;
      if (heightM <= 0) {
        throw new Error('Рост должен быть положительным числом.');
      }

      const bmi = weight / (heightM * heightM);

      bmiValueEl.textContent = formatNumber(bmi, 1);
      bmiCategoryEl.textContent = getBmiCategory(bmi);
      bmiNormalRangeEl.textContent = '18,5–24,9';

      // ориентировочный "здоровый" вес по границам нормы ИМТ
      const minNormalWeight = 18.5 * heightM * heightM;
      const maxNormalWeight = 24.9 * heightM * heightM;
      bmiIdealWeightEl.textContent =
        `${formatNumber(minNormalWeight, 1)}–${formatNumber(maxNormalWeight, 1)} кг`;

      // пояснение в зависимости от возраста
      let note = 'Расчёт выполнен по формуле ВОЗ для взрослых. ';
      if (!isNaN(age) && age > 0 && age < 18) {
        note +=
          'Обратите внимание: для детей и подростков до 18 лет используются специальные возрастные и половые таблицы, поэтому стандартная классификация ИМТ носит ориентировочный характер.';
      } else if (!isNaN(age) && age >= 65) {
        note +=
          'В старшем возрасте интерпретация ИМТ может отличаться, результаты лучше обсуждать с врачом.';
      } else {
        note +=
          'ИМТ не учитывает распределение жировой и мышечной ткани, особенности телосложения и другие индивидуальные факторы.';
      }

      if (sex === 'male') {
        note += ' У мужчин при развитой мышечной массе ИМТ может быть повышенным без избытка жира.';
      } else {
        note += ' У женщин значимую роль играют гормональный фон и распределение жировой ткани.';
      }

      bmiNoteEl.textContent = note;
      bmiNoteEl.classList.remove('error');
    } catch (err) {
      bmiValueEl.textContent = '—';
      bmiCategoryEl.textContent = '—';
      bmiIdealWeightEl.textContent = '—';
      bmiNoteEl.textContent = err.message || 'Ошибка ввода.';
      bmiNoteEl.classList.add('error');
    }
  });
}
