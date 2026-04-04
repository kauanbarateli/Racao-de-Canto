/* ============================================================
   RAÇÃO DE CANTO — JavaScript Principal (Redesenhado)

   Segurança mantida:
   [SEC-V02] Whitelist para data-especie, data-status e data-filter
   [SEC-V04] Validação de URL antes de atribuir src no lightbox
   [SEC-V06] Validação de select contra whitelist
   [SEC-V07] Validação de href antes de querySelector
   [SEC-V09] Detecção de honeypot e debounce no envio
   [SEC-V10] Validação de inteiros nos contadores
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ══════════════════════════════════════════════════════════
     1. MENU MOBILE
  ══════════════════════════════════════════════════════════ */
  const navToggle = document.querySelector(".nav-toggle");
  const navPrimary = document.querySelector(".nav-primary");
  const navLinks = document.querySelectorAll(".nav-link");

  if (navToggle && navPrimary) {
    navToggle.addEventListener("click", () => {
      const isOpen = navPrimary.classList.toggle("nav-primary--open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.classList.toggle("nav-toggle--open", isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navPrimary.classList.remove("nav-primary--open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.classList.remove("nav-toggle--open");
      });
    });

    // Fechar ao clicar fora
    document.addEventListener("click", (e) => {
      if (!navPrimary.contains(e.target) && !navToggle.contains(e.target)) {
        navPrimary.classList.remove("nav-primary--open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.classList.remove("nav-toggle--open");
      }
    });

    // Fechar com Escape
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        navPrimary.classList.contains("nav-primary--open")
      ) {
        navPrimary.classList.remove("nav-primary--open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.classList.remove("nav-toggle--open");
        navToggle.focus();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     2. HEADER — ESCONDER / MOSTRAR NO SCROLL
  ══════════════════════════════════════════════════════════ */
  const header = document.querySelector(".site-header");
  let lastScrollY = 0;
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        header.classList.toggle("header--scrolled", currentY > 80);
        header.classList.toggle(
          "header--hidden",
          currentY > lastScrollY && currentY > 200,
        );
        lastScrollY = currentY;
        ticking = false;
      });
      ticking = true;
    }
  });

  /* ══════════════════════════════════════════════════════════
     3. LINK ATIVO NA NAV (IntersectionObserver)
  ══════════════════════════════════════════════════════════ */
  const sections = document.querySelectorAll("main section[id]");

  const observerNav = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove("nav-link--active");
            if (link.getAttribute("href") === `#${entry.target.id}`) {
              link.classList.add("nav-link--active");
            }
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );

  sections.forEach((sec) => observerNav.observe(sec));

  /* ══════════════════════════════════════════════════════════
     4. ANIMAÇÕES AO ENTRAR NA VIEWPORT (SCROLL REVEAL)
     Respeita prefers-reduced-motion
  ══════════════════════════════════════════════════════════ */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!prefersReducedMotion) {
    const revealEls = document.querySelectorAll(
      ".pet-card, .noticia-card, .ajudar-card, .galeria-item, " +
        ".sobre-grid, .contato-grid, .stat-item, .valor-item, " +
        ".membro-card, .equipe-grid",
    );

    revealEls.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition =
        `opacity 0.55s ease ${(i % 6) * 0.07}s, ` +
        `transform 0.55s ease ${(i % 6) * 0.07}s`;
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     5. CONTADOR ANIMADO NAS ESTATÍSTICAS
     [SEC-V10] Valida que data-value é inteiro positivo
  ══════════════════════════════════════════════════════════ */
  const counters = document.querySelectorAll(".stat-number");

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const raw = el.getAttribute("data-value");

        /* [SEC-V10] Aceitar apenas inteiros positivos */
        if (!/^\d+$/.test(raw)) {
          el.textContent = "—";
          countObserver.unobserve(el);
          return;
        }

        const target = parseInt(raw, 10);
        const duration = 1800;
        const step = 16;
        const steps = duration / step;
        let current = 0;

        const increment = () => {
          current += target / steps;
          if (current < target) {
            el.textContent = Math.floor(current).toLocaleString("pt-BR");
            requestAnimationFrame(increment);
          } else {
            el.textContent = target.toLocaleString("pt-BR");
          }
        };

        if (prefersReducedMotion) {
          el.textContent = target.toLocaleString("pt-BR");
        } else {
          requestAnimationFrame(increment);
        }

        countObserver.unobserve(el);
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((c) => countObserver.observe(c));

  /* ══════════════════════════════════════════════════════════
     6. FILTRO DE PETS
     [SEC-V02] Whitelist de valores
  ══════════════════════════════════════════════════════════ */
  const FILTROS_VALIDOS = new Set(["todos", "caes", "gatos", "disponiveis"]);
  const ESPECIES_VALIDAS = new Set(["caes", "gatos"]);
  const STATUS_VALIDOS = new Set(["disponivel", "acolhimento", "adotado"]);

  const filterBtns = document.querySelectorAll(".filter-btn");
  const petCards = document.querySelectorAll(".pet-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");
      if (!FILTROS_VALIDOS.has(filter)) return;

      filterBtns.forEach((b) => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");

      petCards.forEach((card) => {
        const especie = card.getAttribute("data-especie");
        const status = card.getAttribute("data-status");

        if (!ESPECIES_VALIDAS.has(especie) || !STATUS_VALIDOS.has(status))
          return;

        const show =
          filter === "todos" ||
          filter === especie ||
          (filter === "disponiveis" && status === "disponivel");

        if (show) {
          card.style.display = "";
          requestAnimationFrame(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0) scale(1)";
          });
        } else {
          card.style.opacity = "0";
          card.style.transform = "scale(0.94)";
          setTimeout(() => {
            card.style.display = "none";
          }, 300);
        }
      });
    });
  });

  /* ══════════════════════════════════════════════════════════
     7. GALERIA — LIGHTBOX
     [SEC-V04] Valida protocolo da URL antes de atribuir src
  ══════════════════════════════════════════════════════════ */
  const galeriaItems = document.querySelectorAll(".galeria-item");

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Visualizar imagem");

  lightbox.innerHTML = `
    <div class="lightbox-overlay"></div>
    <div class="lightbox-content">
      <button class="lightbox-prev" aria-label="Imagem anterior">‹</button>
      <img class="lightbox-img" src="" alt="" />
      <button class="lightbox-next" aria-label="Próxima imagem">›</button>
      <button class="lightbox-close" aria-label="Fechar">×</button>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector(".lightbox-img");
  const lbClose = lightbox.querySelector(".lightbox-close");
  const lbPrev = lightbox.querySelector(".lightbox-prev");
  const lbNext = lightbox.querySelector(".lightbox-next");
  const lbOverlay = lightbox.querySelector(".lightbox-overlay");

  let currentIndex = 0;
  const images = [];

  galeriaItems.forEach((item, idx) => {
    const img = item.querySelector(".galeria-img");
    if (img) {
      images.push({ src: img.src, alt: img.alt });

      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `Ampliar: ${img.alt}`);

      const openLightbox = () => {
        currentIndex = idx;
        showLightbox(idx);
      };
      item.addEventListener("click", openLightbox);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox();
        }
      });
    }
  });

  function isValidImgSrc(src) {
    try {
      const url = new URL(src, window.location.origin);
      return ["http:", "https:", "data:", "blob:"].includes(url.protocol);
    } catch {
      return false;
    }
  }

  function showLightbox(idx) {
    const { src, alt } = images[idx] || {};
    if (!src || !isValidImgSrc(src)) return;

    lbImg.src = src;
    lbImg.alt = alt || "";
    lightbox.classList.add("lightbox--open");
    document.body.style.overflow = "hidden";

    // Foco no close
    setTimeout(() => lbClose.focus(), 50);

    lbPrev.style.display = images.length > 1 ? "" : "none";
    lbNext.style.display = images.length > 1 ? "" : "none";
  }

  function closeLightbox() {
    lightbox.classList.remove("lightbox--open");
    document.body.style.overflow = "";
    lbImg.src = "";
    // Devolver foco
    const trigger = galeriaItems[currentIndex];
    if (trigger) trigger.focus();
  }

  lbClose.addEventListener("click", closeLightbox);
  lbOverlay.addEventListener("click", closeLightbox);

  lbPrev.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showLightbox(currentIndex);
  });
  lbNext.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    showLightbox(currentIndex);
  });

  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showLightbox(currentIndex);
    }
    if (e.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % images.length;
      showLightbox(currentIndex);
    }
  });

  /* ══════════════════════════════════════════════════════════
     8. VALIDAÇÃO DO FORMULÁRIO DE CONTATO
     [SEC-V06] Whitelist no select
     [SEC-V09] Honeypot + debounce
  ══════════════════════════════════════════════════════════ */
  const contactForm = document.querySelector(".contato-form");
  const ASSUNTOS_VALIDOS = new Set([
    "adocao",
    "acolhimento",
    "voluntario",
    "doacao",
    "resgate",
    "outro",
  ]);

  if (contactForm) {
    const fields = contactForm.querySelectorAll("[required]");
    let submitLocked = false;

    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.classList.contains("input--error")) validateField(field);
      });
    });

    function validateField(field) {
      const group = field.closest(".form-group");
      if (!group) return true;

      let error = group.querySelector(".form-error");
      const msgs = {
        nome: "Por favor, informe seu nome completo.",
        email: "Informe um e-mail válido.",
        mensagem: "A mensagem não pode estar vazia.",
      };

      let valid = true;

      if (!field.value.trim()) {
        valid = false;
        showFieldError(
          field,
          group,
          error,
          msgs[field.name] || "Campo obrigatório.",
        );
      } else if (
        field.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)
      ) {
        valid = false;
        showFieldError(field, group, error, msgs.email);
      } else if (field.name === "nome" && field.value.trim().length > 120) {
        valid = false;
        showFieldError(
          field,
          group,
          error,
          "Nome deve ter no máximo 120 caracteres.",
        );
      } else if (
        field.name === "mensagem" &&
        field.value.trim().length > 2000
      ) {
        valid = false;
        showFieldError(
          field,
          group,
          error,
          "Mensagem deve ter no máximo 2000 caracteres.",
        );
      } else {
        clearFieldError(field, group, error);
      }

      return valid;
    }

    function validateAssunto() {
      const select = contactForm.querySelector('[name="assunto"]');
      if (!select || !select.value) return true;
      return ASSUNTOS_VALIDOS.has(select.value);
    }

    function showFieldError(field, group, error, msg) {
      field.classList.add("input--error");
      field.setAttribute("aria-invalid", "true");
      if (!error) {
        error = document.createElement("span");
        error.className = "form-error";
        error.setAttribute("role", "alert");
        group.appendChild(error);
      }
      error.textContent = msg;
    }

    function clearFieldError(field, group, error) {
      field.classList.remove("input--error");
      field.setAttribute("aria-invalid", "false");
      if (error) error.remove();
    }

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      /* [SEC-V09] Honeypot */
      const honeypot = contactForm.querySelector('[name="website"]');
      if (honeypot && honeypot.value.trim() !== "") return;

      /* [SEC-V09] Debounce */
      if (submitLocked) return;
      submitLocked = true;
      setTimeout(() => {
        submitLocked = false;
      }, 3000);

      let allValid = true;
      fields.forEach((field) => {
        if (!validateField(field)) allValid = false;
      });

      /* [SEC-V06] Assunto */
      if (!validateAssunto()) {
        allValid = false;
        showToast("Selecione um assunto válido.", "error");
      }

      if (allValid) {
        showToast(
          "Mensagem enviada! Em breve entraremos em contato. 🐾",
          "success",
        );
        contactForm.reset();
        // Limpar estados de validação
        contactForm.querySelectorAll(".input--error").forEach((f) => {
          f.classList.remove("input--error");
          f.removeAttribute("aria-invalid");
        });
        contactForm.querySelectorAll(".form-error").forEach((e) => e.remove());
      } else {
        showToast("Verifique os campos destacados.", "error");
        // Foca no primeiro campo inválido
        const firstError = contactForm.querySelector(".input--error");
        if (firstError) firstError.focus();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     9. NEWSLETTER
     [SEC-V09] Honeypot + debounce
  ══════════════════════════════════════════════════════════ */
  const newsletterForm = document.querySelector(".newsletter-form");

  if (newsletterForm) {
    let newsletterLocked = false;

    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const honeypot = newsletterForm.querySelector('[name="url"]');
      if (honeypot && honeypot.value.trim() !== "") return;

      if (newsletterLocked) return;
      newsletterLocked = true;
      setTimeout(() => {
        newsletterLocked = false;
      }, 3000);

      const input = newsletterForm.querySelector(".newsletter-input");
      if (input && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        showToast("Inscrição realizada com sucesso! 🎉", "success");
        input.value = "";
      } else {
        showToast("Informe um e-mail válido.", "error");
        if (input) input.focus();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     10. SISTEMA DE TOAST
  ══════════════════════════════════════════════════════════ */
  function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message; /* Seguro: nunca innerHTML */
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast--visible"));

    setTimeout(() => {
      toast.classList.remove("toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    }, 4000);
  }

  /* ══════════════════════════════════════════════════════════
     11. BOTÃO "VOLTAR AO TOPO"
  ══════════════════════════════════════════════════════════ */
  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "Voltar ao topo da página");
  backToTop.innerHTML = "↑";
  document.body.appendChild(backToTop);

  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("back-to-top--visible", window.scrollY > 500);
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ══════════════════════════════════════════════════════════
     12. SMOOTH SCROLL — ÂNCORAS INTERNAS
     [SEC-V07] Validar formato do href (âncoras simples)
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");

      /* [SEC-V07] Apenas âncoras alfanuméricas + hífen/underscore */
      if (!/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(href)) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const offset = header ? header.offsetHeight + 16 : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      // Atualiza foco para acessibilidade
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.addEventListener(
        "blur",
        () => target.removeAttribute("tabindex"),
        { once: true },
      );
    });
  });

  /* ══════════════════════════════════════════════════════════
     13. ANIMAÇÃO DE ENTRADA DO HERO (page load)
  ══════════════════════════════════════════════════════════ */
  if (!prefersReducedMotion) {
    const heroEls = document.querySelectorAll(
      ".hero-eyebrow, .hero-title, .hero-desc, .hero-actions",
    );
    heroEls.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = `opacity 0.65s ease ${i * 0.12}s, transform 0.65s ease ${i * 0.12}s`;
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
  }
});
