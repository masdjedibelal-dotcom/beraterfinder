// Berater-Logik: Filter nur aus echten Daten, Mapping keyword→Modell
(function () {
  const PER_PAGE = 24;

  const KEYWORD_TO_MODELL = {
    'Versicherungsmakler': 'Makler',
    'Versicherungsagentur': 'Agentur',
    'Versicherungsberater': 'Honorarberater'
  };

  const TRANSPARENZ = {
    'Versicherungsmakler': 'Arbeitet im Auftrag des Kunden und erhält im Regelfall eine Vermittlungsprovision vom Versicherer.',
    'Versicherungsagentur': 'Arbeitet im Auftrag einer Versicherungsgesellschaft.',
    'Versicherungsberater': 'Wird direkt vom Kunden vergütet, unabhängig von Produktabschlüssen.'
  };

  let allAdvisors = [];
  let filteredAdvisors = [];
  let currentPage = 1;
  let sortBy = 'rating';
  let distinctCities = [];
  let distinctKeywords = [];

  function getModell(adv) { return KEYWORD_TO_MODELL[adv.keyword] || adv.keyword || ''; }
  function getRatingNum(a) { return parseFloat(String(a.rating || 0).replace(',', '.')); }
  function getCountNum(a) { return parseInt(a.rating_count, 10) || 0; }
  function isTopRated(a) { return getRatingNum(a) >= 4.8 && getCountNum(a) >= 30; }
  function hasWebsite(a) { return !!(a.website && a.website.trim()); }

  window.toggleMenu = function () {
    document.getElementById('burger')?.classList.toggle('open');
    document.getElementById('nav-mobile')?.classList.toggle('open');
  };
  window.closeMenu = function () {
    document.getElementById('burger')?.classList.remove('open');
    document.getElementById('nav-mobile')?.classList.remove('open');
  };

  window.handleSort = function (val) {
    sortBy = val;
    applyFiltersFromUI();
  };
  window.toggleSort = function () { document.querySelector('.sort-sel')?.focus(); };

  window.toggleFilterPanel = function () {
    const panel = document.getElementById('filter-panel');
    const btn = document.querySelector('.filter-toggle');
    if (!panel || !btn) return;
    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', willOpen);
    if (willOpen) {
      const ort = document.getElementById('filter-ort')?.value || '';
      const typ = document.getElementById('filter-typ')?.value || '';
      const rat = document.getElementById('filter-rating')?.value || '';
      const fpO = document.getElementById('fp-ort');
      const fpT = document.getElementById('fp-typ');
      const fpR = document.getElementById('fp-rating');
      if (fpO) fpO.value = ort;
      if (fpT) fpT.value = typ;
      if (fpR) fpR.value = rat;
    }
  };
  window.syncFilterAndApply = function () {
    const fpOrt = document.getElementById('fp-ort')?.value || '';
    const fpTyp = document.getElementById('fp-typ')?.value || '';
    const fpRating = document.getElementById('fp-rating')?.value || '';
    const ortSel = document.getElementById('filter-ort');
    const typSel = document.getElementById('filter-typ');
    const ratingSel = document.getElementById('filter-rating');
    if (ortSel) ortSel.value = fpOrt;
    if (typSel) typSel.value = fpTyp;
    if (ratingSel) ratingSel.value = fpRating;
    applyFiltersFromUI();
    updateFilterBadge();
  };
  window.resetFilterPanel = function () {
    const fpOrt = document.getElementById('fp-ort');
    const fpTyp = document.getElementById('fp-typ');
    const fpRating = document.getElementById('fp-rating');
    const ortSel = document.getElementById('filter-ort');
    const typSel = document.getElementById('filter-typ');
    const ratingSel = document.getElementById('filter-rating');
    if (fpOrt) fpOrt.value = '';
    if (fpTyp) fpTyp.value = '';
    if (fpRating) fpRating.value = '';
    if (ortSel) ortSel.value = '';
    if (typSel) typSel.value = '';
    if (ratingSel) ratingSel.value = '';
    applyFiltersFromUI();
    updateFilterBadge();
    document.querySelectorAll('#list-chips .lchip').forEach(b => {
      b.classList.remove('on');
      if ((b.getAttribute('data-filter-typ') || '') === '') b.classList.add('on');
    });
  };

  function updateFilterBadge() {
    const ort = (document.getElementById('filter-ort')?.value || '').trim();
    const typ = (document.getElementById('filter-typ')?.value || '').trim();
    const rating = (document.getElementById('filter-rating')?.value || '').trim();
    const count = [ort, typ, rating].filter(Boolean).length;
    const badge = document.getElementById('filter-badge');
    if (badge) {
      badge.style.display = count ? 'inline-flex' : 'none';
      badge.textContent = count;
    }
  }

  window.changePage = function (delta) {
    const totalPages = Math.ceil(filteredAdvisors.length / PER_PAGE) || 1;
    if (delta === -1) currentPage = Math.max(1, currentPage - 1);
    else if (typeof delta === 'number') currentPage = Math.min(totalPages, Math.max(1, delta));
    renderList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function populateDropdowns() {
    distinctCities = [...new Set(allAdvisors.map(a => a.city).filter(Boolean))].sort();
    distinctKeywords = [...new Set(allAdvisors.map(a => a.role || a.keyword).filter(Boolean))].sort();

    const ortOpts = '<option value="">Alle Orte</option>' +
      distinctCities.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    const typOpts = '<option value="">Alle Typen</option>' +
      distinctKeywords.map(k => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`).join('');

    const ortSelect = document.getElementById('filter-ort');
    const typSelect = document.getElementById('filter-typ');
    if (ortSelect) ortSelect.innerHTML = ortOpts;
    if (typSelect) typSelect.innerHTML = typOpts;

    // Filter-Panel rechts oben (gleiche Optionen)
    const fpOrt = document.getElementById('fp-ort');
    const fpTyp = document.getElementById('fp-typ');
    if (fpOrt) fpOrt.innerHTML = ortOpts;
    if (fpTyp) fpTyp.innerHTML = typOpts;

    // Filter-Chips in der Listenansicht (nur echte Beratertypen)
    const chipContainer = document.querySelector('#list-chips .lc-inner');
    if (chipContainer) {
      chipContainer.innerHTML =
        '<button class="lchip on" data-filter-typ="">Alle Typen</button>' +
        distinctKeywords.map(k => `<button class="lchip" data-filter-typ="${escapeAttr(k)}">${escapeHtml(k)}</button>`).join('');
      chipContainer.querySelectorAll('.lchip').forEach(btn => {
        btn.addEventListener('click', () => {
          chipContainer.querySelectorAll('.lchip').forEach(b => b.classList.remove('on'));
          btn.classList.add('on');
          const typ = btn.getAttribute('data-filter-typ') || '';
          const typSel = document.getElementById('filter-typ');
          if (typSel) typSel.value = typ;
          applyFiltersFromUI();
        });
      });
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

  function applyFiltersFromUI() {
    const ort = (document.getElementById('filter-ort')?.value || '').trim().toLowerCase();
    const typ = (document.getElementById('filter-typ')?.value || '').trim().toLowerCase();
    const ratingMin = parseFloat((document.getElementById('filter-rating')?.value || '').replace(',', '.'));

    let list = allAdvisors.filter(a => {
      if (ort && (a.city || '').toLowerCase() !== ort) return false;
      const aRole = (a.role || a.keyword || '').toLowerCase();
      if (typ && aRole !== typ.toLowerCase()) return false;
      if (!isNaN(ratingMin) && getRatingNum(a) < ratingMin) return false;
      return true;
    });

    if (sortBy === 'rating') {
      list.sort((a, b) => {
        const r = getRatingNum(b) - getRatingNum(a);
        if (r !== 0) return r;
        return getCountNum(b) - getCountNum(a);
      });
    } else if (sortBy === 'count') {
      list.sort((a, b) => getCountNum(b) - getCountNum(a));
    } else if (sortBy === 'stadt') {
      list.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
    }

    filteredAdvisors = list;
    currentPage = 1;
    renderList();

    // Chips mit Dropdown-Werten synchronisieren
    document.querySelectorAll('#list-chips .lchip').forEach(btn => {
      const chipTyp = (btn.getAttribute('data-filter-typ') || '').toLowerCase();
      btn.classList.toggle('on', chipTyp === typ);
    });
    updateFilterBadge();
  }

  function renderAdvisorCard(adv, index) {
    const rating = (adv.rating || '').toString().replace('.', ',');
    const count = adv.rating_count || '0';
    const typ = adv.role_label || adv.role || adv.keyword || '';
    const badges = [];
    if (isTopRated(adv)) badges.push('<span class="badge badge-top">Top bewertet</span>');
    if (hasWebsite(adv)) badges.push('<span class="badge badge-online">Online-Termin möglich</span>');

    const detailUrl = adv.id
      ? `berater-detail.html?id=${encodeURIComponent(adv.id)}`
      : `berater-detail.html?pid=${encodeURIComponent(adv.place_id || '')}`;
    const nameDisplay = escapeHtml(adv.name);

    return `
    <div class="adv-row r" data-adv>
      <div class="adv-info">
        <div class="adv-head">
          <div>
            <div class="adv-name">${nameDisplay}</div>
            <div class="adv-loc">${escapeHtml(typ)} · ${escapeHtml(adv.city || '')}</div>
          </div>
          <div class="badges">${badges.join('')}</div>
        </div>
        <div class="adv-contact">
          ${adv.website ? `<a href="${escapeAttr(adv.website)}" target="_blank" rel="noopener">Website</a>` : ''}
          ${adv.website && adv.phone ? ' · ' : ''}
          ${adv.phone ? `📞 ${escapeHtml(adv.phone)}` : ''}
        </div>
        ${rating ? `<div class="adv-rating">⭐ <strong>${escapeHtml(rating)}</strong> · ${escapeHtml(count)} Bewertungen</div>` : ''}
        ${(adv.insurance_areas || adv.keyword) ? `<div class="spec-chips"><span class="sc">${escapeHtml(adv.insurance_areas || adv.keyword)}</span></div>` : ''}
        <div class="adv-cta">
          <a href="${detailUrl}" class="cta-btn">Profil ansehen</a>
        </div>
      </div>
    </div>`;
  }

  function renderList() {
    const listEl = document.getElementById('adv-list');
    const loadingEl = document.getElementById('adv-loading');
    const countEl = document.getElementById('result-count');
    const pagEl = document.getElementById('pagination');
    const emptyEl = document.getElementById('empty-state');

    if (!listEl) return;

    if (!allAdvisors.length) {
      if (loadingEl) loadingEl.textContent = 'Keine Beraterdaten geladen.';
      if (emptyEl) emptyEl.style.display = 'none';
      return;
    }

    if (loadingEl) loadingEl.remove();

    const total = filteredAdvisors.length;
    const totalPages = Math.ceil(total / PER_PAGE) || 1;
    currentPage = Math.min(currentPage, totalPages) || 1;
    const start = (currentPage - 1) * PER_PAGE;
    const pageAdvisors = filteredAdvisors.slice(start, start + PER_PAGE);

    if (total === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      listEl.innerHTML = pageAdvisors.map((a, i) => renderAdvisorCard(a, start + i)).join('');
    }

    if (countEl) countEl.textContent = `${total} Berater · Seite ${currentPage} von ${totalPages}`;

    if (pagEl) {
      let html = `<button class="pg-btn ${currentPage <= 1 ? 'disabled' : ''}" onclick="changePage(-1)">← Zurück</button>`;
      const showPages = Math.min(7, totalPages);
      let from = Math.max(1, currentPage - 2);
      let to = Math.min(totalPages, from + showPages - 1);
      if (to - from + 1 < showPages) from = Math.max(1, to - showPages + 1);
      for (let p = from; p <= to; p++) {
        html += `<button class="pg-btn ${p === currentPage ? 'active' : ''}" onclick="changePage(${p})">${p}</button>`;
      }
      if (to < totalPages) html += '<span class="pg-ellipsis">…</span>';
      if (to < totalPages) html += `<button class="pg-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
      html += `<button class="pg-btn ${currentPage >= totalPages ? 'disabled' : ''}" onclick="changePage(${currentPage + 1})">Weiter</button>`;
      pagEl.innerHTML = html;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.05 });
    listEl.querySelectorAll('.adv-row.r').forEach(el => io.observe(el));
  }

  function applyUrlParams() {
    const params = new URLSearchParams(location.search);
    const ort = params.get('loc') || params.get('ort') || '';
    const typ = params.get('typ') || '';

    const ortMatch = ort ? distinctCities.find(c => c.toLowerCase() === ort.toLowerCase()) : null;
    [document.getElementById('filter-ort'), document.getElementById('fp-ort')].forEach(el => {
      if (el && ortMatch) el.value = ortMatch;
    });
    [document.getElementById('filter-typ'), document.getElementById('fp-typ')].forEach(el => {
      if (el && typ) el.value = typ;
    });
    document.querySelectorAll('#list-chips .lchip').forEach(btn => {
      btn.classList.toggle('on', (btn.getAttribute('data-filter-typ') || '') === typ);
    });
  }

  function init() {
    allAdvisors = window.ADVISORS_DATA || [];
    populateDropdowns();
    applyUrlParams();
    applyFiltersFromUI();
    renderList();

    // Geführte-Suche-Karte sichtbar machen (hat Klasse .r, braucht .in)
    const nudge = document.getElementById('nudge');
    if (nudge) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0 });
      io.observe(nudge);
    }

    window.addEventListener('scroll', () => {
      document.getElementById('nav')?.classList.toggle('scrolled', scrollY > 40);
    }, { passive: true });

    document.addEventListener('click', (e) => {
      const dd = document.getElementById('filter-dropdown');
      const panel = document.getElementById('filter-panel');
      if (dd && panel?.classList.contains('open') && !dd.contains(e.target)) {
        panel.classList.remove('open');
        document.querySelector('.filter-toggle')?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
