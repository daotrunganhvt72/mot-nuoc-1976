/* ═══════════════════════════════════════════════════════════
   MỘT NƯỚC · 1976 — điều khiển scrollytelling
   GSAP ScrollTrigger + Lenis (nếu tải được) + fallback tôn trọng
   prefers-reduced-motion
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis smooth scroll ─────────────────────────────── */
  let lenis = null;
  if (!reduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.02 });
    window.__lenis = lenis;
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ── Con trỏ ─────────────────────────────────────────── */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches && !reduced) {
    const cur = $("#cursor");
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = `translate(${cx - 17}px,${cy - 17}px)`;
      requestAnimationFrame(loop);
    })();
    $$("a, figure, .gcard, .m5, .star--lit").forEach(el => {
      el.addEventListener("mouseenter", () => cur.classList.add("cursor--hot"));
      el.addEventListener("mouseleave", () => cur.classList.remove("cursor--hot"));
    });
  }

  /* ── Loader ──────────────────────────────────────────── */
  const loader = $("#loader");
  const closeLoader = () => {
    loader.classList.add("is-done");
    setTimeout(() => loader.remove(), 1200);
    heroIntro();
  };
  if (reduced) { loader.remove(); }
  else {
    Promise.race([
      new Promise(r => addEventListener("load", r, { once: true })),
      new Promise(r => setTimeout(r, 2200))
    ]).then(() => setTimeout(closeLoader, 500));
  }

  /* ── Hero: bụi vàng + chuyển ảnh + intro ─────────────── */
  const hero = $("#s0");
  let heroVisible = true;
  new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe(hero);

  const dust = $("#dust");
  if (dust && !reduced) {
    const ctx = dust.getContext("2d");
    let W, H, parts = [];
    const size = () => {
      W = dust.width = dust.offsetWidth * devicePixelRatio;
      H = dust.height = dust.offsetHeight * devicePixelRatio;
    };
    size(); addEventListener("resize", size);
    for (let i = 0; i < 90; i++) parts.push({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .4,
      vx: (Math.random() - .5) * .00035, vy: -(Math.random() * .0006 + .0002),
      a: Math.random() * .5 + .15, p: Math.random() * Math.PI * 2
    });
    (function draw(t) {
      requestAnimationFrame(draw);
      if (!heroVisible) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.p += .01;
        if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x < -.05) p.x = 1.05; if (p.x > 1.05) p.x = -.05;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r * devicePixelRatio, 0, 7);
        ctx.fillStyle = `rgba(226,177,60,${p.a * (0.6 + 0.4 * Math.sin(p.p))})`;
        ctx.fill();
      }
    })(0);
  }

  const heroImgs = $$(".hero__img");
  if (heroImgs.length > 1 && !reduced) {
    let idx = 0;
    setInterval(() => {
      if (!heroVisible) return;
      heroImgs[idx].classList.remove("is-on");
      idx = (idx + 1) % heroImgs.length;
      heroImgs[idx].classList.add("is-on");
    }, 5200);
  }

  function heroIntro() {
    if (reduced || !hasGSAP) return;
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__digit", { yPercent: 120, opacity: 0, duration: 1.2, stagger: .12 })
      .from(".hero__dot",  { scale: 0, duration: .5, stagger: .1 }, "-=.7")
      .from(".hero__claim",{ y: 44, opacity: 0, duration: 1 }, "-=.5")
      .from(".hero__sub, .hero__kicker, .hero__foot", { y: 24, opacity: 0, duration: .9, stagger: .08 }, "-=.6");
  }

  /* ── Không GSAP: chỉ đảm bảo nội dung hiện ───────────── */
  if (!hasGSAP) {
    document.documentElement.classList.add("no-gsap");
    $$(".reveal,.reveal-line p,.dli,.stars5 span").forEach(el => { el.style.opacity = 1; el.style.transform = "none"; });
  }

  /* ── Thanh tiến trình + nhãn chương ──────────────────── */
  const railFill = $("#railFill");
  const onScroll = () => {
    const h = document.documentElement;
    railFill.style.height = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100) + "%";
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const markNo = $("#markNo"), markName = $("#markName");
  $$("[data-mark]").forEach(sec => {
    ScrollTrigger.create({
      trigger: sec, start: "top 55%", end: "bottom 55%",
      onToggle: self => {
        if (!self.isActive) return;
        markNo.textContent = sec.dataset.no;
        markName.textContent = sec.dataset.mark;
        document.body.classList.toggle("on-paper", sec.classList.contains("chapter--paper"));
      }
    });
  });

  /* ── Reveal dùng chung ───────────────────────────────── */
  if (hasGSAP && !reduced) {
    $$(".reveal").forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });
    $$(".reveal-line").forEach(blk => {
      gsap.to(blk.querySelectorAll("p"), {
        opacity: 1, y: 0, duration: 1.2, stagger: .25, ease: "power3.out",
        scrollTrigger: { trigger: blk, start: "top 80%" }
      });
    });
    $$(".council__card").forEach((el, i) => {
      gsap.from(el, {
        opacity: 0, y: 60, rotateZ: i % 2 ? 1.5 : -1.5, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }, delay: (i % 5) * .08
      });
    });

    /* parallax ảnh */
    $$(".paraduo__item").forEach(fig => {
      const sp = parseFloat(fig.dataset.speed || "10");
      gsap.fromTo(fig, { y: sp }, {
        y: -sp, ease: "none",
        scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    });

    /* ── CẢNH HAI MIỀN → MỘT ── */
    const mergeTl = gsap.timeline({
      scrollTrigger: { trigger: "#s2", start: "top top", end: "bottom bottom", scrub: 0.5 }
    });
    mergeTl.fromTo(["#halfN", "#halfS"],
      { xPercent: -14 }, { xPercent: 0, duration: .45, ease: "none" }, 0)
      .fromTo("#halfS", { xPercent: 14 }, { xPercent: 0, duration: .45, ease: "none" }, 0)
      .fromTo("#seam", { scaleY: .15 }, { scaleY: 1, duration: .4, ease: "none" }, 0)
      .to(["#halfN h3", "#halfS h3", ".merge__tag"], { opacity: 0, duration: .12 }, .5)
      .to("#seam", { boxShadow: "0 0 90px 14px rgba(226,177,60,.9)", backgroundColor: "#e2b13c", duration: .1 }, .55)
      .to("#halfN, #halfS", { backgroundColor: "#120d08", duration: .15 }, .58)
      .to("#seam", { opacity: 0, duration: .12 }, .68)
      .fromTo("#mergeWord span",
        { opacity: 0, filter: "blur(16px)", scale: 1.35 },
        { opacity: 1, filter: "blur(0px)", scale: 1, duration: .18, stagger: .07, ease: "power2.out" }, .62)
      .to("#mergeWord span", { color: "#f2ead8", duration: .05 }, .9)
      .fromTo("#mergeNote", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .12 }, .92);

    /* ── Quote hiệp thương: hiện theo cụm từ ── */
    const q = $("#hiptuongQuote");
    if (q) {
      q.innerHTML = q.innerHTML.split(/(<mark>.*?<\/mark>)/).map(chunk => {
        if (chunk.startsWith("<mark>")) return chunk;
        return chunk.split(/\s+/).filter(Boolean).map(w => `<span class="qw">${w}</span>`).join(" ");
      }).join(" ");
      $$(".qw", q).forEach(s => { const m = s.querySelector("mark"); if (m) { s.innerHTML = m.innerHTML; s.classList.add("qw--gold"); } });
      gsap.from("#hiptuongQuote .qw", {
        opacity: 0, y: 14, duration: .5, stagger: .045, ease: "power2.out",
        scrollTrigger: { trigger: ".grandquote", start: "top 78%" }
      });
    }

    /* ── Ảnh ghim: lá phiếu hiện dần ── */
    const cap = $("#pinCaption");
    const captions = ["Cử tri bỏ lá phiếu đầu tiên của đất nước thống nhất",
                      "Chiến sĩ bỏ phiếu cạnh bia “Ngày bầu cử 25/4/1976”"];
    let capIdx = 0;
    gsap.fromTo("#pinImgTop",
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", ease: "none",
        scrollTrigger: {
          trigger: "#pinImg", start: "top top", end: "bottom bottom", scrub: 0.4,
          onUpdate(self) {
            const want = self.progress > .5 ? 1 : 0;
            if (want !== capIdx) {
              capIdx = want;
              gsap.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: .6 });
              cap.textContent = captions[capIdx];
            }
          }
        } });

    /* ── Bộ đếm ── */
    $$(".stat__num").forEach(el => {
      const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter() {
          const o = { v: 0 };
          gsap.to(o, {
            v: to, duration: 2, ease: "power3.out",
            onUpdate() {
              const s = o.v.toFixed(dec).replace(".", ",");
              el.innerHTML = s + (suf ? `<b>${suf}</b>` : "");
            }
          });
        }
      });
    });

    /* ── Lưới 492 ngôi sao ── */
    const field = $("#starField"), countEl = $("#starCount");
    if (field) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 492; i++) { const d = document.createElement("i"); d.className = "star"; frag.appendChild(d); }
      field.appendChild(frag);
      const stars = $$(".star", field);
      let lit = 0;
      ScrollTrigger.create({
        trigger: "#grid492", start: "top 80%", end: "bottom 45%", scrub: 0.3,
        onUpdate(self) {
          const n = Math.round(self.progress * stars.length);
          if (n !== lit) {
            for (let i = Math.min(lit, n), e = Math.max(lit, n); i < e; i++) stars[i].classList.toggle("star--lit", n > lit);
            lit = n;
            countEl.textContent = lit;
          }
        }
      });
    }

    /* ── Thanh theo miền ── */
    $$(".region__row").forEach((row, i) => {
      const bar = $(".region__bar", row), val = $(".region__val", row);
      const v = parseFloat(row.dataset.v) / 100, target = parseFloat(row.dataset.v);
      const o = { v: 0 };
      const paint = () => {
        bar.style.transform = `scaleX(${o.v / 100})`;
        val.textContent = o.v.toFixed(2).replace(".", ",") + "%";
      };
      ScrollTrigger.create({
        trigger: row, start: "top 88%", once: true,
        onEnter() {
          gsap.to(o, { v: target, duration: 1.7, delay: i * .15, ease: "power3.inOut", onUpdate: paint });
        }
      });
    });

    /* ── Cuộn ngang Hội trường Ba Đình ── */
    const track = $("#hTrack");
    const hDist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -hDist(), ease: "none",
      scrollTrigger: {
        trigger: "#s5", start: "top top", end: () => "+=" + hDist() * 1.05,
        scrub: 0.5, pin: true, invalidateOnRefresh: true, anticipatePin: 1
      }
    });

    /* ── Đổi tên đất nước ── */
    const oldName = $("#renameOld"), newName = $("#renameNew");
    const renameTl = gsap.timeline({
      scrollTrigger: { trigger: ".renamescene", start: "top 72%", end: "top 12%", scrub: 0.4 }
    });
    renameTl.fromTo(oldName, { opacity: .25 }, { opacity: 1, duration: .3 })
      .to(oldName, { "--strike": 1, duration: .22, ease: "power2.inOut" }, .3)
      .fromTo("#renameArrow", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: .12 }, .48);

    // tách ký tự dòng mới
    if (newName) {
      newName.innerHTML = newName.innerHTML.split("<br>").map(line =>
        [...line].map(ch => ch === " " ? " " : `<span class="ch">${ch}</span>`).join("")
      ).join("<br>");
      gsap.to("#renameNew .ch", {
        opacity: 1, y: 0, rotate: 0, duration: .06, stagger: .012, ease: "none",
        scrollTrigger: { trigger: ".renamescene", start: "top 55%", end: "top 8%", scrub: 0.3 }
      });
    }

    /* ── 5 ngôi sao mục + điều khoản nghị quyết ── */
    gsap.to(".stars5 span", {
      opacity: 1, y: 0, duration: .7, stagger: .12, ease: "power3.out",
      scrollTrigger: { trigger: ".stars5", start: "top 88%" }
    });
    gsap.to(".dli", {
      opacity: 1, y: 0, duration: .8, stagger: .14, ease: "power3.out",
      scrollTrigger: { trigger: "#decree2", start: "top 72%" }
    });
    gsap.from("#decree2", {
      y: 90, rotateX: 6, transformPerspective: 900, opacity: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: "#decree2", start: "top 85%" }
    });

    /* ── Kết: 50 năm ── */
    ScrollTrigger.create({
      trigger: "#s8", start: "top 65%", once: true,
      onEnter() {
        const el = $("#years50"), o = { v: 0 };
        gsap.to(o, { v: 50, duration: 2.4, ease: "power2.out", onUpdate() { el.textContent = Math.round(o.v); } });
      }
    });
  }

  /* ── Link về đầu trang ───────────────────────────────── */
  $$('.finale__up a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      const target = $(a.getAttribute("href"));
      if (lenis) lenis.scrollTo(target, { duration: 1.8 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  addEventListener("load", () => { if (hasGSAP) ScrollTrigger.refresh(); });
})();
