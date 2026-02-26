// Ипотечный калькулятор (аннуитетные платежи)

const mortgageForm = document.getElementById('mortgage-form');

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

    try {
      if (!price || !years || rate == null || isNaN(rate)) {
        throw new Error('Заполните стоимость, срок и процентную ставку.');
      }

      if (price <= 0 || years <= 0 || rate < 0) {
        throw new Error('Проверьте корректность введённых значений.');
      }

      let downPayment = 0;
      if (!isNaN(downValue) && downValue > 0) {
        if (downType === 'percent') {
          if (downValue >= 100) {
            throw new Error('Первоначальный взнос в процентах должен быть меньше 100%.');
          }
          downPayment = (price * downValue) / 100;
        } else {
          if (downValue >= price) {
            throw new Error('Первоначальный взнос не может быть больше или равен стоимости.');
          }
          downPayment = downValue;
        }
      }

      const loanAmount = price - downPayment;
      if (loanAmount <= 0) {
        throw new Error('Сумма кредита должна быть больше нуля.');
      }

      const months = Math.round(years * 12);
      const monthlyRate = rate / 100 / 12;

      let payment;
      if (monthlyRate === 0) {
        payment = loanAmount / months;
      } else {
        const k = monthlyRate * Math.pow(1 + monthlyRate, months) /
                  (Math.pow(1 + monthlyRate, months) - 1);
        payment = loanAmount * k;
      }

      const totalPaid = payment * months;
      const interestPaid = totalPaid - loanAmount;
      const overpayPct = (interestPaid / loanAmount) * 100;

      let incomeShare = NaN;
      if (income && income > 0) {
        incomeShare = (payment / income) * 100;
      }

      // вывод
      elPay.textContent = fmtMoney(payment);
      elLoan.textContent = fmtMoney(loanAmount);
      elMonths.textContent = fmtNumber(months);
      elTotal.textContent = fmtMoney(totalPaid);
      elInterest.textContent = fmtMoney(interestPaid);
      elOverpayPct.textContent = fmtPercent(overpayPct);

      elIncomeShare.textContent = isFinite(incomeShare)
        ? fmtPercent(incomeShare)
        : '—';

      elNote.textContent =
        'Расчёт выполнен по аннуитетной схеме. Фактические условия банка могут отличаться.';
      elNote.classList.remove('error');
    } catch (err) {
      elPay.textContent = '—';
      elLoan.textContent = '—';
      elMonths.textContent = '—';
      elTotal.textContent = '—';
      elInterest.textContent = '—';
      elOverpayPct.textContent = '—';
      elIncomeShare.textContent = '—';

      elNote.textContent = err.message || 'Ошибка ввода.';
      elNote.classList.add('error');
    }
  });
}