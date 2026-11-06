// Обычный калькулятор с историей вычислений, клавиатурой и вставкой

const displayEl = document.getElementById('calc-display');
const gridEl = document.querySelector('.calc-grid');
const historyContainer = document.getElementById('basic-history');
const historyListEl = document.getElementById('basic-history-list');
const historyToggle = document.getElementById('basic-history-toggle');
const historyClearBtn = document.getElementById('basic-history-clear');

let expression = '0';
let justEvaluated = false;
let history = [];

// Загружаем историю из localStorage
try {
  const saved = localStorage.getItem('basic-calc-history');
  if (saved) history = JSON.parse(saved);
} catch (e) { /* ignore */ }

function updateDisplay() {
  displayEl.textContent = expression;
}

// ========== ИСТОРИЯ ==========
function saveHistory() {
  try {
    localStorage.setItem('basic-calc-history', JSON.stringify(history.slice(-20)));
  } catch (e) { /* ignore */ }
}

function addToHistory(expr, res) {
  history.push({ expr, res });
  if (history.length > 20) history.shift();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (!historyListEl) return;
  historyListEl.innerHTML = '';
  if (history.length === 0) {
    historyListEl.innerHTML = '<div class="calc-history-empty">Пока нет вычислений</div>';
    return;
  }
  history.slice().reverse().forEach(item => {
    const row = document.createElement('div');
    row.className = 'calc-history-row';
    row.innerHTML = `<span class="calc-history-expr">${escapeHtml(item.expr)}</span> = <span class="calc-history-res">${escapeHtml(item.res)}</span>`;
    row.addEventListener('click', () => {
      // Подставляем результат как новое выражение
      expression = item.res;
      justEvaluated = false;
      updateDisplay();
      if (historyContainer) historyContainer.style.display = 'none';
    });
    historyListEl.appendChild(row);
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (historyToggle && historyContainer) {
  historyToggle.addEventListener('click', () => {
    const isVisible = historyContainer.style.display !== 'none';
    historyContainer.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) renderHistory();
  });
}

if (historyClearBtn) {
  historyClearBtn.addEventListener('click', () => {
    history = [];
    saveHistory();
    renderHistory();
  });
}

// ========== ЛОГИКА КАЛЬКУЛЯТОРА ==========
gridEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const value = btn.dataset.value;

  switch (action) {
    case 'digit': handleDigit(value); break;
    case 'dot': handleDot(); break;
    case 'operator': handleOperator(value); break;
    case 'clear': handleClear(); break;
    case 'backspace': handleBackspace(); break;
    case 'plusminus': handlePlusMinus(); break;
    case 'percent': handlePercent(); break;
    case 'paren': handleParenthesis(); break;
    case 'equals': handleEquals(); break;
  }
  updateDisplay();
  btn.blur();
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
    expression += ')';
  } else {
    if (expression === '0' || justEvaluated) {
      expression = '(';
      justEvaluated = false;
    } else {
      if (/[\d\)]$/.test(expression)) expression += '*(';
      else expression += '(';
    }
  }
}

function handleEquals() {
  if (expression === 'Ошибка') return;
  const exprBefore = expression;
  try {
    if (/[^0-9+\-*/%(). ]/i.test(expression)) {
      throw new Error('Недопустимые символы');
    }
    const result = new Function('return (' + expression + ')')();
    expression = String(result);
    justEvaluated = true;
    // Сохраняем в историю
    addToHistory(exprBefore, expression);
  } catch (err) {
    expression = 'Ошибка';
    justEvaluated = true;
  }
}

// ========== УДАЛЕНИЕ ВЫДЕЛЕННОГО ЧИСЛА ==========
function handleSelectionDelete() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  if (!displayEl.contains(range.commonAncestorContainer)) return false;
  if (expression === 'Ошибка') {
    expression = '0';
    justEvaluated = false;
    updateDisplay();
    selection.removeAllRanges();
    return true;
  }
  const preRange = document.createRange();
  preRange.selectNodeContents(displayEl);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const selectedText = range.toString();
  const endOffset = startOffset + selectedText.length;
  let numStart = startOffset;
  let numEnd = endOffset;
  if (/^[\d.]+$/.test(selectedText)) {
    while (numStart > 0 && /[\d.]/.test(expression[numStart - 1])) numStart--;
    while (numEnd < expression.length && /[\d.]/.test(expression[numEnd])) numEnd++;
  }
  expression = expression.slice(0, numStart) + expression.slice(numEnd);
  if (expression === '' || expression === '-') expression = '0';
  justEvaluated = false;
  updateDisplay();
  selection.removeAllRanges();
  return true;
}

// ========== КЛАВИАТУРА ==========
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && handleSelectionDelete()) {
      e.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (active && active.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;

    let handled = true;
    if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
    else if (e.key === '+') handleOperator('+');
    else if (e.key === '-') handleOperator('-');
    else if (e.key === '*') handleOperator('*');
    else if (e.key === '/') handleOperator('/');
    else if (e.key === 'Enter' || e.key === '=') handleEquals();
    else if (e.key === 'Backspace') handleBackspace();
    else if (e.key === 'Escape' || e.key === 'Delete') handleClear();
    else if (e.key === '%' || (e.key === '5' && e.shiftKey)) handlePercent();
    else if (e.key === '(' || e.key === ')') handleParenthesis();
    else if (e.key === '.' || e.key === ',') handleDot();
    else if (e.key === 'F9') handlePlusMinus();
    else handled = false;

    if (handled) {
      e.preventDefault();
      updateDisplay();
    }
  });
}

// ========== ВСТАВКА ==========
function initPaste() {
  document.addEventListener('paste', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    text = text.replace(/\s/g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
    const firstDot = text.indexOf('.');
    if (firstDot !== -1) text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, '');
    if (!text) return;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '.') handleDot();
      else handleDigit(text[i]);
    }
    updateDisplay();
  });
}

// ========== ЗАПУСК ==========
updateDisplay();
initKeyboard();
initPaste();
renderHistory();