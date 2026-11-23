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

  var faqSearch = document.querySelector('[data-faq-search]');
  if (faqSearch) {
    var faqInput = faqSearch.querySelector('input');
    var faqStatus = faqSearch.querySelector('[role="status"]');
    var faqGroups = Array.from(document.querySelectorAll('.faq-group'), function (group) {
      return {
        element: group,
        items: Array.from(group.querySelectorAll('.faq-item'), function (item) {
          return { element: item, text: item.textContent.toLowerCase() };
        }),
      };
    });

    function filterFaq() {
      var term = faqInput.value.trim().toLowerCase();
      var matches = 0;
      faqGroups.forEach(function (group) {
        var visible = 0;
        group.items.forEach(function (item) {
          item.element.hidden = !item.text.includes(term);
          if (!item.element.hidden) visible += 1;
        });
        group.element.hidden = visible === 0;
        var category = document.querySelector('.faq-side a[href="#' + group.element.id + '"]');
        if (category) category.hidden = group.element.hidden;
        matches += visible;
      });
      faqStatus.textContent = term ? (matches ? '找到 ' + matches + ' 条答疑' : '暂无匹配答疑，试试其他关键词。') : '';
    }

    function openLinkedQuestion() {
      var fragment = window.location.hash.slice(1);
      var question = document.getElementById(fragment);
      if (!question || !question.matches('.faq-item')) return;
      if (question.hidden) {
        faqInput.value = '';
        filterFaq();
      }
      question.open = true;
      question.scrollIntoView({ block: 'start' });
    }

    faqSearch.hidden = false;
    faqInput.addEventListener('input', filterFaq);
    window.addEventListener('hashchange', openLinkedQuestion);
    openLinkedQuestion();
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
