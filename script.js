/* ==========================================================================
   NAUNET LABS — script.js (v2)
   Módulos:
     1. Carga de datos (products.json / config.json / docs.json)
     2. Navegación (menú móvil, sidebar, scroll reveal)
     3. Carrusel de catálogo (6 productos por página, flechas)
     4. Lightbox de galería
     5. Vista detallada de producto + sección de descargas
     6. Página de documentación (docs.html)
     7. Formulario de contacto + redes sociales
     8. Init
   ========================================================================== */

const CATEGORY_LABELS = { app: "App", ejecutable: "Ejecutable", extension: "Extensión" };
const PAGE_SIZE = 6;

/* ---------- 1. CARGA DE DATOS -------------------------------------------- */
async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();
  return data.products;
}
async function loadConfig() {
  const res = await fetch("config.json");
  return res.json();
}
async function loadDocs() {
  const res = await fetch("docs.json");
  return res.json();
}

/* ---------- 2. NAVEGACIÓN ------------------------------------------------- */
function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar && backdrop) {
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("is-open");
      backdrop.classList.remove("is-open");
    });
  }
  const yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => observer.observe(el));
}

/* ---------- 3. CARRUSEL DE CATÁLOGO --------------------------------------- */
function productCardHTML(product) {
  return `
    <article class="card product-card" data-category="${product.category}" data-id="${product.id}" tabindex="0" role="button" aria-label="Ver detalle de ${product.name}">
      <div class="product-card-top">
        <span class="tag">${CATEGORY_LABELS[product.category] || product.category}</span>
        <span class="product-card-id">#${product.id}</span>
      </div>
      <h3>${product.name}</h3>
      <p class="description">${product.description}</p>
      <div class="product-card-meta">
        <span>v${product.specifications.version}</span>
        <span>${product.specifications.platform}</span>
      </div>
    </article>
  `;
}

function initCarousel(allProducts) {
  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  if (!track) return;

  let currentPage = 0;

  function chunk(list, size) {
    const pages = [];
    for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
    return pages;
  }

  function paint(list) {
    const pages = chunk(list, PAGE_SIZE);
    track.innerHTML = pages.map(page => `<div class="carousel-page">${page.map(productCardHTML).join("")}</div>`).join("") || `<div class="carousel-page"><p style="color:var(--grey-600);">No hay productos en esta categoría todavía.</p></div>`;

    track.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("click", () => { window.location.href = `product-detail.html?id=${card.dataset.id}`; });
      card.addEventListener("keydown", (e) => { if (e.key === "Enter") window.location.href = `product-detail.html?id=${card.dataset.id}`; });
    });

    dotsWrap.innerHTML = pages.map((_, i) => `<button class="carousel-dot ${i === 0 ? "is-active" : ""}" data-page="${i}" aria-label="Página ${i + 1}"></button>`).join("");
    currentPage = 0;
    updateArrows(pages.length);

    dotsWrap.querySelectorAll(".carousel-dot").forEach(dot => {
      dot.addEventListener("click", () => goToPage(Number(dot.dataset.page), pages.length));
    });
  }

  function updateArrows(totalPages) {
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    dotsWrap.querySelectorAll(".carousel-dot").forEach((dot, i) => dot.classList.toggle("is-active", i === currentPage));
  }

  function goToPage(index, totalPages) {
    currentPage = Math.max(0, Math.min(index, totalPages - 1));
    track.scrollTo({ left: currentPage * track.clientWidth, behavior: "smooth" });
    updateArrows(totalPages);
  }

  prevBtn.addEventListener("click", () => goToPage(currentPage - 1, track.children.length));
  nextBtn.addEventListener("click", () => goToPage(currentPage + 1, track.children.length));

  paint(allProducts);

  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const filter = chip.dataset.filter;
      paint(filter === "all" ? allProducts : allProducts.filter(p => p.category === filter));
    });
  });

  document.querySelectorAll(".sidebar-link[data-filter]").forEach(link => {
    link.addEventListener("click", () => {
      const filter = link.dataset.filter;
      paint(filter === "all" ? allProducts : allProducts.filter(p => p.category === filter));
      chips.forEach(c => c.classList.toggle("is-active", c.dataset.filter === filter));
      document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
    });
  });

  const statEls = [document.getElementById("statProducts"), document.getElementById("statProductsTable")];
  statEls.forEach(el => { if (el) el.textContent = allProducts.length; });
}

/* ---------- 4. LIGHTBOX DE GALERÍA ---------------------------------------- */
const Lightbox = (() => {
  let images = [];
  let index = 0;
  let overlay, frame, counter;

  function init() {
    overlay = document.getElementById("lightboxOverlay");
    if (!overlay) return;
    frame = document.getElementById("lightboxFrame");
    counter = document.getElementById("lightboxCounter");
    document.getElementById("lightboxClose").addEventListener("click", close);
    document.getElementById("lightboxPrev").addEventListener("click", () => move(-1));
    document.getElementById("lightboxNext").addEventListener("click", () => move(1));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });
  }

  function render() {
    const src = images[index];
    frame.innerHTML = `<img src="${src}" alt="Imagen ${index + 1}" onerror="this.parentElement.textContent='Vista previa no disponible — ${src}'">`;
    counter.textContent = `${index + 1} / ${images.length}`;
  }

  function open(list, startIndex) {
    if (!overlay) return;
    images = list;
    index = startIndex;
    render();
    overlay.classList.add("is-open");
  }
  function close() { overlay.classList.remove("is-open"); }
  function move(delta) { index = (index + delta + images.length) % images.length; render(); }

  return { init, open };
})();

/* ---------- 5. VISTA DETALLADA DE PRODUCTO -------------------------------- */
function renderProductDetail(product) {
  document.title = `${product.name} — Naunet Labs`;
  const root = document.getElementById("productDetailRoot");
  if (!root || !product) return;

  const publicSpecs = Object.entries(product.specifications).filter(([key]) => key !== "internalPricing");
  const specsRows = publicSpecs.map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join("");

  const featuresHTML = product.features.map(f => `<li>${f}</li>`).join("");

  const galleryHTML = (product.images || []).map((src, i) =>
    `<div class="gallery-item" data-index="${i}" role="button" tabindex="0" aria-label="Ampliar captura ${i + 1}">
       <img src="${src}" alt="Captura ${i + 1} de ${product.name}" onerror="this.parentElement.textContent='IMG · ${product.id}-${i + 1}'">
     </div>`
  ).join("");

  const faqHTML = product.faq.map((item, i) => `
    <div class="faq-item" data-faq-index="${i}">
      <button class="faq-question">${item.question} <span class="faq-icon">+</span></button>
      <div class="faq-answer"><p>${item.answer}</p></div>
    </div>
  `).join("");

  const paidBanner = product.isPaid
    ? `<div class="download-paid-banner">
         <div><strong>${product.name} es un producto de pago</strong><br><span>Puedes probarlo antes de decidir.</span></div>
         <span class="tag tag--red">Prueba gratuita disponible abajo</span>
       </div>`
    : "";

  const downloadItems = [];
  if (product.downloadFiles?.executable) {
    downloadItems.push({ icon: "EXE", label: product.downloadFiles.executable.label, url: product.downloadFiles.executable.url, sub: "Archivo de instalación" });
  }
  if (product.downloadFiles?.readme) {
    downloadItems.push({ icon: "MD", label: product.downloadFiles.readme.label, url: product.downloadFiles.readme.url, sub: "Léeme" });
  }
  downloadItems.push({ icon: "DOC", label: "Documentación completa", url: `docs.html?id=${product.id}`, sub: "Guía, configuración y FAQ" });

  const downloadsHTML = downloadItems.map(d => `
    <a class="download-item" href="${d.url}">
      <span class="download-icon">${d.icon}</span>
      <span class="download-meta"><strong>${d.label}</strong><span>${d.sub}</span></span>
    </a>
  `).join("");

  const reviewsHTML = product.reviews?.enabled
    ? `<div class="review-note"><p>Todavía no hay reseñas para este producto. La función de reseñas estará disponible próximamente.</p></div>`
    : "";

  root.innerHTML = `
    <section class="product-hero">
      <div class="container">
        <a href="index.html#productos" class="button--text">← Volver al catálogo</a>
        <div class="product-hero-top" style="margin-top:20px;">
          <div>
            <span class="tag">${CATEGORY_LABELS[product.category] || product.category}</span>
            <h1 style="margin-top:14px;">${product.name}</h1>
            <p class="value-prop">${product.valueProposition}</p>
            <div class="product-hero-actions">
              <a href="#descargas" class="button button--primary">Descargar prueba gratuita</a>
              <a href="docs.html?id=${product.id}" class="button button--ghost">Ver documentación</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--tight section--white">
      <div class="container grid--split grid">
        <div>
          <p class="eyebrow">Especificaciones técnicas</p>
          <table class="spec-table">${specsRows}</table>
        </div>
        <div>
          <p class="eyebrow">Características clave</p>
          <ul class="feature-list">${featuresHTML}</ul>
        </div>
      </div>
    </section>

    <section class="section section--tight section--grey">
      <div class="container">
        <p class="eyebrow">Galería</p>
        <div class="gallery">${galleryHTML}</div>
      </div>
    </section>

    <section class="section section--tight section--white" id="descargas">
      <div class="container">
        <p class="eyebrow">Descargas</p>
        ${paidBanner}
        <div class="download-list">${downloadsHTML}</div>
        <p class="section-subtitle" style="margin-top:24px;">${product.guide}</p>
      </div>
    </section>

    <section class="section section--tight section--grey" id="faq-${product.id}">
      <div class="container">
        <p class="eyebrow">Preguntas frecuentes</p>
        <div id="faqList">${faqHTML}</div>
      </div>
    </section>

    <section class="section section--tight section--white">
      <div class="container">
        <p class="eyebrow">Reseñas</p>
        ${reviewsHTML}
      </div>
    </section>
  `;

  root.querySelectorAll(".faq-item").forEach(item => {
    item.querySelector(".faq-question").addEventListener("click", () => item.classList.toggle("is-open"));
  });

  const galleryImages = product.images || [];
  root.querySelectorAll(".gallery-item").forEach(el => {
    const openFn = () => Lightbox.open(galleryImages, Number(el.dataset.index));
    el.addEventListener("click", openFn);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") openFn(); });
  });
}

async function initProductDetailPage() {
  const products = await loadProducts();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = products.find(p => p.id === id) || products[0];
  if (!product) {
    document.getElementById("productDetailRoot").innerHTML =
      `<div class="container" style="padding-top:160px;padding-bottom:80px;"><p class="eyebrow">Error</p><h1 class="section-title">Producto no encontrado</h1></div>`;
    return;
  }
  renderProductDetail(product);
}

/* ---------- 6. PÁGINA DE DOCUMENTACIÓN ------------------------------------ */
async function initDocsPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const [products, docs] = await Promise.all([loadProducts(), loadDocs()]);
  const product = products.find(p => p.id === id);
  const backLink = document.getElementById("backToProduct");
  if (backLink) backLink.href = id ? `product-detail.html?id=${id}` : "index.html";

  const titleEl = document.getElementById("docTitle");
  const eyebrowEl = document.getElementById("docEyebrow");
  const listEl = document.getElementById("docSectionsList");
  if (!product) {
    if (titleEl) titleEl.textContent = "Documentación no encontrada";
    return;
  }
  if (titleEl) titleEl.textContent = `Documentación de ${product.name}`;
  if (eyebrowEl) eyebrowEl.textContent = "Documentación";

  const sections = docs[id]?.docSections || [];
  if (!sections.length) {
    listEl.innerHTML = `<div class="review-note"><p>Todavía no hay documentación ampliada para este producto.</p></div>`;
    return;
  }
  listEl.innerHTML = sections.map((s, i) => `
    <div class="faq-item" data-doc-index="${i}">
      <button class="faq-question">${s.title} <span class="faq-icon">+</span></button>
      <div class="faq-answer" style="max-height:none; height:0;"><p style="padding-bottom:20px;">${s.content}</p></div>
    </div>
  `).join("");

  listEl.querySelectorAll(".faq-item").forEach(item => {
    const answer = item.querySelector(".faq-answer");
    item.querySelector(".faq-question").addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      answer.style.maxHeight = isOpen ? "600px" : "0";
    });
  });
}

/* ---------- 7. FORMULARIO DE CONTACTO + REDES SOCIALES --------------------- */
function validateField(input, isValid) {
  const field = input.closest(".form-field");
  field.classList.toggle("has-error", !isValid);
  return isValid;
}

function initContactForm(config) {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cf-name");
    const email = document.getElementById("cf-email");
    const message = document.getElementById("cf-message");

    let valid = true;
    valid = validateField(name, name.value.trim().length > 0) && valid;
    valid = validateField(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) && valid;
    valid = validateField(message, message.value.trim().length > 0) && valid;
    if (!valid) return;

    try {
      if (config.contactForm?.endpoint && !config.contactForm.endpoint.includes("TU_ID_AQUI")) {
        await fetch(config.contactForm.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
      }
    } catch (err) {
      console.error("No se pudo enviar el formulario:", err);
    }

    form.reset();
    document.getElementById("contactSuccess").classList.add("is-visible");
  });
}

function renderSocialLinks(config) {
  const wrap = document.getElementById("socialLinks");
  if (!wrap) return;
  wrap.innerHTML = config.social.map(s => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}">${s.name[0]}</a>`).join("");
}

/* ---------- 8. INIT --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  Lightbox.init();

  try {
    if (document.getElementById("carouselTrack")) {
      const products = await loadProducts();
      initCarousel(products);
    }
    if (document.getElementById("productDetailRoot")) {
      await initProductDetailPage();
    }
    if (document.getElementById("docSectionsList")) {
      await initDocsPage();
    }
    if (document.getElementById("contactForm")) {
      const config = await loadConfig();
      renderSocialLinks(config);
      initContactForm(config);
    }
  } catch (err) {
    console.error("Error cargando datos:", err);
  }

  initScrollReveal();
});
