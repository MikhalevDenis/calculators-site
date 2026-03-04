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

// Расчёт поддерживающей нормы калорий с учётом активности
function calcMaintenanceWithActivity(bmr, activity) {
  // базовый обмен
  const base = bmr;

  // "сидячий" расход — 15% от BMR
  const sedentaryExtra = 0.15 * base;

  // одна тренировка по 1 часу = ~25% от BMR
  const trainingExtraPerSession = 0.25 * base;

  let extraPerDay = 0;

  switch (activity) {
    case 'sedentary':
      // только базовая бытовая активность
      extraPerDay = sedentaryExtra;
      break;
    case 'light':
      // сидячий + 1–2 тренировки/нед, берём 2 тренировки
      extraPerDay = sedentaryExtra + (2 * trainingExtraPerSession) / 7;
      break;
    case 'moderate':
      // сидячий + 3–4 тренировки/нед, берём 4 тренировки
      extraPerDay = sedentaryExtra + (4 * trainingExtraPerSession) / 7;
      break;
    case 'active':
      // сидячий + 7 тренировок/нед (каждый день)
      extraPerDay = sedentaryExtra + (7 * trainingExtraPerSession) / 7;
      break;
    case 'very_active':
      // очень высокая активность: +80% от BMR в день
      extraPerDay = 0.8 * base;
      break;
    default:
      extraPerDay = sedentaryExtra;
  }

  return base + extraPerDay;
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

      // BMR по формуле Миффлина — Сан Жеора
      let bmr;
      if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Поддерживающая норма с учётом активности по новой схеме
      const maintenance = calcMaintenanceWithActivity(bmr, activity);

      // Целевая калорийность в зависимости от цели
      let goalCalories;
      if (goal === 'loss') {
        // похудение: дефицит 20% от поддерживающей нормы
        goalCalories = maintenance * 0.8;
      } else if (goal === 'gain') {
        // набор мышечной массы: профицит 15%
        goalCalories = maintenance * 1.15;
      } else {
        // поддержание текущего веса
        goalCalories = maintenance;
      }

      // Расчёт КБЖУ через проценты от goalCalories
      let proteinPct; // доля калорий из белков (0–1)
      let fatPct;
      let carbsPct;
      let noteText = '';

      if (goal === 'loss') {
        // Похудение:
        // Женщины: Б 32,5%, Ж 27,5%, У 40%.
        // Мужчины: Б 37,5%, Ж 25%,   У 37,5%.
        if (sex === 'female') {
          proteinPct = 0.325;
          fatPct = 0.275;
          carbsPct = 0.40;
        } else {
          proteinPct = 0.350;
          fatPct = 0.25;
          carbsPct = 0.400;
        }

        noteText =
          '';
      } else if (goal === 'maintain') {
        // Поддержание веса: 30% Б, 25% Ж, 45% У (для мужчин и женщин одинаково)
        proteinPct = 0.30;
        fatPct = 0.25;
        carbsPct = 0.45;

        noteText =
          '';
      } else {
        // Набор мышечной массы:
        // те же пропорции, что и при похудении, но на калорийности с профицитом 15%
        if (sex === 'female') {
          proteinPct = 0.325;
          fatPct = 0.275;
          carbsPct = 0.40;
        } else {
          proteinPct = 0.350;
          fatPct = 0.25;
          carbsPct = 0.400;
        }

        noteText =
          '';
      }

      // Пересчёт процентов в граммы
      const proteinKcal = goalCalories * proteinPct;
      const fatKcal = goalCalories * fatPct;
      const carbsKcal = goalCalories * carbsPct;

      const proteinGrams = proteinKcal / 4;
      const fatGrams = fatKcal / 9;
      const carbsGrams = carbsKcal / 4;

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
        ' Расчёты носят ориентировочный характер и не учитывают медицинские противопоказания, состав тела и другие индивидуальные особенности.';

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
          '';
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