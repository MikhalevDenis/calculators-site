// Калькулятор КБЖУ
// BMR: формула Миффлина-Сан Жеора (рекомендована ADA)
// TDEE: стандартные коэффициенты активности
// БЖУ: рекомендации ВОЗ/ФАО (10-15% белки, 15-30% жиры, 55-75% углеводы)

const kbjuMainForm = document.getElementById('kbju-main-form');
const kbjuProgressForm = document.getElementById('kbju-progress-form');
const kbjuImportBtn = document.getElementById('kbju-import-btn');
const kbjuMainClearBtn = document.getElementById('kbju-main-clear-btn');
const kbjuProgressClearBtn = document.getElementById('kbju-progress-clear-btn');

// Элементы вывода калькулятора 1
const elBmr = document.getElementById('kbju-bmr');
const elMaintenance = document.getElementById('kbju-maintenance');
const elGoalCalories = document.getElementById('kbju-goal-calories');
const elKcal = document.getElementById('kbju-kcal');
const elProtein = document.getElementById('kbju-protein');
const elFat = document.getElementById('kbju-fat');
const elCarbs = document.getElementById('kbju-carbs');
const elKbjuNote = document.getElementById('kbju-note');

// Элементы калькулятора 2
const elDelta = document.getElementById('kbju-delta');
const elTime = document.getElementById('kbju-time');
const elProgressNote = document.getElementById('kbju-progress-note');

const kbjuState = {
  maintenance: null,
  goalCalories: null,
  goalType: null,
  weight: null
};

// Вспомогательные функции
function toNumber(value) {
  if (value === '' || value == null) return NaN;
  return parseFloat(String(value).replace(',', '.'));
}

function fmt(num, digits = 0) {
  if (!isFinite(num)) return '—';
  const rounded = parseFloat(num.toFixed(digits));
  return String(rounded).replace('.', ',');
}

function showError(element, message) {
  element.textContent = message;
  element.classList.add('error');
}

function showSuccess(element, message) {
  element.textContent = message;
  element.classList.remove('error');
}

// ==== СТАНДАРТНЫЕ КОЭФФИЦИЕНТЫ АКТИВНОСТИ (PAL) ====
const activityMultipliers = {
  sedentary: 1.2,    // Минимальная активность
  light: 1.375,      // Легкая активность (1-3 тренировки в неделю)
  moderate: 1.55,    // Средняя активность (3-5 тренировок в неделю)
  active: 1.725,     // Высокая активность (6-7 тренировок в неделю)
  very_active: 1.9   // Очень высокая активность (тяжелый физический труд)
};

// ==== РАСЧЕТ BMR по Миффлину-Сан Жеору ====
function calcBMR(sex, weight, height, age) {
  if (sex === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// ==== РАСПРЕДЕЛЕНИЕ БЖУ ====
// Основано на рекомендациях ВОЗ/ФАО и адаптировано под цель
function getMacroPercentages(goal) {
  // Рекомендации ВОЗ: Белки 10-15%, Жиры 15-30%, Углеводы 55-75%.
  // Для похудения и набора массы белок берем по верхней границе (15-25%), 
  // чтобы сохранить/нарастить мышцы. Жиры оставляем в пределах 25-30% для гормонального фона.
  if (goal === 'loss') {
    // Похудение: больше белка для сохранения мышц, меньше углеводов
    return { protein: 0.25, fat: 0.30, carbs: 0.45 };
  } else if (goal === 'gain') {
    // Набор массы: достаточно белка, больше углеводов для энергии
    return { protein: 0.20, fat: 0.25, carbs: 0.55 };
  } else {
    // Поддержание: сбалансированное питание по ВОЗ
    return { protein: 0.15, fat: 0.30, carbs: 0.55 };
  }
}

// ===== Калькулятор 1 =====
function resetMainForm() {
  const formElements = kbjuMainForm.elements;
  if (formElements['age']) formElements['age'].value = '';
  if (formElements['height']) formElements['height'].value = '';
  if (formElements['weight']) formElements['weight'].value = '';
  if (formElements['activity']) formElements['activity'].value = 'moderate';
  if (formElements['goal']) formElements['goal'].value = 'maintain';
  if (formElements['sex']) {
    formElements['sex'].value = 'male';
    document.querySelector('input[name="sex"][value="male"]').checked = true;
  }
  
  elBmr.textContent = '—';
  elMaintenance.textContent = '—';
  elGoalCalories.textContent = '—';
  elKcal.textContent = '—';
  elProtein.textContent = '—';
  elFat.textContent = '—';
  elCarbs.textContent = '—';
  showSuccess(elKbjuNote, 'Заполните поля и нажмите «Рассчитать КБЖУ».');
}

if (kbjuMainForm) {
  kbjuMainForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(kbjuMainForm);
    const sex = formData.get('sex') || 'male';
    const age = toNumber(formData.get('age'));
    const height = toNumber(formData.get('height'));
    const weight = toNumber(formData.get('weight'));
    const activity = formData.get('activity') || 'moderate';
    const goal = formData.get('goal') || 'maintain';

    try {
      if (!age || !height || !weight) throw new Error('Заполните возраст, рост и вес.');
      if (age < 10 || age > 99) throw new Error('Возраст должен быть от 10 до 99 лет.');
      if (height < 120 || height > 230) throw new Error('Рост должен быть от 120 до 230 см.');
      if (weight < 30 || weight > 250) throw new Error('Вес должен быть от 30 до 250 кг.');

      // 1. BMR по формуле Миффлина-Сан Жеора
      const bmr = calcBMR(sex, weight, height, age);

      // 2. TDEE (поддерживающая норма) с использованием стандартных PAL
      const multiplier = activityMultipliers[activity] || 1.55;
      const maintenance = bmr * multiplier;

      // 3. Целевая калорийность
      let goalCalories;
      let goalDescription = '';
      if (goal === 'loss') {
        goalCalories = maintenance * 0.8; // Дефицит 20% (безопасный темп)
        goalDescription = 'Дефицит 20% от поддерживающей нормы для безопасного снижения веса.';
      } else if (goal === 'gain') {
        goalCalories = maintenance * 1.15; // Профицит 15%
        goalDescription = 'Профицит 15% от поддерживающей нормы для набора мышечной массы.';
      } else {
        goalCalories = maintenance;
        goalDescription = 'Калорийность для поддержания текущего веса.';
      }

      // 4. Распределение БЖУ
      const macros = getMacroPercentages(goal);
      
      const proteinKcal = goalCalories * macros.protein;
      const fatKcal = goalCalories * macros.fat;
      const carbsKcal = goalCalories * macros.carbs;

      const proteinGrams = proteinKcal / 4;
      const fatGrams = fatKcal / 9;
      const carbsGrams = carbsKcal / 4;

      // Вывод
      elBmr.textContent = `${fmt(bmr, 0)} ккал`;
      elMaintenance.textContent = `${fmt(maintenance, 0)} ккал`;
      elGoalCalories.textContent = `${fmt(goalCalories, 0)} ккал`;
      
      elKcal.textContent = `${fmt(goalCalories, 0)} ккал`;
      elProtein.textContent = `${fmt(proteinGrams, 0)} г`;
      elFat.textContent = `${fmt(fatGrams, 0)} г`;
      elCarbs.textContent = `${fmt(carbsGrams, 0)} г`;

      // Формируем пояснение
      const proteinPct = Math.round(macros.protein * 100);
      const fatPct = Math.round(macros.fat * 100);
      const carbsPct = Math.round(macros.carbs * 100);
      
      showSuccess(elKbjuNote, 
        `${goalDescription} Распределение БЖУ: Белки ${proteinPct}%, Жиры ${fatPct}%, Углеводы ${carbsPct}%. ` +
        `Базовый обмен (BMR) рассчитан по формуле Миффлина-Сан Жеора.`
      );

      // Сохраняем состояние
      kbjuState.maintenance = maintenance;
      kbjuState.goalCalories = goalCalories;
      kbjuState.goalType = goal;
      kbjuState.weight = weight;

    } catch (err) {
      elBmr.textContent = '—';
      elMaintenance.textContent = '—';
      elGoalCalories.textContent = '—';
      elKcal.textContent = '—';
      elProtein.textContent = '—';
      elFat.textContent = '—';
      elCarbs.textContent = '—';
      showError(elKbjuNote, err.message || 'Ошибка ввода.');
    }
  });
}

if (kbjuMainClearBtn) {
  kbjuMainClearBtn.addEventListener('click', resetMainForm);
}

// ===== Калькулятор 2 (прогноз) =====
function resetProgressForm() {
  const formElements = kbjuProgressForm.elements;
  if (formElements['currentWeight']) formElements['currentWeight'].value = '';
  if (formElements['targetWeight']) formElements['targetWeight'].value = '';
  if (formElements['maintenance']) formElements['maintenance'].value = '';
  if (formElements['intake']) formElements['intake'].value = '';
  if (formElements['goal']) formElements['goal'].value = 'loss';
  
  elDelta.textContent = '—';
  elTime.textContent = '—';
  showSuccess(elProgressNote, 'Заполните поля и нажмите «Рассчитать срок достижения цели».');
}

if (kbjuImportBtn && kbjuProgressForm) {
  kbjuImportBtn.addEventListener('click', () => {
    const maintenanceInput = kbjuProgressForm.querySelector('input[name="maintenance"]');
    const intakeInput = kbjuProgressForm.querySelector('input[name="intake"]');
    const goalSelect = kbjuProgressForm.querySelector('select[name="goal"]');
    const currentWeightInput = kbjuProgressForm.querySelector('input[name="currentWeight"]');

    if (!kbjuState.maintenance || !kbjuState.goalCalories) {
      showError(elProgressNote, 'Сначала рассчитайте КБЖУ в калькуляторе №1.');
      return;
    }

    if (maintenanceInput) maintenanceInput.value = Math.round(kbjuState.maintenance);
    if (intakeInput) intakeInput.value = Math.round(kbjuState.goalCalories);
    if (currentWeightInput && kbjuState.weight) currentWeightInput.value = kbjuState.weight;

    if (kbjuState.goalType && goalSelect) {
      goalSelect.value = kbjuState.goalType === 'gain' ? 'gain' : 'loss';
    }
    showSuccess(elProgressNote, 'Данные из калькулятора №1 подставлены.');
  });
}

if (kbjuProgressForm) {
  kbjuProgressForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(kbjuProgressForm);
    const currentWeight = toNumber(formData.get('currentWeight'));
    const targetWeight = toNumber(formData.get('targetWeight'));
    const maintenance = toNumber(formData.get('maintenance'));
    const intake = toNumber(formData.get('intake'));
    const goal = formData.get('goal') || 'loss';

    const KCAL_PER_KG_FAT = 7700;
    const KCAL_PER_KG_MUSCLE = 5500;

    try {
      if (!currentWeight || !targetWeight || !maintenance || !intake) {
        throw new Error('Заполните все поля.');
      }
      const deltaPerDay = intake - maintenance;
      let daysNeeded, note;

      if (goal === 'loss') {
        if (currentWeight <= targetWeight) throw new Error('Текущий вес должен быть больше желаемого.');
        if (deltaPerDay >= 0) throw new Error('Для похудения нужен дефицит калорий.');
        const kgToLose = currentWeight - targetWeight;
        daysNeeded = (kgToLose * KCAL_PER_KG_FAT) / Math.abs(deltaPerDay);
        note = 'Расчёт основан на дефиците 7700 ккал на 1 кг жировой массы.';
      } else {
        if (currentWeight >= targetWeight) throw new Error('Желаемый вес должен быть больше текущего.');
        if (deltaPerDay <= 0) throw new Error('Для набора массы нужен профицит калорий.');
        const kgToGain = targetWeight - currentWeight;
        daysNeeded = (kgToGain * KCAL_PER_KG_MUSCLE) / deltaPerDay;
        note = 'Оценка ориентировочная, набор мышц зависит от тренировок.';
      }

      const weeks = daysNeeded / 7;
      elDelta.textContent = `${deltaPerDay > 0 ? '+' : ''}${fmt(deltaPerDay, 0)} ккал/день`;
      elTime.textContent = `${fmt(daysNeeded, 0)} дн. (~${fmt(weeks, 1)} нед.)`;
      showSuccess(elProgressNote, note);
    } catch (err) {
      elDelta.textContent = '—';
      elTime.textContent = '—';
      showError(elProgressNote, err.message);
    }
  });
}

if (kbjuProgressClearBtn) {
  kbjuProgressClearBtn.addEventListener('click', resetProgressForm);
}