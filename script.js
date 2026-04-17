// ══════════════════════════════════════════
// CONTENT LOADER — lit les fichiers JSON
// et met à jour la page sans toucher au code
// ══════════════════════════════════════════
async function loadContent() {
  try {
    const [general, about, equip, prestations, materiel] = await Promise.all([
      fetch('/data/general.json').then(r => r.json()),
      fetch('/data/about.json').then(r => r.json()),
      fetch('/data/equipements.json').then(r => r.json()),
      fetch('/data/prestations.json').then(r => r.json()),
      fetch('/data/materiel.json').then(r => r.json())
    ]);

    // Titre de l'onglet
    if (general.site_title) document.title = general.site_title;

    // Textes simples via data-edit
    const data = { ...general, ...about };
    document.querySelectorAll('[data-edit]').forEach(el => {
      const key = el.dataset.edit;
      if (data[key] !== undefined) el.textContent = data[key];
    });

    // Lien href email
    document.querySelectorAll('[data-edit-href="contact_email"]').forEach(el => {
      if (general.contact_email) el.href = 'mailto:' + general.contact_email;
    });

    // Stats hero
    const stats = document.querySelectorAll('.hs');
    const statData = [
      { v: general.stat1_value, l: general.stat1_label },
      { v: general.stat2_value, l: general.stat2_label },
      { v: general.stat3_value, l: general.stat3_label }
    ];
    stats.forEach((el, i) => {
      if (!statData[i]) return;
      const strong = el.querySelector('strong');
      const span   = el.querySelector('span');
      if (strong && statData[i].v) strong.textContent = statData[i].v;
      if (span   && statData[i].l) span.textContent   = statData[i].l;
    });

    // Tags musicaux (about)
    const tagsWrap = document.querySelector('.about-tags');
    if (tagsWrap && about.tags && about.tags.length) {
      tagsWrap.innerHTML = about.tags.map(t => `<span>${t}</span>`).join('');
    }

    // Liste équipements (loc-list)
    const locList = document.querySelector('.loc-list');
    if (locList && equip.items && equip.items.length) {
      locList.innerHTML = equip.items.map(eq => `
        <div class="loc-row">
          <div class="loc-row-icon">${eq.emoji}</div>
          <div class="loc-row-name">
            <h4>${eq.nom}</h4>
            <span>${eq.modele}</span>
          </div>
          <div class="loc-row-tags">
            <span>${eq.spec1}</span>
            <span>${eq.spec2}</span>
            <span>${eq.spec3}</span>
          </div>
          <div class="loc-row-price"><strong>${eq.prix} €</strong><em>/ jour</em></div>
          <a href="#devis" class="loc-row-btn">Réserver</a>
        </div>`).join('');

      // Mettre à jour aussi les checkboxes du formulaire
      const checkGrid = document.querySelector('.form-check-grid');
      if (checkGrid) {
        const tick = `<div class="fcheck-tick"><svg viewBox="0 0 12 10" fill="none"><polyline points="1,5 4.5,9 11,1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
        const regularItems = equip.items.map(eq => `
          <label class="form-check">
            <input type="checkbox" name="equipement[]" value="${eq.nom} ${eq.modele} — ${eq.prix}€/j" />
            ${tick}
            <div class="fcheck-icon">${eq.emoji}</div>
            <div class="fcheck-body"><strong>${eq.nom}</strong><span>${eq.modele}</span></div>
            <div class="fcheck-price">${eq.prix} €<em>/j</em></div>
          </label>`).join('');
        const packItem = `
          <label class="form-check form-check--featured">
            <input type="checkbox" name="equipement[]" value="Pack Sono Complète (tout inclus) — 390€/j" />
            ${tick}
            <div class="fcheck-icon">⭐</div>
            <div class="fcheck-body"><strong>Pack Sono Complète</strong><span>Tout inclus · Livraison · Installation</span></div>
            <div class="fcheck-price fcheck-price--big">390 €<em>/j</em></div>
          </label>`;
        checkGrid.innerHTML = regularItems + packItem;
      }
    }

    // Prestations — titres, descriptions, points
    ['mariage','prive','club','entreprise'].forEach(tab => {
      if (!prestations[tab]) return;
      const p = prestations[tab];
      const panel = document.querySelector(`.ptab-panel[data-panel="${tab}"]`);
      if (!panel) return;
      const h3 = panel.querySelector('h3');
      const desc = panel.querySelector('.ppanel-content > p');
      const items = panel.querySelectorAll('.ppanel-list li');
      if (h3 && p.titre) h3.textContent = p.titre;
      if (desc && p.description) desc.textContent = p.description;
      ['point1','point2','point3','point4','point5'].forEach((key, i) => {
        if (items[i] && p[key]) items[i].textContent = p[key];
      });
    });

    // Matériel inclus (bande strip)
    const matItems = document.querySelector('.mat-items');
    if (matItems && materiel.items && materiel.items.length) {
      matItems.innerHTML = materiel.items
        .map(m => `<div class="mat-item"><span>${m.emoji}</span> ${m.texte}</div>`)
        .join('');
    }

  } catch(e) {
    // Le site fonctionne normalement avec le contenu HTML si le JSON est indisponible
    console.info('Mode statique (JSON non chargé)');
  }
}
loadContent();

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── HAMBURGER ──
const hamburger = document.getElementById('hamburger');
const navLinksList = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => navLinksList.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a =>
  a.addEventListener('click', () => navLinksList.classList.remove('open'))
);

// ── NAVBAR INDICATOR ──
const navIndicator = document.getElementById('navIndicator');
const navAnchors   = document.querySelectorAll('.nav-links a[data-section]');
const sections     = document.querySelectorAll('section[id]');

function moveNavIndicator(el) {
  if (!el || el.classList.contains('btn-nav')) { navIndicator.style.opacity = '0'; return; }
  const listRect = navLinksList.getBoundingClientRect();
  const elRect   = el.getBoundingClientRect();
  navIndicator.style.opacity = '1';
  navIndicator.style.left  = (elRect.left - listRect.left) + 'px';
  navIndicator.style.width = elRect.width + 'px';
}
function updateActiveNav() {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 160) current = s.id; });
  navAnchors.forEach(a => {
    a.classList.toggle('nav-active', a.dataset.section === current);
    if (a.dataset.section === current) moveNavIndicator(a);
  });
  if (!current) navIndicator.style.opacity = '0';
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
navAnchors.forEach(a => {
  a.addEventListener('mouseenter', () => moveNavIndicator(a));
  a.addEventListener('mouseleave', updateActiveNav);
});
updateActiveNav();

// ── PRESTATIONS TABS ──
const ptabs   = document.querySelectorAll('.ptab');
const ppanels = document.querySelectorAll('.ptab-panel');
const pslider = document.getElementById('ptabSlider');
const ptabList = document.querySelector('.ptab-list');

function movePSlider(btn) {
  if (!pslider || !ptabList) return;
  const listRect = ptabList.getBoundingClientRect();
  const btnRect  = btn.getBoundingClientRect();
  pslider.style.left  = (btnRect.left - listRect.left + ptabList.scrollLeft) + 'px';
  pslider.style.width = btnRect.width + 'px';
}
function activatePTab(btn) {
  const target = btn.dataset.tab;
  ptabs.forEach(t => t.classList.remove('active'));
  ppanels.forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelector(`.ptab-panel[data-panel="${target}"]`).classList.add('active');
  movePSlider(btn);
}
ptabs.forEach(btn => btn.addEventListener('click', () => activatePTab(btn)));
window.addEventListener('load', () => {
  const activeTab = document.querySelector('.ptab.active');
  if (activeTab) movePSlider(activeTab);
});
window.addEventListener('resize', () => {
  const activeTab = document.querySelector('.ptab.active');
  if (activeTab) movePSlider(activeTab);
}, { passive: true });

// ── SCROLL REVEAL ──
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    entry.target.style.transition = `opacity .6s ease ${i * 80}ms, transform .6s ease ${i * 80}ms`;
    entry.target.style.opacity = '1';
    entry.target.style.transform = 'translateY(0)';
    revealIO.unobserve(entry.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.dstep, .about-badge, .about-tags span, .mat-item, .loc-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  revealIO.observe(el);
});

// ── FORM TYPE TOGGLE ──
const fttRadios  = document.querySelectorAll('input[name="type_demande"]');
const fttLabels  = document.querySelectorAll('.ftt-option');
const secPresta  = document.getElementById('section-prestation');
const secLocation= document.getElementById('section-location');

fttRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const isLocation = radio.value === "Location d'équipement";
    // sections
    secPresta.classList.toggle('hidden', isLocation);
    secLocation.classList.toggle('hidden', !isLocation);
    // style actif
    fttLabels.forEach(l => l.classList.remove('ftt-active'));
    radio.closest('.ftt-option').classList.add('ftt-active');
  });
});

// ── DEVIS FORM ──
const devisForm = document.getElementById('devisForm');
if (devisForm) {
  devisForm.addEventListener('submit', function(e) {
    // Netlify gère la soumission — on affiche juste le succès après
    const btn = this.querySelector('button[type="submit"]');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    // Si Netlify est actif, la page se recharge ; sinon fallback JS
    setTimeout(() => {
      document.getElementById('formSuccess').classList.remove('hidden');
      this.reset();
      btn.textContent = 'Envoyer ma demande →';
      btn.disabled = false;
    }, 1400);
  });
}
