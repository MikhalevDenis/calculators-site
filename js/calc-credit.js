// Кредитный калькулятор (аннуитет / дифференцированный)

const creditForm = document.getElementById('credit-form');

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

    try {
      if (!amount || amount <= 0) {
        throw new Error('Укажите сумму кредита.');
      }
      if (rate == null || isNaN(rate)) {
        throw new Error('Укажите процентную ставку.');
      }

      let totalMonths = 0;
      if (!isNaN(years) && years > 0) {
        totalMonths += years * 12;
      }
      if (!isNaN(monthsInput) && monthsInput > 0) {
        totalMonths += monthsInput;
      }

      if (totalMonths <= 0) {
        throw new Error('Укажите срок кредита (годы и/или месяцы).');
      }

      const monthlyRate = rate / 100 / 12;
      let paymentText = '—';
      let totalPaid = 0;
      let interestPaid = 0;
      let overpayPct = 0;

      if (paymentType === 'annuity') {
        // Аннуитет: равный ежемесячный платёж
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

        paymentText =
          `первый платёж: ${cMoney(firstPayment)}, ` +
          `последний: ${cMoney(lastPayment)}`;
      }

      let incomeShare = NaN;
      if (income && income > 0 && paymentType === 'annuity') {
        // для аннуитета долю считаем по одному платежу
        const monthlyRateLocal = rate / 100 / 12;
        let payment;
        if (monthlyRateLocal === 0) {
          payment = amount / totalMonths;
        } else {
          const pow = Math.pow(1 + monthlyRateLocal, totalMonths);
          const k = (monthlyRateLocal * pow) / (pow - 1);
          payment = amount * k;
        }
        incomeShare = (payment / income) * 100;
      }

      // Вывод
      crPayEl.textContent = paymentText;
      crAmountEl.textContent = cMoney(amount);
      crMonthsEl.textContent = cNumber(totalMonths);
      crTotalEl.textContent = cMoney(totalPaid);
      crInterestEl.textContent = cMoney(interestPaid);
      crOverpayPctEl.textContent = cPercent(overpayPct);

      crIncomeShareEl.textContent =
        isFinite(incomeShare) && incomeShare > 0
          ? cPercent(incomeShare)
          : '—';

      crNoteEl.textContent =
        paymentType === 'annuity'
          ? 'Расчёт выполнен по аннуитетной схеме (равные ежемесячные платежи). Фактические условия банка могут отличаться.'
          : 'Расчёт выполнен по дифференцированной схеме (убывающие платежи). Фактические условия банка могут отличаться.';
      crNoteEl.classList.remove('error');
    } catch (err) {
      crPayEl.textContent = '—';
      crAmountEl.textContent = '—';
      crMonthsEl.textContent = '—';
      crTotalEl.textContent = '—';
      crInterestEl.textContent = '—';
      crOverpayPctEl.textContent = '—';
      crIncomeShareEl.textContent = '—';

      crNoteEl.textContent = err.message || 'Ошибка ввода.';
      crNoteEl.classList.add('error');
    }
  });
}
