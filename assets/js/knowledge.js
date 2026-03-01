// Hamburger
function toggleMenu() {
  document.getElementById('burger').classList.toggle('open');
  document.getElementById('nav-mobile').classList.toggle('open');
}

// Filter chips (topics)
let activeTab = 'alle';
function setTab(type, btn) {
  activeTab = type;
  document.querySelectorAll('.kt').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById('art-search').value.toLowerCase();
  document.querySelectorAll('.ac').forEach(card => {
    const text = card.textContent.toLowerCase();
    const topics = card.dataset.topics || '';
    const tabOk = activeTab === 'alle' || topics.includes(activeTab);
    const searchOk = !q || text.includes(q);
    card.style.display = tabOk && searchOk ? '' : 'none';
  });
}

function filterArticles() { applyFilters(); }

// Artikelkarten verlinken
const articleIdByTitle = {
  'Honorarberatung vs. Provision – Die Spielregeln verstehen': '01',
  'Baufinanzierung – Warum der Zins nicht alles ist': '02',
  'Berufsunfähigkeit – Die Versicherung für Ihr wertvollstes Gut': '03',
  'Altersvorsorge – Warum Zeit wichtiger ist als Timing': '04',
  'Die Zweitmeinung – Vertrauen ist gut, Prüfung ist besser': '05',
  'Das Eigenkapital-Mysterium – Wie viel ist wirklich nötig?': '06',
  'Anschlussfinanzierung – Die Ruhe nach dem Zins-Schock': '07',
  'Der Sanierungs-Fahrplan – Altbau mit Zukunft': '08',
  'Erbengemeinschaft & Immobilie – Wenn das Erbe Fragen aufwirft': '09',
  'Risikolebensversicherung – Der Liebesbeweis auf Papier': '10',
  'PKV vs. GKV – Eine Lebensentscheidung, kein Tarifvergleich': '11',
  'Privathaftpflicht – Warum alte Verträge gefährlich sind': '12',
  'Krankentagegeld – Die Lücke, die niemand sieht': '13',
  'Inflation & Ihr Erspartes – Der leise Dieb': '14',
  'Nachhaltiges Investieren (ESG) – Rendite mit Verantwortung': '15',
  'Kinderdepots – Der Zinseszins als Erbe': '16',
  'Gold & Kryptowährungen – Anker oder Abenteuer?': '17',
  'Selbstständig machen – Das finanzielle Sicherheitsnetz': '18',
  'Betriebliche Altersvorsorge (bAV) – Geschenktes Geld?': '19',
  'Die Psychologie des Geldes – Warum wir oft falsch entscheiden': '20',
};

document.querySelectorAll('.ac').forEach(card => {
  card.addEventListener('click', () => {
    const title = card.querySelector('h3')?.textContent?.trim();
    const id = title ? articleIdByTitle[title] : null;
    location.href = id ? `article.html?id=${id}` : 'article.html';
  });
});

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach((e, i) => {
  if (e.isIntersecting) {
    setTimeout(() => e.target.classList.add('in'), i * 55);
    io.unobserve(e.target);
  }
}), { threshold: .07 });
document.querySelectorAll('.r').forEach(el => io.observe(el));
