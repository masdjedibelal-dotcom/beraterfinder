(function () {
  const TRANSPARENZ = {
    'Makler': 'Arbeitet im Auftrag des Kunden und erhält im Regelfall eine Vermittlungsprovision vom Versicherer.',
    'Vertreter': 'Arbeitet im Auftrag einer Versicherungsgesellschaft.',
    'Honorarberater': 'Wird direkt vom Kunden vergütet, unabhängig von Produktabschlüssen.',
    'Versicherungsmakler': 'Arbeitet im Auftrag des Kunden und erhält im Regelfall eine Vermittlungsprovision vom Versicherer.',
    'Versicherungsagentur': 'Arbeitet im Auftrag einer Versicherungsgesellschaft.',
    'Versicherungsberater': 'Wird direkt vom Kunden vergütet, unabhängig von Produktabschlüssen.'
  };

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }

  window.toggleMenu = function () {
    document.getElementById('burger')?.classList.toggle('open');
    document.getElementById('nav-mobile')?.classList.toggle('open');
  };
  window.closeMenu = function () {
    document.getElementById('burger')?.classList.remove('open');
    document.getElementById('nav-mobile')?.classList.remove('open');
  };

  function render(adv) {
    const typ = adv.role || adv.keyword || '';
    const typLabel = adv.role_label || typ;
    const trans = TRANSPARENZ[typ] || TRANSPARENZ[adv.keyword] || '';
    const rating = (adv.rating || '').toString().replace('.', ',');
    const count = adv.rating_count || '0';

    const einordnung = (typ === 'Makler' || typ === 'Versicherungsmakler')
      ? `Unabhängiger Makler mit Sitz in ${esc(adv.city || 'Deutschland')}. Berät Kunden zu Versicherungen verschiedener Anbieter.`
      : (typ === 'Vertreter' || typ === 'Versicherungsagentur')
      ? `Versicherungsvertreter mit Sitz in ${esc(adv.city || 'Deutschland')}. Vertreibt Produkte einer oder mehrerer Versicherungsgesellschaften.`
      : (typ === 'Honorarberater' || typ === 'Versicherungsberater')
      ? `Honorarberater mit Sitz in ${esc(adv.city || 'Deutschland')}. Berät Kunden gegen festes Honorar.`
      : `Beratungsstelle mit Sitz in ${esc(adv.city || '')}.`;

    let html = `
    <header class="bd-header">
      <h1 class="bd-name">${esc(adv.name)}</h1>
      <div class="bd-meta">${esc(typLabel)} · ${esc(adv.city || '')}</div>
      ${rating ? `<div class="bd-rating">⭐ <strong>${esc(rating)}</strong> · ${esc(count)} Bewertungen</div>` : ''}
      <div class="bd-ctas">
        ${adv.website ? `<a href="${escAttr(adv.website)}" target="_blank" rel="noopener" class="bd-btn bd-btn-pri">Website öffnen</a>` : ''}
        ${adv.phone ? `<a href="tel:${escAttr(adv.phone.replace(/\s/g, ''))}" class="bd-btn bd-btn-sec">Anrufen</a>` : ''}
      </div>
    </header>

    <section class="bd-section">
      <h2>Einordnung</h2>
      <p class="bd-einordnung">${einordnung}</p>
    </section>

    <section class="bd-section bd-facts">
      <h2>Infos</h2>
      <dl>
        <dt>Beraterart</dt>
        <dd>${esc(typLabel)}</dd>
        ${adv.insurance_areas ? `<dt>Schwerpunkte</dt><dd>${esc(adv.insurance_areas)}</dd>` : ''}
        <dt>Standort</dt>
        <dd>${adv.address ? esc(adv.address) : esc(adv.city || '–')}</dd>
        ${adv.phone ? `<dt>Telefon</dt><dd><a href="tel:${escAttr(adv.phone.replace(/\s/g, ''))}">${esc(adv.phone)}</a></dd>` : ''}
        ${adv.google_maps_url ? `<dt>Karte</dt><dd><a href="${escAttr(adv.google_maps_url)}" target="_blank" rel="noopener">Auf Google Maps anzeigen</a></dd>` : ''}
      </dl>
    </section>

    ${trans ? `
    <section class="bd-section bd-transparenz">
      <p class="bd-trans-text">${esc(trans)}</p>
    </section>
    ` : ''}
    `;

    return html;
  }

  function init() {
    const params = new URLSearchParams(location.search);
    const id = (params.get('id') || '').trim();
    const pid = (params.get('pid') || '').trim();
    const data = window.ADVISORS_DATA || [];
    const adv = id ? data.find(a => (a.id || '') === id) : data.find(a => (a.place_id || '') === pid);

    const contentEl = document.getElementById('bd-content');
    const notFoundEl = document.getElementById('bd-notfound');

    if (!adv) {
      if (contentEl) contentEl.innerHTML = '';
      if (notFoundEl) notFoundEl.style.display = 'block';
      document.title = 'Berater nicht gefunden – Beraterwahl';
      return;
    }

    if (contentEl) contentEl.innerHTML = render(adv);
    if (notFoundEl) notFoundEl.style.display = 'none';
    document.title = `${adv.name} – Beraterwahl`;

    window.addEventListener('scroll', () => {
      document.getElementById('nav')?.classList.toggle('scrolled', scrollY > 40);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
