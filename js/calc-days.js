// Калькулятор дней между датами с мини-календарями + режим прибавления дней
// ТОЧНЫЙ КАЛЕНДАРНЫЙ РАСЧЁТ (с учётом високосных годов и разной длины месяцев)
// + маска ввода даты (автоматические точки)

const form = document.getElementById('date-range-form');
const includeEndCheckbox = document.getElementById('include-end');
const clearBtn = document.getElementById('date-clear-btn');

// Режимы
const modeBtns = document.querySelectorAll('.date-mode-btn');
const modePanels = document.querySelectorAll('.date-mode-panel');
const diffResultsDiv = document.getElementById('date-diff-results');
const addResultsDiv = document.getElementById('date-add-results');

// Элементы результатов для режима "разница"
const totalDaysEl = document.getElementById('date-total-days');
const fullDaysEl = document.getElementById('date-full-days');
const fullMonthsEl = document.getElementById('date-full-months');
const fullYearsEl = document.getElementById('date-full-years');
const noteEl = document.getElementById('date-note');

// Элементы результатов для режима "прибавить дни"
const resultDateEl = document.getElementById('date-result-date');
const weekdayEl = document.getElementById('date-weekday');
const addedDaysEl = document.getElementById('date-added-days');

// Состояние календарей
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const weekdayNames = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
  'Четверг', 'Пятница', 'Суббота'
];

let currentMode = 'diff'; // 'diff' или 'add'

const state = {
  startDate: null,
  endDate: null,
  views: {
    start: { year: null, month: null },
    end: { year: null, month: null }
  }
};

// ========== Маска ввода даты (автоматические точки) ==========
function applyDateMask(input) {
  let value = input.value.replace(/[^\d]/g, ''); // удаляем всё, кроме цифр
  if (value.length > 8) value = value.slice(0, 8);
  
  let formatted = '';
  if (value.length >= 1) formatted += value.slice(0, 2);
  if (value.length >= 3) formatted += '.' + value.slice(2, 4);
  if (value.length >= 5) formatted += '.' + value.slice(4, 8);
  
  input.value = formatted;
}

function initDateMasks() {
  const dateInputs = document.querySelectorAll('.date-input');
  dateInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      applyDateMask(this);
    });
  });
}

// ========== Утилиты ==========
function parseDateInput(str) {
  if (!str) return null;
  str = String(str).trim();
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    if (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) {
      return dt;
    }
    return null;
  }
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function formatDate(d) {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatDateRuLong(d) {
  if (!d) return '—';
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function getWeekdayName(d) {
  if (!d) return '—';
  return weekdayNames[d.getDay()];
}

function showError(message) {
  noteEl.textContent = message;
  noteEl.classList.add('error');
}

function showSuccess(message) {
  noteEl.textContent = message;
  noteEl.classList.remove('error');
}

function resetDiffMode() {
  const startInput = document.querySelector('input[name="startInput"]');
  const endInput = document.querySelector('input[name="endInput"]');
  const today = new Date();
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  state.startDate = yesterday;
  state.endDate = today;
  state.views.start.year = yesterday.getFullYear();
  state.views.start.month = yesterday.getMonth();
  state.views.end.year = today.getFullYear();
  state.views.end.month = today.getMonth();
  if (startInput) startInput.value = formatDate(yesterday);
  if (endInput) endInput.value = formatDate(today);
  if (includeEndCheckbox) includeEndCheckbox.checked = true;
  renderCalendar('start');
  renderCalendar('end');
}

function resetAddMode() {
  const startDateInput = document.getElementById('add-start-date');
  const daysInput = document.getElementById('add-days');
  if (startDateInput) startDateInput.value = '';
  if (daysInput) daysInput.value = '';
}

function resetAll() {
  if (currentMode === 'diff') {
    resetDiffMode();
    calculateDiffMode();
  } else {
    resetAddMode();
    addResultsDiv.style.display = 'none';
    diffResultsDiv.style.display = 'block';
    resultDateEl.textContent = '—';
    weekdayEl.textContent = '—';
    addedDaysEl.textContent = '—';
    showSuccess('Выберите режим и заполните поля, затем нажмите «Рассчитать».');
  }
}

// ========== ТОЧНЫЙ КАЛЕНДАРНЫЙ РАСЧЁТ разницы между датами ==========

function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function addMonths(date, months) {
  const newDate = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  if (newDate.getDate() !== date.getDate()) {
    newDate.setDate(0);
  }
  return newDate;
}

function preciseDateDiff(start, end, includeEnd) {
  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (includeEnd) {
    e = new Date(e.getTime() + MS_PER_DAY);
  }
  if (s > e) {
    const tmp = s;
    s = e;
    e = tmp;
  }
  
  const totalDays = Math.round((e - s) / MS_PER_DAY);
  
  let years = 0;
  let tempDate = new Date(s);
  let nextYearDate = addYears(tempDate, 1);
  while (nextYearDate <= e) {
    years++;
    tempDate = nextYearDate;
    nextYearDate = addYears(tempDate, 1);
  }
  
  let months = 0;
  let nextMonthDate = addMonths(tempDate, 1);
  while (nextMonthDate <= e) {
    months++;
    tempDate = nextMonthDate;
    nextMonthDate = addMonths(tempDate, 1);
  }
  
  const days = Math.round((e - tempDate) / MS_PER_DAY);
  
  return { totalDays, years, months, days };
}

function calculateDiffMode() {
  const includeEnd = includeEndCheckbox && includeEndCheckbox.checked;
  if (!state.startDate || !state.endDate) {
    totalDaysEl.textContent = '—';
    fullDaysEl.textContent = '—';
    fullMonthsEl.textContent = '—';
    fullYearsEl.textContent = '—';
    showError('Выберите обе даты.');
    return;
  }
  
  const { totalDays, years, months, days } = preciseDateDiff(state.startDate, state.endDate, includeEnd);
  
  totalDaysEl.textContent = totalDays.toLocaleString('ru-RU');
  fullYearsEl.textContent = years.toLocaleString('ru-RU');
  fullMonthsEl.textContent = months.toLocaleString('ru-RU');
  fullDaysEl.textContent = days.toLocaleString('ru-RU');
  
  showSuccess('Расчёт выполнен с учётом точной календарной разницы (високосные годы, разная длина месяцев).');
}

// ========== Прибавить/вычесть дни ==========
function calculateAddMode() {
  const startDateInput = document.getElementById('add-start-date');
  const daysInput = document.getElementById('add-days');
  if (!startDateInput || !daysInput) return;
  const startDateStr = startDateInput.value.trim();
  const days = parseInt(daysInput.value, 10);
  if (!startDateStr) {
    resultDateEl.textContent = '—';
    weekdayEl.textContent = '—';
    addedDaysEl.textContent = '—';
    showError('Укажите исходную дату.');
    return;
  }
  if (isNaN(days)) {
    resultDateEl.textContent = '—';
    weekdayEl.textContent = '—';
    addedDaysEl.textContent = '—';
    showError('Укажите количество дней (целое число).');
    return;
  }
  const startDate = parseDateInput(startDateStr);
  if (!startDate) {
    resultDateEl.textContent = '—';
    weekdayEl.textContent = '—';
    addedDaysEl.textContent = '—';
    showError('Неверный формат даты. Используйте ДД.ММ.ГГГГ.');
    return;
  }
  const resultDate = new Date(startDate.getTime() + days * MS_PER_DAY);
  resultDateEl.textContent = formatDateRuLong(resultDate);
  weekdayEl.textContent = getWeekdayName(resultDate);
  addedDaysEl.textContent = `${days > 0 ? '+' : ''}${days.toLocaleString('ru-RU')} дн.`;
  showSuccess(`Расчёт выполнен. Исходная дата: ${formatDateRuLong(startDate)}.`);
}

// ========== Календарь ==========
function getCalendarGrid(year, month) {
  const first = new Date(year, month, 1);
  let startWeekday = first.getDay();
  if (startWeekday === 0) startWeekday = 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 1; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function renderCalendar(side) {
  const col = document.querySelector(`.date-column[data-side="${side}"]`);
  if (!col) return;
  const view = state.views[side];
  const monthNameEl = col.querySelector('[data-role="month-name"]');
  const yearSelect = col.querySelector('[data-role="year-select"]');
  const daysGrid = col.querySelector('[data-role="days-grid"]');
  if (!view.year || view.month == null) {
    const baseDate = side === 'start' ? state.startDate || new Date() : state.endDate || new Date();
    view.year = baseDate.getFullYear();
    view.month = baseDate.getMonth();
  }
  monthNameEl.textContent = monthNames[view.month];
  const currentYear = new Date().getFullYear();
  if (yearSelect.options.length === 0) {
    const from = currentYear - 100;
    const to = currentYear + 100;
    for (let y = from; y <= to; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
  }
  yearSelect.value = String(view.year);
  daysGrid.innerHTML = '';
  const cells = getCalendarGrid(view.year, view.month);
  const selectedDate = side === 'start' ? state.startDate : state.endDate;
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  cells.forEach((day) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini-cal-day';
    if (day === null) {
      btn.classList.add('empty');
      btn.disabled = true;
      btn.textContent = '';
    } else {
      btn.textContent = day;
      const d = new Date(view.year, view.month, day);
      if (d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD) btn.classList.add('today');
      if (selectedDate && d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate()) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        if (side === 'start') {
          state.startDate = d;
          const input = document.querySelector('input[name="startInput"]');
          if (input) input.value = formatDate(d);
        } else {
          state.endDate = d;
          const input = document.querySelector('input[name="endInput"]');
          if (input) input.value = formatDate(d);
        }
        renderCalendar('start');
        renderCalendar('end');
        if (currentMode === 'diff') calculateDiffMode();
      });
    }
    daysGrid.appendChild(btn);
  });
}

function initCalendars() {
  const today = new Date();
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  state.startDate = yesterday;
  state.endDate = today;
  state.views.start.year = yesterday.getFullYear();
  state.views.start.month = yesterday.getMonth();
  state.views.end.year = today.getFullYear();
  state.views.end.month = today.getMonth();
  const startInput = document.querySelector('input[name="startInput"]');
  const endInput = document.querySelector('input[name="endInput"]');
  if (startInput) startInput.value = formatDate(yesterday);
  if (endInput) endInput.value = formatDate(today);
  renderCalendar('start');
  renderCalendar('end');
  ['start', 'end'].forEach((side) => {
    const col = document.querySelector(`.date-column[data-side="${side}"]`);
    if (!col) return;
    const yearSelect = col.querySelector('[data-role="year-select"]');
    const prevBtn = col.querySelector('.mini-cal-arrow[data-dir="prev"]');
    const nextBtn = col.querySelector('.mini-cal-arrow[data-dir="next"]');
    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        const view = state.views[side];
        view.year = parseInt(yearSelect.value, 10) || view.year;
        renderCalendar(side);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const view = state.views[side];
        if (view.month === 0) { view.month = 11; view.year -= 1; }
        else { view.month -= 1; }
        renderCalendar(side);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const view = state.views[side];
        if (view.month === 11) { view.month = 0; view.year += 1; }
        else { view.month += 1; }
        renderCalendar(side);
      });
    }
    const input = col.querySelector('.date-input');
    if (input) {
      input.addEventListener('blur', () => {
        const d = parseDateInput(input.value);
        if (!d) return;
        if (side === 'start') state.startDate = d;
        else state.endDate = d;
        state.views[side].year = d.getFullYear();
        state.views[side].month = d.getMonth();
        renderCalendar(side);
        if (currentMode === 'diff') calculateDiffMode();
      });
    }
  });
}

// ========== Переключение режимов ==========
function setMode(mode) {
  currentMode = mode;
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  modePanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.modePanel === mode);
  });
  if (mode === 'diff') {
    diffResultsDiv.style.display = 'block';
    addResultsDiv.style.display = 'none';
    calculateDiffMode();
  } else {
    diffResultsDiv.style.display = 'none';
    addResultsDiv.style.display = 'block';
    calculateAddMode();
  }
}

// ========== Обработчики событий ==========
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentMode === 'diff') calculateDiffMode();
    else calculateAddMode();
  });
}

if (includeEndCheckbox) {
  includeEndCheckbox.addEventListener('change', () => {
    if (currentMode === 'diff') calculateDiffMode();
  });
}

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });
});

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    resetAll();
  });
}

// ========== Запуск ==========
initCalendars();
initDateMasks();  // включаем маску ввода для всех полей даты
setMode('diff');