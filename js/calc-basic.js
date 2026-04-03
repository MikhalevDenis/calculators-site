const displayEl = document.getElementById('calc-display');
const gridEl = document.querySelector('.calc-grid');

let expression = '0';       // строка с выражением
let justEvaluated = false;  // флаг: только что нажали "="

// обновляем экран
function updateDisplay() {
  displayEl.textContent = expression;
}

// обработка кликов по кнопкам
gridEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const action = btn.dataset.action;
  const value = btn.dataset.value;

  switch (action) {
    case 'digit':
      handleDigit(value);
      break;
    case 'dot':
      handleDot();
      break;
    case 'operator':
      handleOperator(value);
      break;
    case 'clear':
      handleClear();
      break;
    case 'backspace':
      handleBackspace();
      break;
    case 'plusminus':
      handlePlusMinus();
      break;
    case 'percent':
      handlePercent();
      break;
    case 'paren':
      handleParenthesis();
      break;
    case 'equals':
      handleEquals();
      break;
  }

  updateDisplay();
});

function handleDigit(d) {
  if (expression === '0' || expression === 'Ошибка' || justEvaluated) {
    expression = d;
    justEvaluated = false;
  } else {
    expression += d;
  }
}

function handleDot() {
  if (expression === 'Ошибка') {
    expression = '0.';
    justEvaluated = false;
    return;
  }

  // не даём ставить две точки в одном числе
  const parts = expression.split(/[\+\-\*\/\(\)]/);
  const last = parts[parts.length - 1];
  if (!last.includes('.')) {
    if (justEvaluated) {
      expression = '0.';
      justEvaluated = false;
    } else {
      expression += '.';
    }
  }
}

function handleOperator(op) {
  if (expression === 'Ошибка') return;

  const lastChar = expression[expression.length - 1];

  // заменяем последний оператор, если он уже есть
  if ('+-*/'.includes(lastChar)) {
    expression = expression.slice(0, -1) + op;
  } else {
    if (justEvaluated) justEvaluated = false;
    expression += op;
  }
}

function handleClear() {
  expression = '0';
  justEvaluated = false;
}

function handleBackspace() {
  if (expression === 'Ошибка') {
    expression = '0';
    justEvaluated = false;
    return;
  }
  if (expression.length === 1) {
    expression = '0';
  } else {
    expression = expression.slice(0, -1);
  }
  justEvaluated = false;
}

function handlePlusMinus() {
  if (expression === 'Ошибка') return;

  const match = expression.match(/(-?\d+(\.\d+)?)$/);
  if (match) {
    const num = match[0];
    const start = match.index;
    const toggled = num.startsWith('-') ? num.slice(1) : '-' + num;
    expression = expression.slice(0, start) + toggled;
  } else if (expression === '0') {
    expression = '-0';
  }
}

function handlePercent() {
  if (expression === 'Ошибка') return;

  const match = expression.match(/(\d+(\.\d+)?)$/);
  if (match) {
    const num = parseFloat(match[0]);
    const start = match.index;
    const res = num / 100;
    expression = expression.slice(0, start) + res;
  }
}

function handleParenthesis() {
  if (expression === 'Ошибка') {
    expression = '(';
    justEvaluated = false;
    return;
  }

  const open = (expression.match(/\(/g) || []).length;
  const close = (expression.match(/\)/g) || []).length;

  if (open > close && /[\d\)]$/.test(expression)) {
    // закрываем скобку
    expression += ')';
  } else {
    // открываем скобку
    if (expression === '0' || justEvaluated) {
      expression = '(';
      justEvaluated = false;
    } else {
      // если перед скобкой число или ")", добавим неявное умножение
      if (/[\d\)]$/.test(expression)) expression += '*(';
      else expression += '(';
    }
  }
}

function handleEquals() {
  if (expression === 'Ошибка') return;

  try {
    // Проверка на опасные символы (только математические)
    if (/[^0-9+\-*/%(). ]/i.test(expression)) {
      throw new Error('Недопустимые символы');
    }
    // Используем Function вместо eval для большей безопасности
    const result = new Function('return (' + expression + ')')();
    expression = String(result);
    justEvaluated = true;
  } catch (err) {
    expression = 'Ошибка';
    justEvaluated = true;
  }
}

// начальный вывод
updateDisplay();