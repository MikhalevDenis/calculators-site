// Инженерный калькулятор
// Парсер выражений (shunting-yard), тригонометрия DEG/RAD, история, клавиатура, вставка

(function() {
  'use strict';

  // ---------- DOM ----------
  const expressionEl = document.getElementById('sci-expression');
  const resultEl = document.getElementById('sci-result');
  const historyListEl = document.getElementById('scientific-history-list');
  const historyContainer = document.getElementById('scientific-history');
  const historyToggle = document.getElementById('history-toggle');
  const grid = document.querySelector('.scientific-grid');
  const modeBtns = document.querySelectorAll('.scientific-mode-btn');

  if (!expressionEl || !resultEl || !grid) return;

  // ---------- Состояние ----------
  let expression = '';           // текущее выражение в виде строки
  let justEvaluated = false;     // флаг, что только что был вычислен результат
  let angleMode = 'deg';         // 'deg' или 'rad'
  let history = [];

  // Загружаем историю из localStorage
  try {
    const saved = localStorage.getItem('sci-history');
    if (saved) history = JSON.parse(saved);
  } catch (e) { /* ignore */ }

  // ---------- Отображение ----------
  function updateDisplay() {
    if (expression === '') {
      expressionEl.textContent = '0';
    } else {
      expressionEl.textContent = expression;
    }
    // Очищаем строку результата при вводе
    if (!justEvaluated) {
      resultEl.textContent = '';
    }
  }

  function showResult(value) {
    resultEl.textContent = '= ' + value;
    justEvaluated = true;
  }

  function showError(message) {
    resultEl.textContent = message;
    justEvaluated = true;
  }

  // ---------- Форматирование чисел ----------
  function formatNumber(num) {
    if (!isFinite(num)) return 'Ошибка';
    // Округляем до 12 значащих цифр, убираем лишние нули
    let s = num.toPrecision(12);
    // Если есть экспоненциальная часть и она не нужна — убираем
    if (s.includes('e')) {
      // Оставляем как есть для очень больших/маленьких чисел
    } else {
      // Убираем конечные нули после десятичной точки
      s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }
    // Заменяем точку на запятую для русского формата? Нет, оставим точку для совместимости с вводом
    return s;
  }

  // ---------- История ----------
  function saveHistory() {
    try {
      localStorage.setItem('sci-history', JSON.stringify(history.slice(-20)));
    } catch (e) { /* ignore */ }
  }

  function addToHistory(expr, res) {
    history.push({ expr, res, time: Date.now() });
    if (history.length > 20) history.shift();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';
    if (history.length === 0) {
      historyListEl.innerHTML = '<div class="sci-history-empty">Пока нет вычислений</div>';
      return;
    }
    // Показываем последние 20 в обратном порядке
    const items = history.slice().reverse();
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'sci-history-row';
      row.innerHTML = `<span class="sci-history-expr">${escapeHtml(item.expr)}</span> = <span class="sci-history-res">${escapeHtml(item.res)}</span>`;
      row.addEventListener('click', () => {
        // При клике на историю подставляем выражение
        expression = item.expr;
        justEvaluated = false;
        updateDisplay();
        resultEl.textContent = '';
        expressionEl.focus();
      });
      historyListEl.appendChild(row);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- Переключение режима DEG/RAD ----------
  function setAngleMode(mode) {
    angleMode = mode;
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setAngleMode(btn.dataset.mode);
    });
  });

  // ---------- Парсер выражений (shunting-yard) ----------
  // Токенизация
  function tokenize(str) {
    const tokens = [];
    let i = 0;
    const s = str.replace(/\s+/g, '');
    while (i < s.length) {
      const ch = s[i];

      // Числа
      if (/[0-9.]/.test(ch)) {
        let numStr = '';
        while (i < s.length && /[0-9.]/.test(s[i])) {
          numStr += s[i];
          i++;
        }
        // Проверка на несколько точек
        if ((numStr.match(/\./g) || []).length > 1) {
          throw new Error('Некорректное число');
        }
        tokens.push({ type: 'number', value: parseFloat(numStr) });
        continue;
      }

      // Буквы (функции и константы)
      if (/[a-zA-Z]/.test(ch)) {
        let name = '';
        while (i < s.length && /[a-zA-Z]/.test(s[i])) {
          name += s[i];
          i++;
        }
        const lower = name.toLowerCase();
        // Проверяем известные функции и константы
        if (['sin','cos','tan','asin','acos','atan','log','ln','sqrt','cbrt','exp','abs','fact'].includes(lower)) {
          tokens.push({ type: 'function', value: lower });
        } else if (lower === 'pi') {
          tokens.push({ type: 'number', value: Math.PI });
        } else if (lower === 'e') {
          tokens.push({ type: 'number', value: Math.E });
        } else {
          throw new Error('Неизвестная функция: ' + name);
        }
        continue;
      }

      // Операторы и скобки
      if ('+-*/^%()'.includes(ch)) {
        // Унарный минус обрабатывается позже
        tokens.push({ type: 'operator', value: ch });
        i++;
        continue;
      }

      // Неизвестный символ
      throw new Error('Недопустимый символ: ' + ch);
    }
    return tokens;
  }

  // Приоритеты операторов
  const PRECEDENCE = {
    '+': 1, '-': 1,
    '*': 2, '/': 2, '%': 2,
    '^': 3,
    'u-': 4, // унарный минус
    'u+': 4
  };

  const RIGHT_ASSOC = { '^': true, 'u-': true, 'u+': true };

  // Преобразование в обратную польскую запись (RPN)
  function toRPN(tokens) {
    const output = [];
    const stack = [];
    let prevType = null;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      if (t.type === 'number') {
        output.push(t);
        prevType = 'number';
      } else if (t.type === 'function') {
        stack.push(t);
        prevType = 'function';
      } else if (t.type === 'operator') {
        const op = t.value;

        // Определяем унарность
        let isUnary = false;
        if ((op === '-' || op === '+') && (prevType === null || prevType === 'operator' || prevType === '(')) {
          isUnary = true;
        }

        if (isUnary) {
          const uOp = { type: 'operator', value: 'u' + op };
          // Унарный оператор имеет высокий приоритет
          while (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top.type === 'function') {
              output.push(stack.pop());
            } else if (top.type === 'operator') {
              const topPrec = PRECEDENCE[top.value] || 0;
              const curPrec = PRECEDENCE[uOp.value];
              if (topPrec >= curPrec) {
                output.push(stack.pop());
              } else break;
            } else break;
          }
          stack.push(uOp);
          prevType = 'operator';
        } else if (op === '(') {
          stack.push(t);
          prevType = '(';
        } else if (op === ')') {
          let found = false;
          while (stack.length > 0) {
            const top = stack.pop();
            if (top.value === '(') {
              found = true;
              break;
            }
            output.push(top);
          }
          if (!found) throw new Error('Несбалансированные скобки');
          // Если на вершине функция — выталкиваем
          if (stack.length > 0 && stack[stack.length - 1].type === 'function') {
            output.push(stack.pop());
          }
          prevType = ')';
        } else {
          // Бинарный оператор
          const curPrec = PRECEDENCE[op] || 0;
          while (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top.type === 'function') {
              output.push(stack.pop());
            } else if (top.type === 'operator') {
              const topPrec = PRECEDENCE[top.value] || 0;
              const rightAssoc = RIGHT_ASSOC[op] || false;
              if ((!rightAssoc && topPrec >= curPrec) || (rightAssoc && topPrec > curPrec)) {
                output.push(stack.pop());
              } else break;
            } else break;
          }
          stack.push(t);
          prevType = 'operator';
        }
      }
    }

    while (stack.length > 0) {
      const top = stack.pop();
      if (top.value === '(') throw new Error('Несбалансированные скобки');
      output.push(top);
    }

    return output;
  }

  // Вычисление RPN
  function evalRPN(rpn) {
    const stack = [];

    for (const t of rpn) {
      if (t.type === 'number') {
        stack.push(t.value);
      } else if (t.type === 'operator') {
        const op = t.value;
        if (op === 'u-') {
          if (stack.length < 1) throw new Error('Недостаточно операндов');
          stack.push(-stack.pop());
        } else if (op === 'u+') {
          if (stack.length < 1) throw new Error('Недостаточно операндов');
          stack.push(+stack.pop());
        } else {
          if (stack.length < 2) throw new Error('Недостаточно операндов');
          const b = stack.pop();
          const a = stack.pop();
          switch (op) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/':
              if (b === 0) throw new Error('Деление на ноль');
              stack.push(a / b); break;
            case '^': stack.push(Math.pow(a, b)); break;
            case '%': stack.push(a % b); break;
            default: throw new Error('Неизвестный оператор');
          }
        }
      } else if (t.type === 'function') {
        if (stack.length < 1) throw new Error('Недостаточно операндов для функции');
        const x = stack.pop();
        const fn = t.value;
        let res;
        switch (fn) {
          case 'sin': res = Math.sin(angleMode === 'deg' ? x * Math.PI / 180 : x); break;
          case 'cos': res = Math.cos(angleMode === 'deg' ? x * Math.PI / 180 : x); break;
          case 'tan': res = Math.tan(angleMode === 'deg' ? x * Math.PI / 180 : x); break;
          case 'asin': {
            if (x < -1 || x > 1) throw new Error('asin: область определения [-1, 1]');
            res = Math.asin(x);
            if (angleMode === 'deg') res = res * 180 / Math.PI;
            break;
          }
          case 'acos': {
            if (x < -1 || x > 1) throw new Error('acos: область определения [-1, 1]');
            res = Math.acos(x);
            if (angleMode === 'deg') res = res * 180 / Math.PI;
            break;
          }
          case 'atan': {
            res = Math.atan(x);
            if (angleMode === 'deg') res = res * 180 / Math.PI;
            break;
          }
          case 'log':
            if (x <= 0) throw new Error('log: аргумент должен быть > 0');
            res = Math.log10(x);
            break;
          case 'ln':
            if (x <= 0) throw new Error('ln: аргумент должен быть > 0');
            res = Math.log(x);
            break;
          case 'sqrt':
            if (x < 0) throw new Error('√: аргумент не может быть отрицательным');
            res = Math.sqrt(x);
            break;
          case 'cbrt': res = Math.cbrt(x); break;
          case 'exp': res = Math.exp(x); break;
          case 'abs': res = Math.abs(x); break;
          case 'fact':
            if (x < 0 || !Number.isInteger(x)) throw new Error('Факториал определён для неотрицательных целых чисел');
            res = 1;
            for (let i = 2; i <= x; i++) res *= i;
            break;
          default:
            throw new Error('Неизвестная функция');
        }
        stack.push(res);
      }
    }

    if (stack.length !== 1) throw new Error('Некорректное выражение');
    return stack[0];
  }

  // Основная функция вычисления
  function evaluate(expr) {
    if (!expr.trim()) return null;
    const tokens = tokenize(expr);
    const rpn = toRPN(tokens);
    const result = evalRPN(rpn);
    return result;
  }

  // ---------- Обработка ввода ----------
  function insertText(text) {
    // Если была нажата "=", начинаем новое выражение (если не оператор)
    if (justEvaluated) {
      if (/[+\-*/^%]/.test(text)) {
        // Продолжаем с результатом
        justEvaluated = false;
      } else {
        // Начинаем заново
        expression = '';
        justEvaluated = false;
        resultEl.textContent = '';
      }
    }
    expression += text;
    updateDisplay();
    // Прокручиваем дисплей вправо
    expressionEl.scrollLeft = expressionEl.scrollWidth;
  }

  function handleDigit(d) {
    insertText(d);
  }

  function handleDot() {
    // Не даём поставить две точки в одном числе
    if (justEvaluated) {
      expression = '0.';
      justEvaluated = false;
      resultEl.textContent = '';
      updateDisplay();
      return;
    }
    const parts = expression.split(/[+\-*/^%()]/);
    const last = parts[parts.length - 1];
    if (last.includes('.')) return;
    if (last === '' || last === ')') {
      insertText('0.');
    } else {
      insertText('.');
    }
  }

  function handleOperator(op) {
    if (justEvaluated) {
      // Используем результат как начало нового выражения
      justEvaluated = false;
      resultEl.textContent = '';
      // expression уже содержит результат
    }
    // Если в конце уже оператор — заменяем
    const last = expression.slice(-1);
    if ('+-*/^%'.includes(last)) {
      // Унарный минус после оператора оставляем
      if (op === '-' && last !== '-') {
        expression += op;
      } else {
        expression = expression.slice(0, -1) + op;
      }
    } else {
      expression += op;
    }
    updateDisplay();
    expressionEl.scrollLeft = expressionEl.scrollWidth;
  }

  function handleFunction(fn) {
    if (justEvaluated) {
      expression = '';
      justEvaluated = false;
      resultEl.textContent = '';
    }
    // Добавляем функцию и открываем скобку
    if (/[0-9)]$/.test(expression)) {
      expression += '*';
    }
    expression += fn + '(';
    updateDisplay();
    expressionEl.scrollLeft = expressionEl.scrollWidth;
  }

  function handleConst(c) {
    if (justEvaluated) {
      expression = '';
      justEvaluated = false;
      resultEl.textContent = '';
    }
    if (/[0-9)]$/.test(expression)) {
      expression += '*';
    }
    expression += c;
    updateDisplay();
    expressionEl.scrollLeft = expressionEl.scrollWidth;
  }

  function handleParen() {
    if (justEvaluated) {
      expression = '';
      justEvaluated = false;
      resultEl.textContent = '';
    }
    const open = (expression.match(/\(/g) || []).length;
    const close = (expression.match(/\)/g) || []).length;
    const last = expression.slice(-1);

    if (open > close && /[0-9)]$/.test(last)) {
      // Закрываем скобку
      expression += ')';
    } else {
      // Открываем скобку
      if (/[0-9)]$/.test(expression)) {
        expression += '*(';
      } else {
        expression += '(';
      }
    }
    updateDisplay();
    expressionEl.scrollLeft = expressionEl.scrollWidth;
  }

  function handlePlusMinus() {
    if (justEvaluated) {
      justEvaluated = false;
      resultEl.textContent = '';
    }
    // Ищем последнее число
    const match = expression.match(/(-?\d*\.?\d+)$/);
    if (match) {
      const num = match[0];
      const start = match.index;
      if (num.startsWith('-')) {
        expression = expression.slice(0, start) + num.slice(1);
      } else {
        expression = expression.slice(0, start) + '-' + num;
      }
    } else {
      // Если нет числа в конце, добавляем минус перед скобкой или в начало
      if (expression === '') {
        expression = '-';
      } else if (/[+\-*/^(]$/.test(expression.slice(-1))) {
        expression += '-';
      } else {
        expression += '-';
      }
    }
    updateDisplay();
  }

  function handlePercent() {
    // Добавляем % как оператор (остаток от деления)
    insertText('%');
  }

  function handleClear() {
    expression = '';
    justEvaluated = false;
    resultEl.textContent = '';
    updateDisplay();
    expressionEl.scrollLeft = 0;
  }

  function handleBackspace() {
    if (justEvaluated) {
      justEvaluated = false;
      resultEl.textContent = '';
      // Не удаляем результат сразу, можно оставить, но лучше очистить
      return;
    }
    if (expression.length > 0) {
      expression = expression.slice(0, -1);
      updateDisplay();
    }
  }

  function handleEquals() {
    if (!expression.trim()) return;
    try {
      const result = evaluate(expression);
      if (result === null) return;
      const formatted = formatNumber(result);
      showResult(formatted);
      addToHistory(expression, formatted);
      // Обновляем выражение на результат, чтобы можно было продолжать
      expression = formatted;
      // justEvaluated = true остаётся, чтобы следующая цифра начала новое выражение
    } catch (e) {
      showError(e.message || 'Ошибка');
      justEvaluated = true;
      expression = '';
    }
  }

  // ---------- Делегирование кликов по сетке ----------
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Убираем фокус с кнопки
    btn.blur();

    if (btn.dataset.digit !== undefined) {
      handleDigit(btn.dataset.digit);
    } else if (btn.dataset.action) {
      const action = btn.dataset.action;
      switch (action) {
        case 'dot': handleDot(); break;
        case 'clear': handleClear(); break;
        case 'backspace': handleBackspace(); break;
        case 'paren': handleParen(); break;
        case 'plusminus': handlePlusMinus(); break;
        case 'percent': handlePercent(); break;
        case 'equals': handleEquals(); break;
      }
    } else if (btn.dataset.op) {
      handleOperator(btn.dataset.op);
    } else if (btn.dataset.func) {
      handleFunction(btn.dataset.func);
    } else if (btn.dataset.const) {
      handleConst(btn.dataset.const);
    }
  });

  // ---------- Клавиатура ----------
  document.addEventListener('keydown', (e) => {
    // Не перехватываем, если фокус в поле ввода или textarea
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
      return;
    }

    let handled = true;

    if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '^' || e.key === '%') {
      handleOperator(e.key);
    } else if (e.key === '.') {
      handleDot();
    } else if (e.key === '(' || e.key === ')') {
      handleParen();
    } else if (e.key === 'Enter' || e.key === '=') {
      handleEquals();
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Escape' || e.key === 'Delete') {
      handleClear();
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
    }
  });

  // ---------- Вставка из буфера обмена ----------
  document.addEventListener('paste', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    // Очищаем: убираем пробелы, заменяем запятые на точки
    text = text.replace(/\s/g, '').replace(/,/g, '.');
    // Оставляем только цифры, точки и операторы
    if (!/^[0-9.+\-*/^%()a-zA-Z]+$/.test(text)) {
      // Если есть посторонние символы — попробуем выделить число
      const numMatch = text.match(/-?\d*\.?\d+/);
      if (numMatch) {
        text = numMatch[0];
      } else {
        return;
      }
    }
    // Вставляем посимвольно, чтобы обработать все правила
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch >= '0' && ch <= '9') handleDigit(ch);
      else if (ch === '.') handleDot();
      else if ('+-*/^%'.includes(ch)) handleOperator(ch);
      else if (ch === '(' || ch === ')') handleParen();
      else if (/[a-zA-Z]/.test(ch)) {
        // Собираем имя функции
        let name = ch;
        while (i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
          name += text[i + 1];
          i++;
        }
        const lower = name.toLowerCase();
        if (['sin','cos','tan','asin','acos','atan','log','ln','sqrt','cbrt','exp','abs','fact'].includes(lower)) {
          handleFunction(lower);
        } else if (lower === 'pi') {
          handleConst('π');
        } else if (lower === 'e') {
          handleConst('e');
        }
      }
    }
  });

  // ---------- Кнопка истории ----------
  if (historyToggle && historyContainer) {
    historyToggle.addEventListener('click', () => {
      const isVisible = historyContainer.style.display !== 'none';
      historyContainer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) renderHistory();
    });
  }

  // ---------- Инициализация ----------
  setAngleMode('deg');
  updateDisplay();
  renderHistory();

})();