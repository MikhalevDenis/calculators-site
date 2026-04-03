// Ипотечный калькулятор (аннуитетные и дифференцированные платежи)

const mortgageForm = document.getElementById('mortgage-form');
const mortgageClearBtn = document.getElementById('mortgage-clear-btn');

const elPay = document.getElementById('m-pay');
const elLoan = document.getElementById('m-loan');
const elMonths = document.getElementById('m-months');
const elTotal = document.getElementById('m-total');
const elInterest = document.getElementById('m-interest');
const elOverpayPct = document.getElementById('m-overpay-pct');
const elIncomeShare = document.getElementById('m-income-share');
const elNote = document.getElementById('m-note');

function num(value) {
  if (value === '' || value == null) return NaN;
  return parseFloat(String(value).replace(/\s+/g, '').replace(',', '.'));
}

function fmtMoney(n) {
  if (!isFinite(n)) return '—';
  const rounded = Math.round(n);
  return rounded.toLocaleString('ru-RU') + ' ₽';
}

function fmtNumber(n, digits = 0) {
  if (!isFinite(n)) return '—';
  const r = parseFloat(n.toFixed(digits));
  return r.toLocaleString('ru-RU');
}

function fmtPercent(n, digits = 1) {
  if (!isFinite(n)) return '—';
  const r = parseFloat(n.toFixed(digits));
  return r.toLocaleString('ru-RU') + ' %';
}

function showError(message) {
  elPay.textContent = '—';
  elLoan.textContent = '—';
  elMonths.textContent = '—';
  elTotal.textContent = '—';
  elInterest.textContent = '—';
  elOverpayPct.textContent = '—';
  elIncomeShare.textContent = '—';
  elNote.textContent = message;
  elNote.classList.add('error');
}

function showSuccess(message) {
  elNote.textContent = message;
  elNote.classList.remove('error');
}

function resetMortgageForm() {
  const formElements = mortgageForm.elements;
  if (formElements['price']) formElements['price'].value = '';
  if (formElements['years']) formElements['years'].value = '';
  if (formElements['downValue']) formElements['downValue'].value = '';
  if (formElements['downType']) formElements['downType'].value = 'percent';
  if (formElements['rate']) formElements['rate'].value = '';
  if (formElements['paymentType']) formElements['paymentType'].value = 'annuity';
  if (formElements['income']) formElements['income'].value = '';

  elPay.textContent = '—';
  elLoan.textContent = '—';
  elMonths.textContent = '—';
  elTotal.textContent = '—';
  elInterest.textContent = '—';
  elOverpayPct.textContent = '—';
  elIncomeShare.textContent = '—';
  showSuccess('Заполните поля и нажмите «Рассчитать ипотеку».');
}

if (mortgageForm) {
  mortgageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(mortgageForm);
    const price = num(formData.get('price'));
    const years = num(formData.get('years'));
    const downValue = num(formData.get('downValue'));
    const downType = formData.get('downType') || 'percent';
    const rate = num(formData.get('rate'));
    const income = num(formData.get('income'));
    const paymentType = formData.get('paymentType') || 'annuity';

    // Валидация
    if (!price || price <= 0) {
      showError('Укажите стоимость недвижимости (должна быть больше нуля).');
      return;
    }
    if (!years || years <= 0) {
      showError('Укажите срок кредита в годах (больше нуля).');
      return;
    }
    if (rate == null || isNaN(rate) || rate < 0) {
      showError('Укажите процентную ставку (неотрицательное число).');
      return;
    }

    let downPayment = 0;
    if (!isNaN(downValue) && downValue > 0) {
      if (downType === 'percent') {
        if (downValue >= 100) {
          showError('Первоначальный взнос в процентах должен быть меньше 100%.');
          return;
        }
        downPayment = (price * downValue) / 100;
      } else {
        if (downValue >= price) {
          showError('Первоначальный взнос не может быть больше или равен стоимости.');
          return;
        }
        downPayment = downValue;
      }
    }

    const loanAmount = price - downPayment;
    if (loanAmount <= 0) {
      showError('Сумма кредита должна быть больше нуля (уменьшите первоначальный взнос).');
      return;
    }

    const months = Math.round(years * 12);
    const monthlyRate = rate / 100 / 12;
    let paymentText = '—';
    let totalPaid = 0;
    let interestPaid = 0;
    let overpayPct = 0;

    try {
      if (paymentType === 'annuity') {
        // Аннуитетный платёж
        let payment;
        if (monthlyRate === 0) {
          payment = loanAmount / months;
        } else {
          const pow = Math.pow(1 + monthlyRate, months);
          const k = (monthlyRate * pow) / (pow - 1);
          payment = loanAmount * k;
        }
        totalPaid = payment * months;
        interestPaid = totalPaid - loanAmount;
        overpayPct = (interestPaid / loanAmount) * 100;
        paymentText = fmtMoney(payment);
      } else {
        // Дифференцированные платежи
        const n = months;
        const principalPart = loanAmount / n;
        let sum = 0;
        let firstPayment = 0;
        let lastPayment = 0;

        for (let i = 0; i < n; i++) {
          const remaining = loanAmount - principalPart * i;
          const interestForMonth = remaining * monthlyRate;
          const payment = principalPart + interestForMonth;
          sum += payment;
          if (i === 0) firstPayment = payment;
          if (i === n - 1) lastPayment = payment;
        }
        totalPaid = sum;
        interestPaid = totalPaid - loanAmount;
        overpayPct = (interestPaid / loanAmount) * 100;
        paymentText = `от ${fmtMoney(lastPayment)} до ${fmtMoney(firstPayment)} ₽`;
      }

      // Расчёт доли платежа от дохода
      let incomeShare = NaN;
      if (income && income > 0 && paymentType === 'annuity') {
        let paymentForShare;
        if (monthlyRate === 0) {
          paymentForShare = loanAmount / months;
        } else {
          const pow = Math.pow(1 + monthlyRate, months);
          const k = (monthlyRate * pow) / (pow - 1);
          paymentForShare = loanAmount * k;
        }
        incomeShare = (paymentForShare / income) * 100;
      } else if (income && income > 0 && paymentType === 'diff') {
        // Для дифференцированных – показываем диапазон доли
        const principalPart = loanAmount / months;
        const firstPaymentShare = (principalPart + (loanAmount * monthlyRate)) / income * 100;
        const lastPaymentShare = (principalPart + (principalPart * monthlyRate)) / income * 100;
        elIncomeShare.textContent = `от ${fmtPercent(lastPaymentShare)} до ${fmtPercent(firstPaymentShare)}`;
        incomeShare = NaN;
      }

      // Вывод результатов
      elPay.textContent = paymentText;
      elLoan.textContent = fmtMoney(loanAmount);
      elMonths.textContent = fmtNumber(months);
      elTotal.textContent = fmtMoney(totalPaid);
      elInterest.textContent = fmtMoney(interestPaid);
      elOverpayPct.textContent = fmtPercent(overpayPct);

      if (paymentType === 'annuity' && !isNaN(incomeShare) && incomeShare > 0) {
        elIncomeShare.textContent = fmtPercent(incomeShare);
      } else if (paymentType !== 'diff') {
        elIncomeShare.textContent = '—';
      }

      const message = paymentType === 'annuity'
        ? 'Расчёт выполнен по аннуитетной схеме (равные ежемесячные платежи). Фактические условия банка могут отличаться.'
        : 'Расчёт выполнен по дифференцированной схеме (убывающие платежи). Показан диапазон от минимального до максимального платежа.';
      showSuccess(message);
    } catch (err) {
      showError('Ошибка расчёта. Проверьте введённые данные.');
    }
  });
}

if (mortgageClearBtn) {
  mortgageClearBtn.addEventListener('click', () => {
    resetMortgageForm();
  });
}