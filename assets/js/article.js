// Nav scroll, Reading progress, TOC scroll-tracking
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('scrolled', scrollY > 40);
  const doc = document.documentElement;
  const pct = (scrollY / Math.max(1, doc.scrollHeight - doc.clientHeight)) * 100;
  const progress = document.getElementById('progress');
  if (progress) progress.style.width = Math.min(pct, 100) + '%';
  const headings = document.querySelectorAll('.prose h2');
  let activeId = null;
  headings.forEach(h => { if (h.offsetTop - 120 <= scrollY) activeId = h.id; });
  document.querySelectorAll('.toc-item').forEach(i => {
    const a = i.querySelector('a');
    i.classList.toggle('active', a && a.getAttribute('href') === '#' + activeId);
  });
}, { passive: true });

window.toggleMenu = function () {
  document.getElementById('burger')?.classList.toggle('open');
  document.getElementById('nav-mobile')?.classList.toggle('open');
};
window.closeMenu = function () {
  document.getElementById('burger')?.classList.remove('open');
  document.getElementById('nav-mobile')?.classList.remove('open');
};

const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.06 });
document.querySelectorAll('.r').forEach(el => io.observe(el));

// Artikel-Rendering (Single-File SPA: article.html?id=01 bis id=20)
(() => {
  const ARTICLES = window.ARTICLES || [];
  if (!ARTICLES.length) return;

  const params = new URLSearchParams(location.search);
  const id = (params.get('id') || '01').padStart(2, '0');
  const article = ARTICLES.find(a => a.id === id) || ARTICLES[0];
  const idx = ARTICLES.findIndex(a => a.id === id);
  const nextArt = idx >= 0 && idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

  // Related: gleiche Kategorie, ohne aktuellen; Fallback: andere Artikel
  let related = ARTICLES.filter(a => a.category === article.category && a.id !== article.id);
  if (related.length === 0) related = ARTICLES.filter(a => a.id !== article.id);
  related = related.slice(0, 3);

  // Header
  const [main, sub] = (article.title || '').split(' – ');
  document.title = (article.title || 'Artikel') + ' – Beraterwahl';
  const titleEl = document.querySelector('.art-header h1');
  if (titleEl) titleEl.innerHTML = main ? `${main} –<br><em>${sub || ''}</em>` : article.title;

  const introEl = document.querySelector('.art-intro');
  if (introEl) {
    const m = (article.html || '').match(/<p>([^<]+)</);
    introEl.textContent = m ? m[1].replace(/<[^>]+>/g, '') : (article.preview || '');
  }

  document.querySelector('.breadcrumb-cur')?.setAttribute('data-cat', article.category);
  const catEl = document.querySelector('.art-cat');
  if (catEl) catEl.textContent = article.category || '';

  const seriesEl = document.querySelector('.art-series');
  if (seriesEl) seriesEl.textContent = `Artikel ${parseInt(article.id, 10)} von ${ARTICLES.length}`;

  const metaEls = document.querySelectorAll('.art-meta-item');
  if (metaEls.length >= 3) {
    metaEls[0].textContent = `⏱ Lesezeit: ${(article.readTime || '').replace('ca. ', '').replace(' Minuten', ' Min')}`;
    metaEls[1].textContent = 'Zuletzt aktualisiert: März 2025';
    metaEls[2].textContent = 'Ohne Werbung';
  }

  // Prose
  const proseEl = document.querySelector('.prose');
  if (proseEl && article.html) proseEl.innerHTML = article.html;

  // TOC aus article.toc
  const toc = article.toc || [];
  const tocList = document.querySelector('.toc-list');
  if (tocList) {
    tocList.innerHTML = toc.map(t => `<li class="toc-item"><a href="#${t.id}">${t.label}</a></li>`).join('');
  }

  // Breadcrumb-Kategorie setzen
  const bcCur = document.querySelector('.breadcrumb-cur');
  if (bcCur && article.category) bcCur.textContent = article.category;

  // Sidebar Info-Card
  const aicVals = document.querySelectorAll('.aic-val');
  if (aicVals.length >= 4) {
    aicVals[0].textContent = article.category || '';
    aicVals[1].textContent = (article.readTime || '').replace('ca. ', 'ca. ');
    aicVals[2].textContent = article.focus || 'Alle Interessierten';
    aicVals[3].textContent = 'Neutral, ohne Produktplatzierung';
  }

  // Tags
  const tags = article.tags || [];
  const tagsEl = document.querySelector('.art-tags');
  if (tagsEl) tagsEl.innerHTML = tags.map(t => `<span class="art-tag">${escapeHtml(t)}</span>`).join('');

  // Related (gleiche Kategorie)
  const relGrid = document.getElementById('related-grid') || document.querySelector('.related-grid');
  if (relGrid) {
    relGrid.innerHTML = related.map(a => `
      <a href="article.html?id=${a.id}" class="related-card">
        <div class="rc-cat">${escapeHtml(a.category)}</div>
        <div class="rc-title">${escapeHtml(a.title)}</div>
        <div class="rc-time">${(a.readTime || '').replace('ca. ', '').replace(' Minuten', ' Min')}</div>
        <span class="rc-read">Weiterlesen</span>
      </a>`).join('');
  }

  // Next + Back
  const nextLink = document.getElementById('next-art-link') || document.querySelector('.next-art');
  if (nextLink) {
    if (nextArt) {
      nextLink.href = `article.html?id=${nextArt.id}`;
      nextLink.textContent = `Nächster Artikel: ${nextArt.title.split(' – ')[0]}`;
      nextLink.style.display = '';
    } else nextLink.style.display = 'none';
  }

  document.querySelector('.back-link')?.setAttribute('href', 'knowledge.html');

  // Funnel nudge + CTA bleiben statisch

  function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
