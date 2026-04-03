// Калькулятор КБЖУ
// С ОРИГИНАЛЬНЫМИ ФОРМУЛАМИ (эвристика с тренировками)

const kbjuMainForm = document.getElementById('kbju-main-form');
const kbjuProgressForm = document.getElementById('kbju-progress-form');
const kbjuImportBtn = document.getElementById('kbju-import-btn');
const kbjuMainClearBtn = document.getElementById('kbju-main-clear-btn');
const kbjuProgressClearBtn = document.getElementById('kbju-progress-clear-btn');

// элементы для вывода результатов калькулятора 1
const elBmr = document.getElementById('kbju-bmr');
const elMaintenance = document.getElementById('kbju-maintenance');
const elGoalCalories = document.getElementById('kbju-goal-calories');
const elKcal = document.getElementById('kbju-kcal');
const elProtein = document.getElementById('kbju-protein');
const elFat = document.getElementById('kbju-fat');
const elCarbs = document.getElementById('kbju-carbs');
const elKbjuNote = document.getElementById('kbju-note');

// элементы калькулятора 2
const elDelta = document.getElementById('kbju-delta');
const elTime = document.getElementById('kbju-time');
const elProgressNote = document.getElementById('kbju-progress-note');

// Храним последние данные из калькулятора №1
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

// Расчёт поддерживающей нормы с учётом активности (оригинальная эвристика)
function calcMaintenanceWithActivity(bmr, activity) {
  const base = bmr;
  const sedentaryExtra = 0.15 * base;
  const trainingExtraPerSession = 0.25 * base;
  let extraPerDay = 0;

  switch (activity) {
    case 'sedentary':
      extraPerDay = sedentaryExtra;
      break;
    case 'light':
      extraPerDay = sedentaryExtra + (2 * trainingExtraPerSession) / 7;
      break;
    case 'moderate':
      extraPerDay = sedentaryExtra + (4 * trainingExtraPerSession) / 7;
      break;
    case 'active':
      extraPerDay = sedentaryExtra + (7 * trainingExtraPerSession) / 7;
      break;
    case 'very_active':
      extraPerDay = 0.8 * base;
      break;
    default:
      extraPerDay = sedentaryExtra;
  }
  return base + extraPerDay;
}

// ===== Калькулятор 1: суточная норма и КБЖУ =====

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
      if (!age || !height || !weight) {
        throw new Error('Заполните возраст, рост и вес.');
      }
      if (age < 10 || age > 99) throw new Error('Возраст должен быть от 10 до 99 лет.');
      if (height < 120 || height > 230) throw new Error('Рост должен быть от 120 до 230 см.');
      if (weight < 30 || weight > 250) throw new Error('Вес должен быть от 30 до 250 кг.');

      // BMR по формуле Миффлина — Сан Жеора
      let bmr;
      if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Поддерживающая норма с учётом активности (оригинальная эвристика)
      const maintenance = calcMaintenanceWithActivity(bmr, activity);

      // Целевая калорийность в зависимости от цели
      let goalCalories;
      if (goal === 'loss') {
        goalCalories = maintenance * 0.8;
      } else if (goal === 'gain') {
        goalCalories = maintenance * 1.15;
      } else {
        goalCalories = maintenance;
      }

      // Расчёт КБЖУ через проценты от goalCalories
      let proteinPct, fatPct, carbsPct;

      if (goal === 'loss') {
        if (sex === 'female') {
          proteinPct = 0.325;
          fatPct = 0.275;
          carbsPct = 0.40;
        } else {
          proteinPct = 0.350;
          fatPct = 0.25;
          carbsPct = 0.40;
        }
      } else if (goal === 'maintain') {
        proteinPct = 0.30;
        fatPct = 0.25;
        carbsPct = 0.45;
      } else { // gain
        if (sex === 'female') {
          proteinPct = 0.325;
          fatPct = 0.275;
          carbsPct = 0.40;
        } else {
          proteinPct = 0.350;
          fatPct = 0.25;
          carbsPct = 0.40;
        }
      }

      const proteinKcal = goalCalories * proteinPct;
      const fatKcal = goalCalories * fatPct;
      const carbsKcal = goalCalories * carbsPct;

      const proteinGrams = proteinKcal / 4;
      const fatGrams = fatKcal / 9;
      const carbsGrams = carbsKcal / 4;

      elBmr.textContent = `${fmt(bmr, 0)} ккал`;
      elMaintenance.textContent = `${fmt(maintenance, 0)} ккал`;
      elGoalCalories.textContent = `${fmt(goalCalories, 0)} ккал`;
      elKcal.textContent = `${fmt(goalCalories, 0)} ккал`;
      elProtein.textContent = `${fmt(proteinGrams, 0)} г`;
      elFat.textContent = `${fmt(fatGrams, 0)} г`;
      elCarbs.textContent = `${fmt(carbsGrams, 0)} г`;

      kbjuState.maintenance = maintenance;
      kbjuState.goalCalories = goalCalories;
      kbjuState.goalType = goal;
      kbjuState.weight = weight;

      showSuccess(elKbjuNote, 'Расчёт выполнен. Данные можно импортировать в калькулятор прогноза.');
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
  kbjuMainClearBtn.addEventListener('click', () => {
    resetMainForm();
  });
}

// ===== Калькулятор 2: прогноз прогресса =====

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
      showError(elProgressNote, 'Сначала рассчитайте КБЖУ в калькуляторе №1, чтобы можно было подставить данные.');
      return;
    }

    if (maintenanceInput) maintenanceInput.value = Math.round(kbjuState.maintenance);
    if (intakeInput) intakeInput.value = Math.round(kbjuState.goalCalories);
    if (currentWeightInput && kbjuState.weight) currentWeightInput.value = kbjuState.weight;

    if (kbjuState.goalType && goalSelect) {
      goalSelect.value = kbjuState.goalType === 'gain' ? 'gain' : 'loss';
    }

    showSuccess(elProgressNote, 'Данные из калькулятора №1 подставлены. При необходимости скорректируйте значения вручную.');
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
    const KCAL_PER_KG_MUSCLE = 5000;

    try {
      if (!currentWeight || !targetWeight || !maintenance || !intake) {
        throw new Error('Заполните все поля для расчёта прогноза.');
      }
      if (currentWeight <= 0 || targetWeight <= 0) {
        throw new Error('Вес должен быть положительным числом.');
      }
      if (maintenance <= 0 || intake <= 0) {
        throw new Error('Калорийность должна быть положительным числом.');
      }

      const deltaPerDay = intake - maintenance;
      let daysNeeded;
      let note = '';

      if (goal === 'loss') {
        if (currentWeight <= targetWeight) {
          throw new Error('Для цели «Похудение» текущий вес должен быть больше желаемого.');
        }
        if (deltaPerDay >= 0) {
          throw new Error('Для похудения нужен дефицит калорий (рацион ниже поддерживающей нормы).');
        }

        const kgToLose = currentWeight - targetWeight;
        const totalDeficit = kgToLose * KCAL_PER_KG_FAT;
        daysNeeded = totalDeficit / Math.abs(deltaPerDay);
        note = 'Расчёт основан на предположении, что дефицит 7 700 ккал соответствует снижению веса на 1 кг жировой массы.';
      } else {
        if (currentWeight >= targetWeight) {
          throw new Error('Для цели «Набор мышечной массы» желаемый вес должен быть больше текущего.');
        }
        if (deltaPerDay <= 0) {
          throw new Error('Для набора массы нужен профицит калорий (рацион выше поддерживающей нормы).');
        }

        const kgToGain = targetWeight - currentWeight;
        const totalSurplus = kgToGain * KCAL_PER_KG_MUSCLE;
        daysNeeded = totalSurplus / deltaPerDay;
        note = 'Расчёт ориентировочный, так как набор мышечной массы зависит от тренировок, генетики и других факторов.';
      }

      const weeks = daysNeeded / 7;

      elDelta.textContent = `${deltaPerDay > 0 ? '+' : ''}${fmt(deltaPerDay, 0)} ккал/день`;
      elTime.textContent = `${fmt(daysNeeded, 0)} дн. (~${fmt(weeks, 1)} нед.)`;
      showSuccess(elProgressNote, note);
    } catch (err) {
      elDelta.textContent = '—';
      elTime.textContent = '—';
      showError(elProgressNote, err.message || 'Ошибка ввода.');
    }
  });
}

if (kbjuProgressClearBtn) {
  kbjuProgressClearBtn.addEventListener('click', () => {
    resetProgressForm();
  });
}