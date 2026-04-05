// Навигация: выпадающее меню "Выбор калькулятора"
// С поддержкой aria-expanded для доступности
// БЕЗ КОНФЛИКТОВ С ПОЛЯМИ ВВОДА

document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.querySelector('.nav-dropdown');
  if (!dropdown) return;

  const btn = dropdown.querySelector('.nav-drop-btn');
  const menu = dropdown.querySelector('.nav-drop-menu');

  function isInputElement(target) {
    // Проверяем, является ли элемент или его родитель полем ввода
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }
    // Проверяем родителя (для случая, когда клик по label или обёртке)
    if (target.closest) {
      return target.closest('input, textarea, select, [contenteditable="true"]') !== null;
    }
    return false;
  }

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
      // НЕ вызываем btn.focus() — это мешает полям ввода
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
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'true');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  // Закрытие по клику вне меню — НО не по полям ввода
  document.addEventListener('click', (e) => {
    // Если клик по полю ввода — ничего не делаем
    if (isInputElement(e.target)) {
      return;
    }
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

  // Для доступности: закрытие при потере фокуса
  if (menu) {
    menu.addEventListener('focusout', (e) => {
      // Если новый активный элемент — поле ввода, не закрываем меню
      if (isInputElement(e.relatedTarget)) {
        return;
      }
      if (!menu.contains(e.relatedTarget) && e.relatedTarget !== btn) {
        closeDropdown();
      }
    });
  }
});