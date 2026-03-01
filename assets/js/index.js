// NAV scroll
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', scrollY > 40);
}, { passive: true });

// Hamburger menu
function toggleMenu() {
  const b = document.getElementById('burger');
  const m = document.getElementById('nav-mobile');
  b.classList.toggle('open');
  m.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('burger').classList.remove('open');
  document.getElementById('nav-mobile').classList.remove('open');
}

// FAQ
function faq(t) {
  const item = t.closest('.fq');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.fq').forEach(f => f.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach((e, i) => {
  if (e.isIntersecting) {
    setTimeout(() => e.target.classList.add('in'), i * 60);
    io.unobserve(e.target);
  }
}), { threshold: .08 });
document.querySelectorAll('.r').forEach(el => io.observe(el));

function goSearch() {
  const q = document.querySelector('.hs-input')?.value.trim();
  const loc = document.querySelector('.hs-city')?.value?.trim() || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (loc) params.set('loc', loc);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  location.href = `berater.html${suffix}`;
}

const searchBtn = document.querySelector('.hs-btn');
if (searchBtn) {
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    goSearch();
  });
}
document.querySelectorAll('.hs-input').forEach((input) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goSearch();
    }
  });
});

const articleIdByTitle = {
  'Honorarberatung vs. Provision – Die Spielregeln verstehen': '01',
  'PKV vs. GKV – Eine Lebensentscheidung, kein Tarifvergleich': '11',
  'Das Eigenkapital-Mysterium – Wie viel ist wirklich nötig?': '06',
};

document.querySelectorAll('.kc').forEach((card) => {
  card.addEventListener('click', () => {
    const title = card.querySelector('h3')?.textContent?.trim();
    const id = title ? articleIdByTitle[title] : null;
    location.href = id ? `article.html?id=${id}` : 'article.html';
  });
});
