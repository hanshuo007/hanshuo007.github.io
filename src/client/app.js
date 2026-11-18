// 站点交互：深浅色切换 + 资料筛选与搜索。没有框架，也没有依赖。
(function () {
  var root = document.documentElement;

  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var isDark = current
        ? current === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        /* 隐身模式下 localStorage 可能不可用，忽略即可 */
      }
    });
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('.res-card'));
  if (!cards.length) return;

  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.res-group'));
  var input = document.querySelector('[data-search-input]');
  var empty = document.querySelector('[data-empty]');
  var activeCat = 'all';

  function apply() {
    var q = ((input && input.value) || '').trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (card) {
      var catOk = activeCat === 'all' || card.getAttribute('data-cat') === activeCat;
      var textOk = !q || (card.getAttribute('data-search') || '').indexOf(q) !== -1;
      var ok = catOk && textOk;
      card.hidden = !ok;
      if (ok) shown += 1;
    });
    groups.forEach(function (group) {
      var any = Array.prototype.some.call(group.querySelectorAll('.res-card'), function (card) {
        return !card.hidden;
      });
      group.hidden = !any;
    });
    if (empty) empty.hidden = shown !== 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (other) {
        other.classList.remove('is-active');
      });
      chip.classList.add('is-active');
      activeCat = chip.getAttribute('data-filter');
      apply();
    });
  });

  if (input) input.addEventListener('input', apply);
  apply();
})();
