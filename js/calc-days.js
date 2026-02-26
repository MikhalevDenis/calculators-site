// Калькулятор дней между датами с мини-календарями

const form = document.getElementById('date-range-form');
const includeEndCheckbox = document.getElementById('include-end');

const totalDaysEl = document.getElementById('date-total-days');
const fullDaysEl = document.getElementById('date-full-days');
const fullWeeksEl = document.getElementById('date-full-weeks');
const fullMonthsEl = document.getElementById('date-full-months');
const fullYearsEl = document.getElementById('date-full-years');
const noteEl = document.getElementById('date-note');

// Состояние календарей
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const monthNames = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

const state = {
  startDate: null,
  endDate: null,
  views: {
    start: { year: null, month: null },
    end: { year: null, month: null }
  }
};

// Утилиты: парсинг и форматирование дат

function parseDateInput(str) {
  if (!str) return null;
  str = String(str).trim();

  // Поддержка формата ДД.ММ.ГГГГ
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    // Проверим, что дата корректная
    if (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) {
      return dt;
    }
    return null;
  }

  // Попытка распарсить ISO-формат (ГГГГ-ММ-ДД) или Date.parse
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) {
    return iso;
  }

  return null;
}

function formatDate(d) {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Разница в днях, с учётом включения последнего дня
function diffInDays(start, end, includeEnd) {
  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (includeEnd) {
    e = new Date(e.getTime() + MS_PER_DAY);
  }

  const diffMs = e - s;
  return diffMs / MS_PER_DAY;
}

// Полные месяцы и годы между датами (календарный подход)
function diffMonthsAndYears(start, end, includeEnd) {
  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (includeEnd) {
    e = new Date(e.getTime() + MS_PER_DAY);
  }

  let years = e.getFullYear() - s.getFullYear();
  let months = e.getMonth() - s.getMonth();
  let days = e.getDate() - s.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const fullYears = years;

  return { fullYears, fullMonths: totalMonths };
}

// Рендер мини-календаря

function getCalendarGrid(year, month) {
  // month: 0-11
  const first = new Date(year, month, 1);
  let startWeekday = first.getDay(); // 0 (Вс) - 6 (Сб)
  if (startWeekday === 0) startWeekday = 7; // делаем понедельник первым

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  // Пустые ячейки до первого дня месяца
  for (let i = 1; i < startWeekday; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  // дополним до кратности 7
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

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

  // Обновляем заголовок
  monthNameEl.textContent = monthNames[view.month];

  // Обновляем список годов (±100 лет от текущего)
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

  // Рисуем дни
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

      // Сегодня
      if (
        d.getFullYear() === todayY &&
        d.getMonth() === todayM &&
        d.getDate() === todayD
      ) {
        btn.classList.add('today');
      }

      // Выбранная дата
      if (
        selectedDate &&
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      ) {
        btn.classList.add('selected');
      }

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
        calculateAndRender();
      });
    }

    daysGrid.appendChild(btn);
  });
}

// Обновление результата

function calculateAndRender() {
  const includeEnd = includeEndCheckbox && includeEndCheckbox.checked;

  if (!state.startDate || !state.endDate) {
    totalDaysEl.textContent = '—';
    fullDaysEl.textContent = '—';
    fullWeeksEl.textContent = '—';
    fullMonthsEl.textContent = '—';
    fullYearsEl.textContent = '—';
    noteEl.textContent = 'Выберите обе даты.';
    noteEl.classList.remove('error');
    return;
  }

  // Упорядочим даты: start <= end
  let s = state.startDate;
  let e = state.endDate;
  if (s > e) {
    const tmp = s;
    s = e;
    e = tmp;
  }

  const daysFloat = diffInDays(s, e, includeEnd);
  const totalDays = Math.floor(daysFloat);

  // Иерархическое разложение:
  // сначала полные годы, потом месяцы, потом недели, потом оставшиеся дни.
  let remaining = totalDays;

  const years = Math.floor(remaining / 365);
  remaining = remaining % 365;

  const months = Math.floor(remaining / 30);
  remaining = remaining % 30;

  const weeks = Math.floor(remaining / 7);
  remaining = remaining % 7;

  const days = remaining;

  totalDaysEl.textContent = totalDays.toLocaleString('ru-RU');
  fullYearsEl.textContent = years.toLocaleString('ru-RU');
  fullMonthsEl.textContent = months.toLocaleString('ru-RU');
  fullWeeksEl.textContent = weeks.toLocaleString('ru-RU');
  fullDaysEl.textContent = days.toLocaleString('ru-RU');

  noteEl.textContent =
    'Преобразование в годы, месяцы и недели носит приближённый характер (1 год = 365 дней, 1 месяц = 30 дней, 1 неделя = 7 дней).';
  noteEl.classList.remove('error');
}

// Обработчики формы и инпутов

if (form) {
  // Обновление при изменении чекбокса "учитывать последний день"
  if (includeEndCheckbox) {
    includeEndCheckbox.addEventListener('change', () => {
      calculateAndRender();
    });
  }

  // Реакция на изменение года или стрелок календаря
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
        if (view.month === 0) {
          view.month = 11;
          view.year -= 1;
        } else {
          view.month -= 1;
        }
        renderCalendar(side);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const view = state.views[side];
        if (view.month === 11) {
          view.month = 0;
          view.year += 1;
        } else {
          view.month += 1;
        }
        renderCalendar(side);
      });
    }

    // При выходе из поля ввода — парсим дату и обновляем календарь
    const input = col.querySelector('.date-input');
    if (input) {
      input.addEventListener('blur', () => {
        const d = parseDateInput(input.value);
        if (!d) return;

        if (side === 'start') {
          state.startDate = d;
        } else {
          state.endDate = d;
        }
        state.views[side].year = d.getFullYear();
        state.views[side].month = d.getMonth();
        renderCalendar(side);
        calculateAndRender();
      });
    }
  });

  // Инициализация: сегодняшняя дата как конец, вчера как начало
  const today = new Date();
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  state.startDate = yesterday;
  state.endDate = today;
  state.views.start.year = yesterday.getFullYear();
  state.views.start.month = yesterday.getMonth();
  state.views.end.year = today.getFullYear();
  state.views.end.month = today.getMonth();

  const startInput = form.elements['startInput'];
  const endInput = form.elements['endInput'];
  if (startInput) startInput.value = formatDate(yesterday);
  if (endInput) endInput.value = formatDate(today);

  renderCalendar('start');
  renderCalendar('end');
  calculateAndRender();
}