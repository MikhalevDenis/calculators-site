// Кредитный калькулятор (аннуитет / дифференцированный)

const creditForm = document.getElementById('credit-form');
const creditClearBtn = document.getElementById('credit-clear-btn');

const crPayEl = document.getElementById('cr-pay');
const crAmountEl = document.getElementById('cr-amount');
const crMonthsEl = document.getElementById('cr-months');
const crTotalEl = document.getElementById('cr-total');
const crInterestEl = document.getElementById('cr-interest');
const crOverpayPctEl = document.getElementById('cr-overpay-pct');
const crIncomeShareEl = document.getElementById('cr-income-share');
const crNoteEl = document.getElementById('cr-note');

function cNum(value) {
  if (value === '' || value == null) return NaN;
  return parseFloat(String(value).replace(/\s+/g, '').replace(',', '.'));
}

function cMoney(n) {
  if (!isFinite(n)) return '—';
  const rounded = Math.round(n);
  return rounded.toLocaleString('ru-RU') + ' ₽';
}

function cNumber(n, digits = 0) {
  if (!isFinite(n)) return '—';
  const r = parseFloat(n.toFixed(digits));
  return r.toLocaleString('ru-RU');
}

function cPercent(n, digits = 1) {
  if (!isFinite(n)) return '—';
  const r = parseFloat(n.toFixed(digits));
  return r.toLocaleString('ru-RU') + ' %';
}

function resetCreditForm() {
  const formElements = creditForm.elements;
  if (formElements['amount']) formElements['amount'].value = '';
  if (formElements['rate']) formElements['rate'].value = '';
  if (formElements['years']) formElements['years'].value = '';
  if (formElements['months']) formElements['months'].value = '';
  if (formElements['income']) formElements['income'].value = '';
  if (formElements['paymentType']) formElements['paymentType'].value = 'annuity';

  // Сброс результатов
  crPayEl.textContent = '—';
  crAmountEl.textContent = '—';
  crMonthsEl.textContent = '—';
  crTotalEl.textContent = '—';
  crInterestEl.textContent = '—';
  crOverpayPctEl.textContent = '—';
  crIncomeShareEl.textContent = '—';
  crNoteEl.textContent = 'Заполните поля и нажмите «Рассчитать кредит».';
  crNoteEl.classList.remove('error');
}

function showError(message) {
  crPayEl.textContent = '—';
  crAmountEl.textContent = '—';
  crMonthsEl.textContent = '—';
  crTotalEl.textContent = '—';
  crInterestEl.textContent = '—';
  crOverpayPctEl.textContent = '—';
  crIncomeShareEl.textContent = '—';
  crNoteEl.textContent = message;
  crNoteEl.classList.add('error');
}

if (creditForm) {
  creditForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(creditForm);
    const amount = cNum(formData.get('amount'));
    const rate = cNum(formData.get('rate'));
    const years = cNum(formData.get('years'));
    const monthsInput = cNum(formData.get('months'));
    const income = cNum(formData.get('income'));
    const paymentType = formData.get('paymentType') || 'annuity';

    // Валидация
    if (!amount || amount <= 0) {
      showError('Укажите сумму кредита (должна быть больше нуля).');
      return;
    }
    if (rate == null || isNaN(rate) || rate < 0) {
      showError('Укажите процентную ставку (неотрицательное число).');
      return;
    }

    let totalMonths = 0;
    if (!isNaN(years) && years > 0) totalMonths += years * 12;
    if (!isNaN(monthsInput) && monthsInput > 0) totalMonths += monthsInput;

    if (totalMonths <= 0) {
      showError('Укажите срок кредита (хотя бы 1 месяц).');
      return;
    }

    const monthlyRate = rate / 100 / 12;
    let paymentText = '—';
    let totalPaid = 0;
    let interestPaid = 0;
    let overpayPct = 0;

    try {
      if (paymentType === 'annuity') {
        let payment;
        if (monthlyRate === 0) {
          payment = amount / totalMonths;
        } else {
          const pow = Math.pow(1 + monthlyRate, totalMonths);
          const k = (monthlyRate * pow) / (pow - 1);
          payment = amount * k;
        }
        totalPaid = payment * totalMonths;
        interestPaid = totalPaid - amount;
        overpayPct = (interestPaid / amount) * 100;
        paymentText = cMoney(payment);
      } else {
        // Дифференцированные платежи
        const n = totalMonths;
        const principalPart = amount / n;
        let sum = 0;
        let firstPayment = 0;
        let lastPayment = 0;

        for (let i = 0; i < n; i++) {
          const remaining = amount - principalPart * i;
          const interestForMonth = remaining * monthlyRate;
          const payment = principalPart + interestForMonth;
          sum += payment;
          if (i === 0) firstPayment = payment;
          if (i === n - 1) lastPayment = payment;
        }
        totalPaid = sum;
        interestPaid = totalPaid - amount;
        overpayPct = (interestPaid / amount) * 100;

        // Показываем диапазон платежей
        paymentText = `от ${cMoney(lastPayment)} до ${cMoney(firstPayment)} ₽`;
      }

      let incomeShare = NaN;
      if (income && income > 0 && paymentType === 'annuity') {
        // Для аннуитета считаем долю по одному платежу
        let paymentForShare;
        if (monthlyRate === 0) {
          paymentForShare = amount / totalMonths;
        } else {
          const pow = Math.pow(1 + monthlyRate, totalMonths);
          const k = (monthlyRate * pow) / (pow - 1);
          paymentForShare = amount * k;
        }
        incomeShare = (paymentForShare / income) * 100;
      } else if (income && income > 0 && paymentType === 'diff') {
        // Для дифференцированных – показываем диапазон доли
        const principalPart = amount / totalMonths;
        const firstPaymentShare = (principalPart + (amount * monthlyRate)) / income * 100;
        const lastPaymentShare = (principalPart + (principalPart * monthlyRate)) / income * 100;
        crIncomeShareEl.textContent = `от ${cPercent(lastPaymentShare)} до ${cPercent(firstPaymentShare)}`;
        // отдельно установим incomeShare, чтобы не выводить лишнее
        incomeShare = NaN;
      }

      // Вывод
      crPayEl.textContent = paymentText;
      crAmountEl.textContent = cMoney(amount);
      crMonthsEl.textContent = cNumber(totalMonths);
      crTotalEl.textContent = cMoney(totalPaid);
      crInterestEl.textContent = cMoney(interestPaid);
      crOverpayPctEl.textContent = cPercent(overpayPct);

      if (paymentType === 'annuity' && !isNaN(incomeShare) && incomeShare > 0) {
        crIncomeShareEl.textContent = cPercent(incomeShare);
      } else if (paymentType !== 'diff') {
        crIncomeShareEl.textContent = '—';
      }

      crNoteEl.textContent = paymentType === 'annuity'
        ? 'Расчёт выполнен по аннуитетной схеме (равные ежемесячные платежи). Фактические условия банка могут отличаться.'
        : 'Расчёт выполнен по дифференцированной схеме (убывающие платежи). Показан диапазон от минимального до максимального платежа.';
      crNoteEl.classList.remove('error');
    } catch (err) {
      showError('Ошибка расчёта. Проверьте введённые данные.');
    }
  });
}

if (creditClearBtn) {
  creditClearBtn.addEventListener('click', () => {
    resetCreditForm();
  });
}