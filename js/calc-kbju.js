// Калькулятор КБЖУ

const kbjuMainForm = document.getElementById('kbju-main-form');
const kbjuProgressForm = document.getElementById('kbju-progress-form');
const kbjuImportBtn = document.getElementById('kbju-import-btn');

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

// ==== Калькулятор 1: суточная норма и КБЖУ ====

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

      // BMR по формуле Миффлина — Сан Жеора
      let bmr;
      if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Коэффициенты активности
      const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      const factor = activityFactors[activity] || 1.55;
      const maintenance = bmr * factor;

      // Расчёт КБЖУ по целям

      let goalCalories;
      let proteinGrams;
      let fatGrams;
      let carbsGrams;
      let noteText = '';

      if (goal === 'loss') {
        // 1. Похудение:
        // умеренный дефицит калорий ~20% от поддерживающей нормы
        const deficitFactor = 0.8;
        goalCalories = maintenance * deficitFactor;

        // белки и жиры по жёстким нормам:
        // 1,5 г белка и 0,8 г жира на 1 кг массы тела
        const proteinPerKg = 1.5;
        const fatPerKg = 0.8;

        proteinGrams = proteinPerKg * weight;
        fatGrams = fatPerKg * weight;

        const proteinKcal = proteinGrams * 4;
        const fatKcal = fatGrams * 9;

        // углеводы — на оставшиеся калории
        let carbsKcal = goalCalories - proteinKcal - fatKcal;
        if (carbsKcal < 0) carbsKcal = 0;
        carbsGrams = carbsKcal / 4;

        noteText =
          'Для снижения веса используется умеренный дефицит калорий (~20% от поддерживающей нормы) и пропорции макронутриентов: около 1,5 г белка, 0,8 г жира и примерно 2 г углеводов на 1 кг массы тела. Фактическое количество углеводов подстраивается под выбранный дефицит.';
      } else if (goal === 'maintain') {

        // 2. Поддержание веса:
        // белки — 1,2–1,6 г/кг (берём ~1,4),
        // жиры — 0,8–1,2 г/кг (берём ~1),
        // углеводы — 3–5 г/кг (берём ~4)
        const proteinPerKg = 1.4;
        const fatPerKg = 1.0;
        const carbsPerKg = 4.0;

        proteinGrams = proteinPerKg * weight;
        fatGrams = fatPerKg * weight;
        carbsGrams = carbsPerKg * weight;

        goalCalories =
          proteinGrams * 4 + fatGrams * 9 + carbsGrams * 4;

        noteText =
          'Для поддержания веса используются усреднённые нормы: около 1,2–1,6 г белка, 0,8–1,2 г жира и 3–5 г углеводов на 1 кг массы тела.';
      } else {
        // 3. Набор мышечной массы:
        // белок — 2 г/кг, жиры — 1 г/кг, углеводы — остаток калорий
        // создаём небольшой профицит от поддерживающей нормы (~15%)
        const surplusFactor = 1.15;
        goalCalories = maintenance * surplusFactor;

        const proteinPerKg = 2.0;
        const fatPerKg = 1.0;

        proteinGrams = proteinPerKg * weight;
        fatGrams = fatPerKg * weight;

        const proteinKcal = proteinGrams * 4;
        const fatKcal = fatGrams * 9;

        let carbsKcal = goalCalories - proteinKcal - fatKcal;
        if (carbsKcal < 0) carbsKcal = 0;
        carbsGrams = carbsKcal / 4;

        noteText =
          'Для набора мышечной массы используется небольшой профицит калорий (~10–15%) и повышенное содержание белка (до 2 г/кг) при достаточном количестве жиров. Углеводы занимают оставшуюся часть калорий (обычно 40–50%).';
      }

      // Выводим результаты
      elBmr.textContent = `${fmt(bmr, 0)} ккал`;
      elMaintenance.textContent = `${fmt(maintenance, 0)} ккал`;
      elGoalCalories.textContent = `${fmt(goalCalories, 0)} ккал`;

      elKcal.textContent = `${fmt(goalCalories, 0)} ккал`;
      elProtein.textContent = `${fmt(proteinGrams, 0)} г`;
      elFat.textContent = `${fmt(fatGrams, 0)} г`;
      elCarbs.textContent = `${fmt(carbsGrams, 0)} г`;

      elKbjuNote.textContent =
        noteText +
        ' Значения ориентировочные и не учитывают медицинские противопоказания, состав тела и другие индивидуальные особенности.';

      // Сохраняем в состояние для калькулятора 2
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
      elKbjuNote.textContent = err.message || 'Ошибка ввода.';
    }
  });
}

// ==== Калькулятор 2: прогноз прогресса ====

if (kbjuImportBtn && kbjuProgressForm) {
  kbjuImportBtn.addEventListener('click', () => {
    const maintenanceInput = kbjuProgressForm.querySelector('input[name="maintenance"]');
    const intakeInput = kbjuProgressForm.querySelector('input[name="intake"]');
    const goalSelect = kbjuProgressForm.querySelector('select[name="goal"]');

    if (!kbjuState.maintenance || !kbjuState.goalCalories) {
      elProgressNote.textContent =
        'Сначала рассчитайте КБЖУ в калькуляторе №1, чтобы можно было подставить данные.';
      elProgressNote.classList.add('error');
      return;
    }

    if (maintenanceInput) maintenanceInput.value = Math.round(kbjuState.maintenance);
    if (intakeInput) intakeInput.value = Math.round(kbjuState.goalCalories);

    if (kbjuState.goalType && goalSelect) {
      // цель в калькуляторе 2 по умолчанию такая же, как в калькуляторе 1
      goalSelect.value = kbjuState.goalType === 'gain' ? 'gain' : 'loss';
    }

    elProgressNote.textContent =
      'Данные из калькулятора №1 подставлены. При необходимости скорректируйте значения вручную.';
    elProgressNote.classList.remove('error');
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

    const KCAL_PER_KG_FAT = 7700;   // для похудения
    const KCAL_PER_KG_MUSCLE = 5000; // грубая оценка для набора мышц

    try {
      if (!currentWeight || !targetWeight || !maintenance || !intake) {
        throw new Error('Заполните все поля для расчёта прогноза.');
      }

      const deltaPerDay = intake - maintenance; // >0 профицит, <0 дефицит
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

        note =
          'Расчёт основан на предположении, что дефицит примерно 7 700 ккал соответствует снижению веса на 1 кг жировой массы.';
      } else {
        // goal === 'gain'
        if (currentWeight >= targetWeight) {
          throw new Error('Для цели «Набор мышечной массы» желаемый вес должен быть больше текущего.');
        }
        if (deltaPerDay <= 0) {
          throw new Error('Для набора массы нужен профицит калорий (рацион выше поддерживающей нормы).');
        }

        const kgToGain = targetWeight - currentWeight;
        const totalSurplus = kgToGain * KCAL_PER_KG_MUSCLE;
        daysNeeded = totalSurplus / deltaPerDay;

        note =
          'Расчёт использует приближение: около 5 000 ккал профицита могут соответствовать приросту массы примерно на 1 кг (включая не только чистую мышечную ткань).';
      }

      const weeks = daysNeeded / 7;

      elDelta.textContent = `${deltaPerDay > 0 ? '+' : ''}${fmt(deltaPerDay, 0)} ккал/день`;
      elTime.textContent = `${fmt(daysNeeded, 0)} дн. (~${fmt(weeks, 1)} нед.)`;
      elProgressNote.textContent = note;
      elProgressNote.classList.remove('error');
    } catch (err) {
      elDelta.textContent = '—';
      elTime.textContent = '—';
      elProgressNote.textContent = err.message || 'Ошибка ввода.';
      elProgressNote.classList.add('error');
    }
  });
}