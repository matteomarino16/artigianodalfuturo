/* ==========================================================================
   ARTIGIANO DAL FUTURO — script.js
   JavaScript vanilla. Three.js caricato on-demand via CDN solo per l'hero.
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIGURAZIONE CONTATTI
   Inserire solo dati reali. I campi vuoti non vengono mostrati sul sito.
   -------------------------------------------------------------------------- */
const CONTACT_EMAIL = "";     // es. "info@dominio.it" — attiva anche l'invio del form
const CONTACT_PHONE = "";     // es. "+39 000 000 0000"
const WHATSAPP_NUMBER = "";   // formato internazionale, es. "390000000000"
const ADDRESS = "";           // es. "Via Esempio 1, 00000 Città (XX)"
const INSTAGRAM_URL = "https://www.instagram.com/artigiano_dal_futuro_/";

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener?.("change", (e) => { reducedMotion = e.matches; });

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const isEmailConfigured = () =>
    !!CONTACT_EMAIL && CONTACT_EMAIL !== "INSERIRE_EMAIL" && /.+@.+\..+/.test(CONTACT_EMAIL);

  /* ------------------------------------------------------------------------
     0. IMMAGINI MANCANTI → placeholder elegante e sostituibile
     ------------------------------------------------------------------------ */
  function initImagePlaceholders() {
    const markMissing = (img) => {
      const box = img.closest(".media");
      if (box) box.classList.add("is-missing");
      img.alt = img.alt || "";
    };
    $$(".media img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markMissing(img);
      img.addEventListener("error", () => markMissing(img));
      img.addEventListener("load", () => img.closest(".media")?.classList.remove("is-missing"));
    });
  }

  /* ------------------------------------------------------------------------
     1. NAVBAR SCROLL + 7. SCROLL PROGRESS (un solo listener in rAF)
     ------------------------------------------------------------------------ */
  function initScrollUI() {
    const header = $(".site-header");
    const bar = $(".scroll-progress span");
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      // Durante la hero 3D la navbar resta trasparente: il blur sopra una scena
      // che si ridisegna a ogni frame è molto costoso, soprattutto su mobile
      const heroEl = document.querySelector(".hero--scrolly");
      const threshold = heroEl ? heroEl.offsetHeight - window.innerHeight - 24 : 24;
      header.classList.toggle("is-scrolled", y > threshold);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    // Voce di menu attiva in base alla sezione visibile
    const links = $$(".nav__center a");
    const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------------
     2. MENU MOBILE
     ------------------------------------------------------------------------ */
  const mobileMenu = { close: () => {} };

  function initMobileMenu() {
    const toggle = $(".nav__toggle");
    const menu = $("#mobile-menu");
    if (!toggle || !menu) return;

    const open = () => {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Chiudi il menu");
      document.body.classList.add("menu-open");
      $("a", menu)?.focus({ preventScroll: true });
    };
    const close = (returnFocus = true) => {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Apri il menu");
      document.body.classList.remove("menu-open");
      setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reducedMotion ? 0 : 500);
      if (returnFocus) toggle.focus({ preventScroll: true });
    };
    mobileMenu.close = close;

    toggle.addEventListener("click", () =>
      toggle.getAttribute("aria-expanded") === "true" ? close() : open());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      // Focus trap semplice dentro il menu aperto
      if (e.key === "Tab" && menu.classList.contains("is-open")) {
        const items = [toggle, ...$$("a", menu)];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Chiude il menu se si passa a desktop
    window.matchMedia("(min-width: 1200px)").addEventListener?.("change", (e) => { if (e.matches) close(false); });
  }

  /* ------------------------------------------------------------------------
     3. SMOOTH SCROLLING (con offset navbar e gestione focus)
     ------------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || link.hasAttribute("data-legal")) return;
      const id = link.getAttribute("href");
      if (id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;

      e.preventDefault();
      mobileMenu.close(false);

      // Preseleziona la tipologia nel form dai link "SCOPRI →" dei servizi
      const type = link.dataset.projectType;
      if (type) {
        const select = $("#f-type");
        if (select) select.value = type;
      }

      // Le sezioni hanno ampio padding superiore: si scorre al loro bordo esatto
      const top = id === "#hero" ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });

      // Accessibilità: sposta il focus sulla sezione di destinazione
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      history.replaceState(null, "", id);
    });
  }

  /* ------------------------------------------------------------------------
     4. INTERSECTION OBSERVER — reveal, image reveal, processo
     ------------------------------------------------------------------------ */
  function initReveal() {
    const items = $$(".reveal, .reveal-img");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Gli elementi con clip-path completo non risultano "visibili" all'observer:
    // per le immagini si osserva il contenitore padre e si anima il figlio.
    const targets = new Map();
    items.forEach((el) => {
      const watched = el.classList.contains("reveal-img") ? el.parentElement : el;
      if (!targets.has(watched)) targets.set(watched, []);
      targets.get(watched).push(el);
    });

    // Stagger leggero tra elementi che entrano insieme
    const io = new IntersectionObserver((entries) => {
      let i = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = `${Math.min(i++ * 0.08, 0.32)}s`;
        targets.get(entry.target).forEach((el) => {
          el.style.setProperty("--delay", delay);
          el.classList.add("is-visible");
        });
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    targets.forEach((_, el) => io.observe(el));
  }

  function initProcess() {
    const list = $(".process__steps");
    if (!list) return;
    const steps = $$(".step", list);
    const line = $(".process__line", list);

    if (reducedMotion) {
      steps.forEach((s) => s.classList.add("is-active"));
      line.style.setProperty("--progress", 1);
      return;
    }

    let active = false;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = list.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 → 1 mentre la lista attraversa la parte centrale dello schermo
      const start = vh * 0.8, end = vh * 0.35;
      const p = Math.min(Math.max((start - rect.top) / (start - end + rect.height * 0.5), 0), 1);
      line.style.setProperty("--progress", p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle("is-active", p >= (i + 0.15) / steps.length));
    };
    const onScroll = () => { if (active && !ticking) { ticking = true; requestAnimationFrame(update); } };

    new IntersectionObserver(([entry]) => { active = entry.isIntersecting; if (active) update(); })
      .observe(list);
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Parallax leggerissimo sulle immagini con [data-parallax] */
  function initParallax() {
    if (reducedMotion || !finePointer) return;
    const imgs = $$("[data-parallax]");
    if (!imgs.length) return;
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    });
    imgs.forEach((img) => io.observe(img.parentElement));

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      imgs.forEach((img) => {
        const box = img.parentElement;
        if (!visible.has(box)) return;
        const r = box.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
        img.style.translate = `0 ${(-p * 6).toFixed(2)}%`;
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     5. LIGHTBOX PORTFOLIO
     ------------------------------------------------------------------------ */
  function initLightbox() {
    const dialog = $("#lightbox");
    const projects = $$(".project");
    if (!dialog || !projects.length || typeof dialog.showModal !== "function") return;

    const img = $("#lb-img", dialog);
    const media = $(".lightbox__media", dialog);
    const cat = $("#lb-cat", dialog);
    const title = $("#lb-title", dialog);
    const desc = $("#lb-desc", dialog);
    const count = $("#lb-count", dialog);
    let index = 0;
    let opener = null;

    img.addEventListener("error", () => media.classList.add("is-missing"));
    img.addEventListener("load", () => media.classList.remove("is-missing"));

    const render = (i) => {
      index = (i + projects.length) % projects.length;
      const p = projects[index].dataset;
      media.classList.remove("is-missing");
      media.dataset.placeholder = p.src;
      img.src = p.src;
      img.alt = p.title;
      cat.textContent = p.category;
      title.textContent = p.title;
      desc.textContent = p.description;
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
    };

    projects.forEach((btn, i) => btn.addEventListener("click", () => {
      opener = btn;
      render(i);
      dialog.showModal();
      document.body.style.overflow = "hidden";
      $(".lightbox__close", dialog).focus();
    }));

    dialog.addEventListener("click", (e) => {
      const action = e.target.closest("[data-lb]")?.dataset.lb;
      if (action === "close") dialog.close();
      if (action === "prev") render(index - 1);
      if (action === "next") render(index + 1);
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") render(index - 1);
      if (e.key === "ArrowRight") render(index + 1);
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
      opener?.focus({ preventScroll: true });
    });
  }

  /* Dialog documenti legali (placeholder finché non vengono forniti) */
  function initLegal() {
    const dialog = $("#legal-dialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    const titles = { privacy: "Privacy Policy", cookie: "Cookie Policy" };
    $$("[data-legal]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      $("#legal-title", dialog).textContent = titles[a.dataset.legal] || "Documento";
      dialog.showModal();
    }));
  }

  /* ------------------------------------------------------------------------
     6. CURSORE CUSTOM (solo desktop con puntatore preciso)
     ------------------------------------------------------------------------ */
  function initCursor() {
    if (!finePointer || reducedMotion) return;
    const cursor = $(".cursor");
    if (!cursor) return;
    root.classList.add("has-cursor");

    let x = -100, y = -100, cx = x, cy = y, raf = null;
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(loop) : null;
    };
    const interactive = "a, button, img, label, select, .project, [role='button']";

    window.addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      cursor.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest(interactive));
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    window.addEventListener("mousedown", () => cursor.classList.add("is-down"));
    window.addEventListener("mouseup", () => cursor.classList.remove("is-down"));
  }

  /* ------------------------------------------------------------------------
     8. VALIDAZIONE FORM + invio via mailto
     ------------------------------------------------------------------------ */
  function initForm() {
    const form = $("#project-form");
    if (!form) return;
    const status = $(".form__status", form);

    const rules = {
      nome: (v) => (v.trim().length >= 2 ? "" : "Inserisci nome e cognome."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Inserisci un indirizzo email valido."),
      telefono: (v) => (!v.trim() || /^[+()\d\s.-]{6,20}$/.test(v.trim()) ? "" : "Inserisci un numero di telefono valido."),
      tipologia: (v) => (v ? "" : "Seleziona la tipologia di progetto."),
      messaggio: (v) => (v.trim().length >= 10 ? "" : "Raccontaci il progetto in almeno qualche parola."),
      privacy: (_, el) => (el.checked ? "" : "È necessario accettare l'informativa privacy."),
    };

    const validateField = (el) => {
      const rule = rules[el.name];
      if (!rule) return true;
      const msg = rule(el.value, el);
      const err = document.getElementById(`${el.id}-err`);
      if (err) err.textContent = msg;
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };

    // Validazione "gentile": al blur, poi live dopo il primo errore
    form.addEventListener("focusout", (e) => { if (e.target.name in rules && e.target.value) validateField(e.target); });
    form.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid") === "true") validateField(e.target); });
    form.addEventListener("change", (e) => { if (e.target.type === "checkbox" || e.target.tagName === "SELECT") validateField(e.target); });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("is-warning");

      const fields = $$("input, select, textarea", form).filter((el) => el.name in rules);
      const invalid = fields.filter((el) => !validateField(el));
      if (invalid.length) {
        invalid[0].focus();
        status.textContent = "Controlla i campi evidenziati.";
        return;
      }

      if (!isEmailConfigured()) {
        status.classList.add("is-warning");
        status.textContent = "Configura l'indirizzo email in script.js per attivare l'invio.";
        return;
      }

      // Fallback mailto: apre il client di posta con la richiesta precompilata
      const d = Object.fromEntries(new FormData(form));
      const subject = `Richiesta progetto — ${d.tipologia} — ${d.nome}`;
      const body = [
        `Nome e cognome: ${d.nome}`,
        `Email: ${d.email}`,
        `Telefono: ${d.telefono || "—"}`,
        `Tipologia di progetto: ${d.tipologia}`,
        `Budget indicativo: ${d.budget || "—"}`,
        `Tempistiche: ${d.tempistiche || "—"}`,
        "",
        "Messaggio:",
        d.messaggio,
      ].join("\n");

      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = "Grazie! Si aprirà il tuo programma di posta con la richiesta già compilata: premi Invia per completare.";
    });
  }

  /* ------------------------------------------------------------------------
     9. CONTATTI — mostra solo i dati realmente configurati
     ------------------------------------------------------------------------ */
  function initContacts() {
    const list = $("#contacts-list");
    if (!list) return;

    const entries = [];
    if (isEmailConfigured()) entries.push(["Email", CONTACT_EMAIL, `mailto:${CONTACT_EMAIL}`]);
    if (CONTACT_PHONE) entries.push(["Telefono", CONTACT_PHONE, `tel:${CONTACT_PHONE.replace(/[^\d+]/g, "")}`]);
    if (WHATSAPP_NUMBER) entries.push(["WhatsApp", "Scrivici su WhatsApp ↗", `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`, true]);
    entries.push(["Instagram", "@artigiano_dal_futuro_ ↗", INSTAGRAM_URL, true]);
    if (ADDRESS) entries.push(["Indirizzo", ADDRESS, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`, true]);

    list.replaceChildren(...entries.map(([label, text, href, external]) => {
      const row = document.createElement("div");
      row.className = "contact";
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      if (external) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      dd.append(a);
      row.append(dt, dd);
      return row;
    }));
  }

  /* ------------------------------------------------------------------------
     10a. HERO SCROLL — logo dal centro alla navbar + comparsa testi
     Stato condiviso con la scena 3D tramite heroState.progress (0 → 1).
     ------------------------------------------------------------------------ */
  const heroState = { progress: 0 };
  const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function initHeroScroll() {
    const hero = $("#hero");
    const sticky = $(".hero__sticky");
    const slot = $(".hero__logo-slot .logo-box");
    const navBox = $(".nav__logo .logo-box");
    const fly = $(".logo-fly");
    const flyBox = $(".logo-box", fly);
    const content = $(".hero__content");
    const lines = $$(".hero__title .line > span");
    const dim = $(".hero__dim");
    const hint = $(".hero__scroll");
    if (!hero || !sticky || !slot || !navBox || !fly) return;

    // Con reduced motion resta il layout statico (logo centrale, testi visibili)
    if (reducedMotion) return;

    hero.classList.add("hero--scrolly");
    root.classList.add("hero-scrolly-on");

    const LOGO_END = 0.42; // frazione dello scroll della hero dedicata al volo del logo

    /* Misure in cache: lette solo al resize / cambio navbar, mai durante l'animazione.
       La distanza usa l'altezza dello sticky (100svh), stabile anche quando
       la barra degli indirizzi mobile si espande o si riduce. */
    let distance = 1, heroTop = 0, from = null, to = null;
    const measure = () => {
      distance = Math.max(hero.offsetHeight - sticky.offsetHeight, 1);
      heroTop = hero.getBoundingClientRect().top + window.scrollY;
      // misura lo slot senza la trasformazione animata del logo
      const r = slot.getBoundingClientRect(); // lo slot è nello sticky: posizione fissa a schermo
      from = { left: r.left, top: r.top, width: r.width };
      flyBox.style.width = `${from.width}px`;
    };
    const measureNav = () => {
      const r = navBox.getBoundingClientRect();
      to = { left: r.left, top: r.top, width: r.width };
    };

    // Progress di scroll (target) e valore smorzato (current)
    const target = () => Math.min(Math.max((window.scrollY - heroTop) / distance, 0), 1);
    let current = target();
    let rafId = null;
    let last = performance.now();
    let docked = null, contentOn = null;

    const apply = (p) => {
      heroState.progress = p;

      // 1) Volo del logo: solo transform (compositing GPU)
      const t = easeInOut(Math.min(p / LOGO_END, 1));
      const scale = 1 + (to.width / from.width - 1) * t;
      const x = from.left + (to.left - from.left) * t;
      const y = from.top + (to.top - from.top) * t;
      fly.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      const isDocked = t >= 0.999;
      if (isDocked !== docked) { docked = isDocked; root.classList.toggle("logo-docked", isDocked); }

      // 2) Overlay scuro e indicatore scroll: solo opacity
      dim.style.opacity = Math.max(1 - p * 3, 0).toFixed(3);
      if (hint) hint.style.opacity = Math.max(1 - p * 5, 0).toFixed(3);

      // 3) Headline, sottotitolo e CTA: solo transform + opacity
      const hc = smooth(0.32, 0.72, p);
      content.style.opacity = hc.toFixed(3);
      content.style.transform = `translate3d(0, ${((1 - hc) * 48).toFixed(2)}px, 0)`;
      const lineY = ((1 - hc) * 105).toFixed(2);
      lines.forEach((l) => { l.style.transform = `translate3d(0, ${lineY}%, 0)`; });
      const on = hc > 0.6;
      if (on !== contentOn) { contentOn = on; hero.classList.toggle("is-content-on", on); }
    };

    // Loop attivo solo mentre il valore smorzato insegue lo scroll
    const tick = (now) => {
      const dt = Math.min((now - last) / 16.67, 4); // normalizza a 60fps
      last = now;
      const goal = target();
      // smorzamento indipendente dal framerate (morbido ma reattivo)
      current += (goal - current) * (1 - Math.pow(1 - 0.16, dt));
      if (Math.abs(goal - current) < 0.0004) current = goal;
      apply(current);
      rafId = current === goal ? null : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (rafId) return;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const remeasure = () => { measure(); measureNav(); apply(current); kick(); };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);
    // La navbar si compatta con una transizione: aggiorna la destinazione del logo
    navBox.addEventListener("transitionend", () => { measureNav(); apply(current); });
    document.fonts?.ready.then(remeasure);
    window.addEventListener("load", remeasure);
    remeasure();

    // Leggera inclinazione 3D del logo seguendo il mouse (solo desktop)
    if (finePointer) {
      let rx = 0, ry = 0, trx = 0, try_ = 0, tiltRaf = null;
      const tilt = () => {
        rx += (trx - rx) * 0.1; ry += (try_ - ry) * 0.1;
        flyBox.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        tiltRaf = Math.abs(trx - rx) + Math.abs(try_ - ry) > 0.01 ? requestAnimationFrame(tilt) : null;
      };
      window.addEventListener("pointermove", (e) => {
        if (docked) return;
        try_ = (e.clientX / window.innerWidth - 0.5) * 14;
        trx = -(e.clientY / window.innerHeight - 0.5) * 10;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(tilt);
      }, { passive: true });
    }

    // Accessibilità: se si arriva con Tab sui link della hero, porta i testi in vista
    content.addEventListener("focusin", () => {
      if (contentOn) return;
      window.scrollTo({ top: heroTop + distance * 0.8, behavior: "auto" });
    });
  }

  /* ------------------------------------------------------------------------
     10b. THREE.JS HERO — bancone bar astratto a tutto schermo
     ------------------------------------------------------------------------ */
  function supportsWebGL() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch { return false; }
  }

  async function initHero3D() {
    const container = $("#hero-canvas");
    if (!container) return;
    if (!supportsWebGL()) { container.classList.add("is-fallback"); return; }

    let THREE;
    try {
      THREE = await import(THREE_URL);
    } catch (err) {
      container.classList.add("is-fallback");
      return;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    // Risoluzione adattiva: parte contenuta e scende se i frame rallentano
    const maxDpr = Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5);
    let dpr = maxDpr;
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x050505, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    /* Scena e camera cinematografica */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 11, 26);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

    // Percorso camera guidato dallo scroll: frontale e lontana → 3/4 ravvicinata
    // Su mobile camera più lontana e bancone nella metà alta (i testi stanno in basso)
    const camStart = isMobile ? new THREE.Vector3(0, 2.6, 17) : new THREE.Vector3(0, 2.6, 15.5);
    const camEnd = isMobile ? new THREE.Vector3(4.2, 5.2, 13.5) : new THREE.Vector3(7.2, 3.4, 8.6);
    const lookStart = new THREE.Vector3(0, 1.35, 0);
    const lookEnd = isMobile ? new THREE.Vector3(0.4, -1.6, 0) : new THREE.Vector3(-1.4, 1.0, -0.3);
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();

    /* Environment neutro per riflessi soft (metallo e satinato) */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.BoxGeometry(20, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide })
    ));
    const panel = (w, h, pos, rot, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.rotation.set(...rot); envScene.add(m);
    };
    panel(8, 2, [0, 9, 0], [Math.PI / 2, 0, 0], 1.6);
    panel(2, 8, [-9, 2, 2], [0, Math.PI / 2, 0], 0.8);
    panel(6, 1, [3, 3, -9], [0, 0, 0], 0.5);
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    pmrem.dispose();

    /* Materiali: nero opaco, bianco satinato, metallo molto scuro */
    const matBlack = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.82, metalness: 0.05, envMapIntensity: 0.4 });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.38, metalness: 0.0, envMapIntensity: 0.7 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.28, metalness: 1.0, envMapIntensity: 1.0 });
    const matGlow = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });

    // Pavimento con dissolvenza radiale (nessun bordo visibile)
    const fadeCanvas = document.createElement("canvas");
    fadeCanvas.width = fadeCanvas.height = 256;
    const fctx = fadeCanvas.getContext("2d");
    const grad = fctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "#fff"); grad.addColorStop(0.5, "#666"); grad.addColorStop(1, "#000");
    fctx.fillStyle = grad; fctx.fillRect(0, 0, 256, 256);
    const matFloor = new THREE.MeshStandardMaterial({
      color: 0x0b0b0b, roughness: 0.85, metalness: 0, envMapIntensity: 0.2,
      alphaMap: new THREE.CanvasTexture(fadeCanvas), transparent: true, depthWrite: false,
    });

    const group = new THREE.Group();
    scene.add(group);

    const add = (geo, mat, x, y, z, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = shadow && !isMobile; m.receiveShadow = !isMobile;
      group.add(m);
      return m;
    };
    const box = (w, h, d, mat, x, y, z, shadow) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, shadow);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), matFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isMobile;
    group.add(floor);

    // Bancone: corpo nero, top bianco satinato, zoccolo metallico arretrato
    const W = 5.2;
    box(W, 1.05, 1.0, matBlack, 0, 0.62, 0);
    box(W + 0.26, 0.08, 1.24, matWhite, 0, 1.19, -0.02);
    box(W - 0.2, 0.1, 0.84, matMetal, 0, 0.05, -0.04, false);

    // Doghe verticali sul fronte (dettaglio artigianale)
    const slats = isMobile ? 12 : 26;
    const slatGeo = new THREE.BoxGeometry(0.06, 0.92, 0.04);
    for (let i = 0; i < slats; i++) {
      add(slatGeo, matBlack, -W / 2 + 0.18 + i * ((W - 0.36) / (slats - 1)), 0.62, 0.52);
    }

    // Poggiapiedi metallico
    const rail = add(new THREE.CylinderGeometry(0.025, 0.025, W - 0.3, 24), matMetal, 0, 0.24, 0.72, false);
    rail.rotation.z = Math.PI / 2;
    [-1.8, 0, 1.8].forEach((x) => box(0.03, 0.03, 0.2, matMetal, x, 0.24, 0.62, false));

    // Sgabelli minimal
    const stoolSeat = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 40);
    const stoolLeg = new THREE.CylinderGeometry(0.022, 0.022, 0.78, 16);
    const stoolBase = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 40);
    const stoolRing = new THREE.TorusGeometry(0.16, 0.01, 8, 40);
    (isMobile ? [-1.2, 1.2] : [-1.8, -0.6, 0.6, 1.8]).forEach((x) => {
      add(stoolSeat, matWhite, x, 0.83, 1.35);
      add(stoolLeg, matMetal, x, 0.41, 1.35);
      add(stoolBase, matMetal, x, 0.01, 1.35, false);
      const r = add(stoolRing, matMetal, x, 0.3, 1.35, false);
      r.rotation.x = Math.PI / 2;
    });

    // Retro-banco: monoliti neri, mensole bianche, montanti metallici
    box(1.2, 3.8, 0.5, matBlack, -3.1, 1.9, -2.4);
    box(0.6, 2.9, 0.5, matBlack, 3.3, 1.45, -2.1);
    const shelfX = 0.1;
    [1.55, 2.25, 2.95].forEach((y, i) => {
      if (isMobile && i === 1) return;
      box(3.6, 0.05, 0.42, matWhite, shelfX, y, -2.35);
    });
    [-1.7, 1.9].forEach((x) => box(0.035, 3.4, 0.035, matMetal, shelfX + x, 1.7, -2.15, false));
    box(4.4, 3.6, 0.1, matBlack, shelfX, 1.8, -2.65); // parete di fondo

    // Telaio metallico sottile sospeso
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.6, 0.6, 1.4)),
      new THREE.LineBasicMaterial({ color: 0x6a6a6a, transparent: true, opacity: 0.5 })
    );
    frame.position.set(0, 3.55, 0);
    group.add(frame);

    // Lampade a sospensione: cavo sottile + disco luminoso
    const pendants = [];
    const cable = new THREE.CylinderGeometry(0.004, 0.004, 1.1, 6);
    const shade = new THREE.CylinderGeometry(0.16, 0.2, 0.05, 40);
    const glow = new THREE.CircleGeometry(0.15, 40);
    (isMobile ? [-1.2, 1.2] : [-1.8, 0, 1.8]).forEach((x) => {
      const g = new THREE.Group();
      const c = new THREE.Mesh(cable, matMetal); c.position.y = 0.55; g.add(c);
      const s = new THREE.Mesh(shade, matBlack); g.add(s);
      const d = new THREE.Mesh(glow, matGlow); d.rotation.x = Math.PI / 2; d.position.y = -0.026; g.add(d);
      g.position.set(x, 2.7, 0);
      group.add(g);
      pendants.push(g);
    });

    // Forma centrale astratta: anello bianco satinato sospeso sopra il bancone
    const ring = add(new THREE.TorusGeometry(0.55, 0.03, 24, isMobile ? 64 : 128), matWhite, 2.2, 2.05, -1.2);
    const sphere = add(new THREE.SphereGeometry(0.1, 32, 32), matMetal, 2.2, 2.05, -1.2);

    /* Luci: soft, alto contrasto, minimal */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x050505, 0.22));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(4, 9, 6);
    key.castShadow = !isMobile;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.3);
    rim.position.set(-6, 4, -6);
    scene.add(rim);
    // Luce d'accento sul piano del bancone (bianco neutro)
    const counterLight = new THREE.PointLight(0xffffff, 9, 7, 2);
    counterLight.position.set(0, 2.5, 0.4);
    scene.add(counterLight);

    /* Resize */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Su schermi verticali allarga l'inquadratura
      camera.fov = w / h < 1 ? 46 : 30;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(container);
    resize();

    /* Parallax mouse (smorzato) */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    if (finePointer) {
      window.addEventListener("pointermove", (e) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    /* Loop — attivo solo con hero visibile e scheda in primo piano */
    const clock = new THREE.Clock();
    let running = false;
    let rafId = null;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      const p = heroState.progress; // già smorzato da initHeroScroll
      mouse.x += (mouse.tx - mouse.x) * 0.035;
      mouse.y += (mouse.ty - mouse.y) * 0.035;

      const k = easeInOut(p);
      camPos.lerpVectors(camStart, camEnd, k);
      camLook.lerpVectors(lookStart, lookEnd, k);

      camera.position.set(camPos.x + mouse.x * 0.5, camPos.y - mouse.y * 0.3, camPos.z);
      camera.lookAt(camLook);

      group.rotation.y = Math.sin(t * 0.07) * 0.06;                    // rotazione lentissima
      ring.position.y = 2.05 + Math.sin(t * 0.45) * 0.07;              // leggero movimento verticale
      sphere.position.y = ring.position.y;
      ring.rotation.y = t * 0.12;
      pendants.forEach((g, i) => { g.rotation.z = Math.sin(t * 0.35 + i) * 0.012; });

      renderer.render(scene, camera);
    };
    let frames = 0, slowFrames = 0, lastT = performance.now();
    const loop = (now = performance.now()) => {
      if (!running) return;
      renderFrame();
      // ogni 60 frame: se più di un terzo supera ~22ms, riduce la risoluzione
      const dt = now - lastT; lastT = now;
      if (dt > 22 && dt < 200) slowFrames++;
      if (++frames >= 60) {
        if (slowFrames > 20 && dpr > 0.75) {
          dpr = Math.max(dpr - 0.25, 0.75);
          renderer.setPixelRatio(dpr);
          resize();
        }
        frames = 0; slowFrames = 0;
      }
      rafId = requestAnimationFrame(loop);
    };
    const setRunning = (on) => {
      if (reducedMotion) { running = false; renderFrame(); return; } // un frame statico
      if (on && !running) { running = true; lastT = performance.now(); loop(); }
      if (!on) { running = false; cancelAnimationFrame(rafId); }
    };

    let heroVisible = true;
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      setRunning(heroVisible && !document.hidden);
    }).observe(container);
    document.addEventListener("visibilitychange", () => setRunning(heroVisible && !document.hidden));

    renderFrame();
    setRunning(true);
    container.classList.add("is-ready");
  }

  /* ------------------------------------------------------------------------
     INIT
     ------------------------------------------------------------------------ */
  function init() {
    initImagePlaceholders();
    initScrollUI();
    initMobileMenu();
    initSmoothScroll();
    initReveal();
    initProcess();
    initParallax();
    initLightbox();
    initLegal();
    initCursor();
    initForm();
    initContacts();
    initHeroScroll();

    requestAnimationFrame(() => root.classList.add("is-loaded"));

    // Three.js caricato dopo il primo paint per non bloccare il rendering
    const start3D = () => initHero3D().catch(() => $("#hero-canvas")?.classList.add("is-fallback"));
    if ("requestIdleCallback" in window) requestIdleCallback(start3D, { timeout: 1200 });
    else setTimeout(start3D, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
