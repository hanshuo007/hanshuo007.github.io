// 站点交互：深浅色切换、寒招路线及答疑与资料搜索。没有第三方依赖。
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

  var routeStops = document.querySelector('[data-route-stops]');
  if (routeStops) {
    var stops = Array.from(routeStops.querySelectorAll('[data-route-stop]'));
    var panels = stops.map(function (stop) {
      return document.getElementById(stop.getAttribute('aria-controls'));
    });
    var selectedStop = -1;

    function selectStop(index) {
      if (index === selectedStop) return;
      routeStops.style.setProperty('--route-progress', String(index / (stops.length - 1)));
      stops.forEach(function (stop, stopIndex) {
        var active = stopIndex === index;
        stop.setAttribute('aria-selected', String(active));
        stop.tabIndex = active ? 0 : -1;
        panels[stopIndex].toggleAttribute('data-route-flip', active && selectedStop !== -1);
        panels[stopIndex].hidden = !active;
      });
      selectedStop = index;
    }

    routeStops.setAttribute('role', 'tablist');
    stops.forEach(function (stop, index) {
      stop.setAttribute('role', 'tab');
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', stop.id);
      stop.addEventListener('click', function () {
        selectStop(index);
      });
      stop.addEventListener('keydown', function (event) {
        var nextIndex;
        switch (event.key) {
          case 'ArrowLeft': nextIndex = (index + stops.length - 1) % stops.length; break;
          case 'ArrowRight': nextIndex = (index + 1) % stops.length; break;
          case 'Home': nextIndex = 0; break;
          case 'End': nextIndex = stops.length - 1; break;
          default: return;
        }
        event.preventDefault();
        selectStop(nextIndex);
        stops[nextIndex].focus();
      });
    });
    selectStop(0);
    routeStops.hidden = false;
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
// Draw the stationary cartography once. Each scroll frame only redraws the route and its marker.
function initCampusJourney(scene) {
  const panel = scene.querySelector('.journey-screen');
  const canvas = scene.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const preference = window.matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 591px)');
  if (!ctx) return;
  const terrain = document.createElement('canvas');
  const pen = terrain.getContext('2d');
  if (!pen) return;
  let width, height, start, end, bend1, bend2;
  let frame = 0;
  let previous = -1;
  const limit = t => Math.max(0, Math.min(1, t));
  const smooth = t => { const x = limit(t); return x * x * (3 - 2 * x); };

  function prepareMap() {
    width = panel.clientWidth;
    height = panel.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    for (const surface of [canvas, terrain]) {
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    pen.setTransform(ratio, 0, 0, ratio, 0, 0);
    const narrow = width <= 680;
    const field = pen.createLinearGradient(0, height, width, 0);
    field.addColorStop(0, '#0b211e');
    field.addColorStop(.55, '#14362f');
    field.addColorStop(1, '#2a5143');
    pen.fillStyle = field;
    pen.fillRect(0, 0, width, height);
    pen.lineWidth = .85;
    for (let row = -140; row < height + 160; row += 10) {
      pen.beginPath();
      for (let x = 0; x <= width + 5; x += 5) {
        const drift = Math.sin(x / 147 + row / 184);
        const y = row + 53 * drift + 32 * Math.sin(x / 88 - row / 165 + drift)
          + 11 * Math.cos(x / 42 + row / 61);
        if (x === 0) pen.moveTo(0, y); else pen.lineTo(x, y);
      }
      pen.strokeStyle = row % 50 === 0 ? '#bde0bb40' : '#bde0bb1c';
      pen.stroke();
    }
    pen.fillStyle = '#daefd740';
    for (let x = 24; x < width; x += 54) {
      for (let y = 24; y < height; y += 54) {
        pen.fillRect(x - 2, y, 5, 1);
        pen.fillRect(x, y - 2, 1, 5);
      }
    }
    const fade = pen.createLinearGradient(0, 0, width, 0);
    fade.addColorStop(0, '#091d19d9');
    fade.addColorStop(.7, '#091d1900');
    pen.fillStyle = fade;
    pen.fillRect(0, 0, width, height);
    start = [width * (narrow ? .81 : .77), height * (narrow ? .15 : .21)];
    end = [width * (narrow ? .57 : .63), height * (narrow ? .42 : .7)];
    bend1 = [start[0] + width * .11, start[1] + height * .22];
    bend2 = [end[0] - width * .14, end[1] - height * .16];
    previous = -1;
  }

  function point(t) {
    const u = 1 - t;
    return start.map((v, i) => v*u*u*u + 3*bend1[i]*u*u*t + 3*bend2[i]*u*t*t + end[i]*t*t*t);
  }

  function drawRoute(t) {
    ctx.drawImage(terrain, 0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.bezierCurveTo(...bend1, ...bend2, ...end);
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = '#edf7c68c';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(...start);
    for (let i = 1; i <= 50; i++) ctx.lineTo(...point(t * i / 50));
    ctx.strokeStyle = '#dcfb77';
    ctx.lineWidth = 3;
    ctx.stroke();
    const marker = point(t);
    for (const [index, city] of [start, end].entries()) {
      ctx.beginPath();
      ctx.arc(...city, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#19392f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f3f6dc';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(index ? '阜阳' : '北京', city[0] + 11, city[1] - 5);
      ctx.font = '10px monospace';
      ctx.fillText(index ? 'FUYANG' : 'BEIJING', city[0] + 12, city[1] + 10);
    }
    ctx.beginPath();
    ctx.arc(...marker, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#efffa4';
    ctx.shadowColor = '#e8ff8d';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function paint() {
    frame = 0;
    const header = parseFloat(scene.style.getPropertyValue('--header-height')) || 0;
    const span = Math.max(1, scene.offsetHeight - panel.offsetHeight);
    const progress = limit((header - scene.getBoundingClientRect().top) / span);
    if (progress === previous) return;
    previous = progress;
    const set = (key, value) => scene.style.setProperty('--' + key, value);
    const dissolve = smooth((progress - .16) / .52);
    set('zoom', 1 + .25 * smooth(progress / .64));
    set('depart', 1 - smooth((progress - .12) / .32));
    set('lift', -45 * smooth(progress / .55) + 'px');
    set('map-opacity', dissolve);
    set('arrive', smooth((progress - .46) / .29));
    set('rise', 28 * (1 - smooth((progress - .42) / .33)) + 'px');
    set('rail', progress * 100 + '%');
    if (dissolve > 0) drawRoute(smooth((progress - .30) / .65));
  }

  function queuePaint() {
    if (!frame && preference.matches) frame = requestAnimationFrame(paint);
  }

  function configure() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    scene.classList.toggle('is-cinematic', preference.matches);
    scene.removeAttribute('style');
    if (!preference.matches) return;
    const header = document.querySelector('.site-header').offsetHeight;
    scene.style.setProperty('--header-height', header + 'px');
    prepareMap();
    paint();
  }

  window.addEventListener('scroll', queuePaint, { passive: true });
  window.addEventListener('resize', configure);
  preference.addEventListener('change', configure);
  configure();
}

const campusJourney = document.querySelector('[data-journey]');
if (campusJourney) initCampusJourney(campusJourney);
