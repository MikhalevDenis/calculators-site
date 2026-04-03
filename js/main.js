// Навигация: выпадающее меню "Выбор калькулятора"
// С поддержкой aria-expanded для доступности

document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.querySelector('.nav-dropdown');
  if (!dropdown) return;

  const btn = dropdown.querySelector('.nav-drop-btn');
  const menu = dropdown.querySelector('.nav-drop-menu');

  function openDropdown() {
    dropdown.classList.add('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
    }
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      // Возвращаем фокус на кнопку после закрытия (удобно для клавиатуры)
      btn.focus();
    }
  }

  function toggleDropdown() {
    if (dropdown.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  if (btn) {
    // Инициализация атрибута
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'true');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  // Закрытие по клику вне меню
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // Закрытие по Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('open')) {
      closeDropdown();
    }
  });

  // Для доступности: закрытие при потере фокуса (если фокус ушёл с меню)
  if (menu) {
    menu.addEventListener('focusout', (e) => {
      // Если новый активный элемент не внутри меню и не кнопка, закрываем
      if (!menu.contains(e.relatedTarget) && e.relatedTarget !== btn) {
        closeDropdown();
      }
    });
  }
});