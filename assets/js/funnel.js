let step = 1;
const TOTAL = 4;
const S = { anlassTag:'', anlassLabel:'', zielTag:'', zielLabel:'', modell:'', modellLabel:'', logistik:'', logistikLabel:'' };

// Article DB
const ARTS = {
  '01': { cat:'Grundlagenwissen', title:'Honorarberatung vs. Provision – Die Spielregeln verstehen', desc:'Wie wird die Person bezahlt, die dir gegenübersteht? Sachlicher Überblick über beide Modelle.', time:'3,5 Min', tags:['TraueNicht','UberblickFehlt','Egal'] },
  '02': { cat:'Immobilien', title:'Baufinanzierung – Warum der Zins nicht alles ist', desc:'Zinsbindung, Sondertilgung, Tilgungswechsel – das Korsett ist wichtiger als der Zinssatz.', time:'3 Min', tags:['Hauskauf'] },
  '03': { cat:'Absicherung', title:'Berufsunfähigkeit – Die Versicherung für Ihr wertvollstes Gut', desc:'Jeder vierte Erwerbstätige wird berufsunfähig. Worauf es bei einem guten Vertrag ankommt.', time:'3,5 Min', tags:['Absichern'] },
  '04': { cat:'Altersvorsorge', title:'Altersvorsorge – Warum Zeit wichtiger ist als Timing', desc:'Wer heute vorsorgt, muss investieren – nicht nur sparen. Das Prinzip Weltportfolio erklärt.', time:'3 Min', tags:['GeldVermehren'] },
  '05': { cat:'Zweitmeinung', title:'Die Zweitmeinung – Vertrauen ist gut, Prüfung ist besser', desc:'Eine Zweitmeinung ist professionelle Sorgfalt. Wann und warum sie sinnvoll ist.', time:'3 Min', tags:['FixkostenSenken','TraueNicht'] },
  '09': { cat:'Erbschaft', title:'Erbengemeinschaft & Immobilie – Wenn das Erbe Fragen aufwirft', desc:'Geschwister mit unterschiedlichen Zielen – Konflikte strukturiert lösen.', time:'3,5 Min', tags:['Erbe'] },
  '18': { cat:'Selbstständigkeit', title:'Selbstständig machen – Das finanzielle Sicherheitsnetz', desc:'Die drei Säulen der Gründer-Absicherung.', time:'3,5 Min', tags:['Neustart'] },
  '20': { cat:'Psychologie', title:'Die Psychologie des Geldes – Warum wir oft falsch entscheiden', desc:'Verlustaversion, Herdentrieb, Anker-Effekt – und wie ein Berater hilft.', time:'4 Min', tags:['Sicherheit','UberblickFehlt'] },
};

const MODELS = {
  'Honorar': { ico:'compass', name:'Honorar-Berater', desc:'Sie zahlen direkt – dafür arbeitet der Berater ausschließlich für Sie, ohne Provisionen.' },
  'Makler':  { ico:'telescope', name:'Freier Makler', desc:'Zugang zu hunderten Anbietern, vergütet über Provision – für Sie oft ohne Extrakosten.' },
  'Spezialist': { ico:'target', name:'Spezialist', desc:'Tiefe Expertise in einem Thema – z. B. ausschließlich BU, PKV oder Immobilienfinanzierung.' },
  'Egal':    { ico:'compass', name:'Noch unsicher', desc:'Die Auswertung hilft Ihnen bei der Einordnung.' },
};

function pick(btn, key, tag, label) {
  const opts = btn.closest('.fn-opts');
  if (opts) opts.querySelectorAll('.fn-opt').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  if (key === 'anlass') { S.anlassTag = tag; S.anlassLabel = label; }
  else if (key === 'ziel') { S.zielTag = tag; S.zielLabel = label; }
  else if (key === 'modell') { S.modell = tag; S.modellLabel = label; }
  else if (key === 'logistik') {
    S.logistik = tag; S.logistikLabel = label;
    const plz = document.getElementById('plz-wrap');
    if (plz) plz.style.display = tag === 'vor_ort' ? '' : 'none';
  }
  const nextMap = { anlass:'fn1-next', ziel:'fn2-next', modell:'fn3-next', logistik:'fn4-next' };
  const nb = document.getElementById(nextMap[key]);
  if (nb) { nb.disabled = false; nb.removeAttribute('disabled'); }
}

function updateUI() {
  for (let i = 1; i <= TOTAL; i++) {
    const el = document.getElementById('fs' + i);
    if (el) el.classList.toggle('active', i === step);
    const ls = document.getElementById('ls' + i);
    if (ls) {
      ls.classList.remove('active','done');
      if (i === step) ls.classList.add('active');
      else if (i < step) ls.classList.add('done');
    }
  }
  const fpf = document.getElementById('fpf');
  if (fpf) fpf.style.width = ((step / TOTAL) * 100) + '%';
  const navStep = document.getElementById('nav-step');
  if (navStep) navStep.textContent = `Schritt ${step} von ${TOTAL}`;

  // Weiter-Button aktivieren wenn schon gewählt
  const tagMap = { anlass: S.anlassTag, ziel: S.zielTag, modell: S.modell, logistik: S.logistik };
  const stepKeys = { 1: 'anlass', 2: 'ziel', 3: 'modell', 4: 'logistik' };
  const nextIds = { 1: 'fn1-next', 2: 'fn2-next', 3: 'fn3-next', 4: 'fn4-next' };
  const nb = document.getElementById(nextIds[step]);
  if (nb && tagMap[stepKeys[step]]) { nb.disabled = false; nb.removeAttribute('disabled'); }
}

function nextStep() {
  if (step < TOTAL) { step++; updateUI(); window.scrollTo(0,0); }
}
function prevStep() {
  if (step > 1) { step--; updateUI(); window.scrollTo(0,0); }
}

function getArts(aT, zT) {
  let a1 = null, a2 = null;
  for (const [id, a] of Object.entries(ARTS)) { if (a.tags.includes(aT) && !a1) a1 = { id, ...a }; }
  for (const [id, a] of Object.entries(ARTS)) { if (id === a1?.id) continue; if (a.tags.includes(zT) && !a2) a2 = { id, ...a }; }
  if (!a1) a1 = { id:'01', ...ARTS['01'] };
  if (!a2) a2 = { id:'20', ...ARTS['20'] };
  return [a1, a2];
}

function showResult() {
  // Hide all steps
  for (let i = 1; i <= TOTAL; i++) {
    const el = document.getElementById('fs' + i);
    if (el) el.classList.remove('active');
    const ls = document.getElementById('ls' + i);
    if (ls) ls.classList.remove('active');
    if (ls && i <= TOTAL) ls.classList.add('done');
  }
  document.getElementById('fpf').style.width = '100%';
  document.getElementById('nav-step').textContent = 'Ihre Empfehlung';

  // Build summary
  const city = document.getElementById('fn-plz')?.value;
  const locStr = S.logistik === 'vor_ort' ? ` In der Nähe von <strong>${city || 'Ihrem Ort'}</strong>.`
    : S.logistik === 'digital' ? ' Digital per Video-Call.'
    : ' Örtliche Nähe ist nicht entscheidend.';

  document.getElementById('res-summary').innerHTML =
    `Anlass: <strong>${S.anlassLabel}</strong>. Aktueller Stand: <strong>${S.zielLabel.toLowerCase()}</strong>. Beratungsart: <strong>${S.modellLabel}</strong>.${locStr}`;

  // Model block
  const m = MODELS[S.modell] || MODELS['Egal'];
  document.getElementById('res-model').innerHTML = `
    <div class="res-model-ico"><svg class="ico"><use href="#icon-${m.ico}"></use></svg></div>
    <div class="res-model-body">
      <div class="res-model-name">${m.name}</div>
      <div class="res-model-desc">${m.desc}</div>
      <span class="res-model-badge">Einordnung</span>
    </div>`;

  // Articles
  const [a1, a2] = getArts(S.anlassTag, S.zielTag);
  document.getElementById('res-arts').innerHTML = [a1, a2].map(a => `
    <a href="article.html?id=${a.id}" class="res-art">
      <div class="res-art-cat">${a.cat}</div>
      <div class="res-art-title">${a.title}</div>
      <div class="res-art-desc">${a.desc}</div>
      <div class="res-art-time">${a.time} Lesezeit</div>
      <span class="res-art-link">Weiterlesen</span>
    </a>`).join('');

  document.getElementById('fn-result').classList.add('active');
  window.scrollTo(0, 0);

  // CTA: Beraterliste mit Funnel-Parametern
  const modellMap = { Honorar: 'Vertreter', Makler: 'Makler', Spezialist: 'Honorarberater', Egal: '' };
  const typParam = modellMap[S.modell] || '';
  const cityVal = (document.getElementById('fn-plz')?.value ?? '').trim();
  const params = new URLSearchParams();
  if (typParam) params.set('typ', typParam);
  if (cityVal && S.logistik === 'vor_ort') params.set('loc', cityVal);
  const beraterUrl = 'berater.html' + (params.toString() ? '?' + params.toString() : '');
  const ctaLink = document.querySelector('.res-cta-block a[href="berater.html"]');
  if (ctaLink) ctaLink.href = beraterUrl;
}

function restartFunnel() {
  step = 1;
  Object.keys(S).forEach(k => S[k] = '');
  document.getElementById('fn-result').classList.remove('active');
  document.querySelectorAll('.fn-opt').forEach(b => b.classList.remove('sel'));
  document.querySelectorAll('.fn-next-btn').forEach(b => { b.disabled = true; b.setAttribute('disabled', ''); });
  document.getElementById('plz-wrap').style.display = 'none';
  updateUI();
  window.scrollTo(0, 0);
}

// Globale Zugriff für onclick-Handler
window.pick = pick;
window.nextStep = nextStep;
window.prevStep = prevStep;

// Event-Delegation: Klicks auf Kind-Elemente (SVG, span) werden erkannt
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.fn-opt');
  if (!btn) return;
  const key = btn.dataset.key, tag = btn.dataset.tag, label = btn.dataset.label;
  if (key && tag && label) {
    e.preventDefault();
    pick(btn, key, tag, label);
  }
});

updateUI();
