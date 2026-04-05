// Калькулятор дней
// Режим "Разница между датами" — только календарь
// Режим "Прибавить/вычесть дни" — поле даты с маской ДД.ММ.ГГГГ

const form = document.getElementById('date-range-form');
const includeEndCheckbox = document.getElementById('include-end');
const clearBtn = document.getElementById('date-clear-btn');

const modeBtns = document.querySelectorAll('.date-mode-btn');
const modePanels = document.querySelectorAll('.date-mode-panel');
const diffResultsDiv = document.getElementById('date-diff-results');
const addResultsDiv = document.getElementById('date-add-results');

const totalDaysEl = document.getElementById('date-total-days');
const fullDaysEl = document.getElementById('date-full-days');
const fullMonthsEl = document.getElementById('date-full-months');
const fullYearsEl = document.getElementById('date-full-years');
const noteEl = document.getElementById('date-note');

const resultDateEl = document.getElementById('date-result-date');
const weekdayEl = document.getElementById('date-weekday');
const addedDaysEl = document.getElementById('date-added-days');

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const weekdayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

let currentMode = 'diff';

const state = {
  startDate: null,
  endDate: null,
  views: { start: { year: null, month: null }, end: { year: null, month: null } }
};

// ========== Маска ввода для даты (ДД.ММ.ГГГГ) ==========
function applyDateMask(input) {
  // Получаем текущее значение и удаляем всё, кроме цифр
  let raw = input.value.replace(/[^\d]/g, '');
  
  // Ограничиваем длину (максимум 8 цифр)
  if (raw.length > 8) raw = raw.slice(0, 8);
  
  // Форматируем с точками
  let formatted = '';
  if (raw.length >= 1) formatted += raw.slice(0, 2);
  if (raw.length >= 3) formatted += '.' + raw.slice(2, 4);
  if (raw.length >= 5) formatted += '.' + raw.slice(4, 8);
  
  // Запоминаем старую длину и новую длину для определения позиции курсора
  const oldLen = input.value.length;
  const newLen = formatted.length;
  
  // Если значение изменилось
  if (input.value !== formatted) {
    // Запоминаем позицию курсора до изменения
    const cursorPos = input.selectionStart;
    
    input.value = formatted;
    
    // Корректируем позицию курсора
    let newCursorPos = cursorPos;
    
    // Если добавлялась точка, сдвигаем курсор на 1
    if (newLen > oldLen && (cursorPos === 2 || cursorPos === 5)) {
      newCursorPos = cursorPos + 1;
    }
    // Если удалялась точка, сдвигаем курсор назад
    else if (newLen < oldLen && (cursorPos === 3 || cursorPos === 6)) {
      newCursorPos = cursorPos - 1;
    }
    // Если курсор был в конце, ставим в конец
    if (cursorPos >= oldLen) {
      newCursorPos = newLen;
    }
    
    try {
      input.setSelectionRange(newCursorPos, newCursorPos);
    } catch(e) { /* игнорируем ошибки позиционирования */ }
  }
}

function initDateMask() {
  const dateInput = document.getElementById('add-start-date');
  if (dateInput) {
    // Убираем автозаполнение
    dateInput.setAttribute('autocomplete', 'off');
    
    // Обработчик ввода
    dateInput.addEventListener('input', function(e) {
      applyDateMask(this);
    });
    
    // Обработчик для предотвращения вставки из буфера обмена без форматирования
    dateInput.addEventListener('paste', function(e) {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const digits = pasted.replace(/[^\d]/g, '').slice(0, 8);
      if (digits) {
        this.value = digits;
        applyDateMask(this);
      }
    });
  }
}

function initDateMask() {
  const dateInput = document.getElementById('add-start-date');
  if (dateInput) {
    dateInput.addEventListener('input', function() {
      applyDateMask(this);
    });
    // Убираем автозаполнение, чтобы не мешало
    dateInput.setAttribute('autocomplete', 'off');
  }
}

// ========== Утилиты ==========
function parseDateInput(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    if (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) return dt;
    return null;
  }
  return null;
}

function formatDate(d) {
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatDateRuLong(d) {
  if (!d) return '—';
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function getWeekdayName(d) {
  if (!d) return '—';
  return weekdayNames[d.getDay()];
}

function showError(message) { noteEl.textContent = message; noteEl.classList.add('error'); }
function showSuccess(message) { noteEl.textContent = message; noteEl.classList.remove('error'); }

// ========== Точный расчёт разницы ==========
function addYears(date, years) { return new Date(date.getFullYear() + years, date.getMonth(), date.getDate()); }
function addMonths(date, months) {
  const newDate = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  if (newDate.getDate() !== date.getDate()) newDate.setDate(0);
  return newDate;
}

function preciseDateDiff(start, end, includeEnd) {
  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (includeEnd) e = new Date(e.getTime() + MS_PER_DAY);
  if (s > e) { const tmp = s; s = e; e = tmp; }
  
  const totalDays = Math.round((e - s) / MS_PER_DAY);
  let years = 0, tempDate = new Date(s), nextYearDate = addYears(tempDate, 1);
  while (nextYearDate <= e) { years++; tempDate = nextYearDate; nextYearDate = addYears(tempDate, 1); }
  
  let months = 0, nextMonthDate = addMonths(tempDate, 1);
  while (nextMonthDate <= e) { months++; tempDate = nextMonthDate; nextMonthDate = addMonths(tempDate, 1); }
  
  const days = Math.round((e - tempDate) / MS_PER_DAY);
  return { totalDays, years, months, days };
}

function calculateDiffMode() {
  if (!state.startDate || !state.endDate) {
    showError('Выберите обе даты в календаре.');
    return;
  }
  const includeEnd = includeEndCheckbox && includeEndCheckbox.checked;
  const { totalDays, years, months, days } = preciseDateDiff(state.startDate, state.endDate, includeEnd);
  totalDaysEl.textContent = totalDays.toLocaleString('ru-RU');
  fullYearsEl.textContent = years.toLocaleString('ru-RU');
  fullMonthsEl.textContent = months.toLocaleString('ru-RU');
  fullDaysEl.textContent = days.toLocaleString('ru-RU');
  showSuccess('Расчёт выполнен с учётом точной календарной разницы.');
}

// ========== Режим прибавления дней ==========
function calculateAddMode() {
  const dateInput = document.getElementById('add-start-date');
  const daysInput = document.getElementById('add-days');
  if (!dateInput || !daysInput) return;
  
  const dateStr = dateInput.value.trim();
  const days = parseInt(daysInput.value, 10);
  
  if (!dateStr) {
    showError('Укажите исходную дату в формате ДД.ММ.ГГГГ');
    return;
  }
  if (isNaN(days)) {
    showError('Укажите количество дней (целое число).');
    return;
  }
  
  const startDate = parseDateInput(dateStr);
  if (!startDate) {
    showError('Неверный формат даты. Используйте ДД.ММ.ГГГГ, например 15.04.2026');
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
    for (let y = currentYear - 100; y <= currentYear + 100; y++) {
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
          state.views.start.year = d.getFullYear();
          state.views.start.month = d.getMonth();
        } else {
          state.endDate = d;
          state.views.end.year = d.getFullYear();
          state.views.end.month = d.getMonth();
        }
        renderCalendar('start');
        renderCalendar('end');
        calculateDiffMode();
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
  });
  calculateDiffMode();
}

function resetAll() {
  if (currentMode === 'diff') {
    const today = new Date();
    const yesterday = new Date(today.getTime() - MS_PER_DAY);
    state.startDate = yesterday;
    state.endDate = today;
    state.views.start.year = yesterday.getFullYear();
    state.views.start.month = yesterday.getMonth();
    state.views.end.year = today.getFullYear();
    state.views.end.month = today.getMonth();
    renderCalendar('start');
    renderCalendar('end');
    calculateDiffMode();
  } else {
    const dateInput = document.getElementById('add-start-date');
    const daysInput = document.getElementById('add-days');
    if (dateInput) dateInput.value = '';
    if (daysInput) daysInput.value = '';
    resultDateEl.textContent = '—';
    weekdayEl.textContent = '—';
    addedDaysEl.textContent = '—';
    showSuccess('Поля очищены. Введите данные и нажмите «Рассчитать».');
  }
}

function setMode(mode) {
  currentMode = mode;
  modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  modePanels.forEach(panel => panel.classList.toggle('active', panel.dataset.modePanel === mode));
  if (mode === 'diff') {
    diffResultsDiv.style.display = 'block';
    addResultsDiv.style.display = 'none';
    calculateDiffMode();
  } else {
    diffResultsDiv.style.display = 'none';
    addResultsDiv.style.display = 'block';
  }
}

// ========== Обработчики ==========
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentMode === 'diff') calculateDiffMode();
    else calculateAddMode();
  });
}
if (includeEndCheckbox) includeEndCheckbox.addEventListener('change', () => { if (currentMode === 'diff') calculateDiffMode(); });
modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
if (clearBtn) clearBtn.addEventListener('click', resetAll);

// ========== Запуск ==========
initCalendars();
initDateMask();  // Включаем маску для поля даты
setMode('diff');