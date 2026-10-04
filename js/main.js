/* LIBERO-PeRM project page — interactions.
   Hero video wall, preference selector, task explorer, hover-to-play clips,
   nav highlighting, scroll progress, reveal, BibTeX copy. Honors prefers-reduced-motion. */
(function () {
  "use strict";

  /* Fill these in when the links go live; an empty entry renders as "soon". */
  var LINKS = { paper: "", code: "", dataset: "" };

  var TASKS = window.PERM_TASKS || [];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TIERS = {
    motion:  { label: "Motion preference", color: "var(--motion)", bg: "var(--motion-bg)" },
    skill:   { label: "Skill preference",  color: "var(--skill)",  bg: "var(--skill-bg)" },
    profile: { label: "User profile",      color: "var(--profile)", bg: "var(--profile-bg)" },
    multi:   { label: "Multi-preference",  color: "var(--multi)",  bg: "var(--multi-bg)" }
  };
  var SUITES = {
    single:   { name: "SinglePref",   note: "One preference per task. The top rollout follows it, the bottom one runs the same task without it." },
    conflict: { name: "PrefConflict", note: "P1 and P2 are the two sides of a conflict, each with its own rollout. In P1 + P2 the two rollouts each follow one preference and both metrics are plotted. In task + preference clips one rollout follows the task wording and the other follows the preference." },
    compose:  { name: "PrefCompose",  note: "Four conditions per layout: no preference, A, B, and A + B. Both metrics are plotted in every condition, against the no-preference rollout." },
    scale:    { name: "PrefScale",    note: "Layout and task variants used for the data-scaling study." }
  };
  /* family names where the two layouts word the same preference differently */
  var FAMILY_NAME = { "1-4": "Keep away from an object" };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- links ---------- */
  document.querySelectorAll("[data-link]").forEach(function (a) {
    var url = LINKS[a.getAttribute("data-link")];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
    else {
      a.classList.add("soon"); a.removeAttribute("href"); a.title = "Coming soon";
      if (a.classList.contains("btn")) a.appendChild(el("span", "tag-soon", "soon"));
    }
  });

  /* ---------- hover-to-play clips ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target.querySelector("video");
      if (v && !en.isIntersecting && !v.paused) { v.pause(); en.target.classList.remove("playing"); en.target._pinned = false; }
    });
  }, { rootMargin: "120px" }) : null;

  function bindVideo(box) {
    var video = box.querySelector("video");
    if (!video || box._bound) return;
    box._bound = true;
    function start() { video.play().then(function () { box.classList.add("playing"); }).catch(function () {}); }
    function stop() { if (box._pinned) return; video.pause(); box.classList.remove("playing"); }
    if (!reduceMotion) { box.addEventListener("mouseenter", start); box.addEventListener("mouseleave", stop); }
    box.addEventListener("click", function () {
      box._pinned = !box._pinned;
      if (box._pinned) start(); else { video.pause(); box.classList.remove("playing"); }
    });
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); box.click(); } });
    box.tabIndex = 0; box.setAttribute("role", "button"); box.setAttribute("aria-label", "Play clip");
    if (io) io.observe(box);
  }
  document.querySelectorAll("[data-video]").forEach(bindVideo);

  /* ---------- hero video wall ---------- */
  var reel = document.getElementById("reel");
  if (reel) {
    reel.querySelectorAll(".reel-row").forEach(function (row) {
      var html = row.getAttribute("data-clips").split(",").map(function (id) {
        return '<div class="reel-tile"><video src="assets/reel/' + id + '.mp4" muted loop playsinline preload="none" disablepictureinpicture></video></div>';
      }).join("");
      row.innerHTML = reduceMotion ? html : html + html;        /* doubled for a seamless -50% marquee */
    });
    if (!reduceMotion && "IntersectionObserver" in window) {
      var vids = reel.querySelectorAll("video");
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          vids.forEach(function (v) { if (en.isIntersecting) v.play().catch(function () {}); else v.pause(); });
        });
      }, { rootMargin: "60px" }).observe(reel);
    }
  }

  /* ---------- score chips ---------- */
  function scoreChips(t) {
    return t.final.map(function (f) {
      var m = t.metrics[f.m], row = t.rows[f.r].toLowerCase();
      var label = t.metrics.length > 1 ? m.name + " · " + row : row;
      var color = t.metrics.length > 1 ? TIERS[m.tier === "multi" ? "multi" : m.tier].color : (f.r === 0 ? TIERS[t.tier].color : "var(--muted)");
      return '<span class="score" style="--c:' + color + '">' + esc(label) + " <b>" + (f.v == null ? "–" : f.v) + "</b></span>";
    }).join("");
  }

  /* ---------- preference selector ---------- */
  var tour = TASKS.filter(function (t) { return t.tour; });
  var byTier = { motion: [], skill: [], profile: [] };
  tour.forEach(function (t) {
    var list = byTier[t.tier], fam = list.filter(function (f) { return f.id === t.family; })[0];
    if (!fam) { fam = { id: t.family, name: FAMILY_NAME[t.family] || t.title, demos: [] }; list.push(fam); }
    fam.demos.push(t);
  });
  var widget = document.getElementById("prefWidget");
  if (widget && tour.length) {
    var stage = document.getElementById("prefStage"), video = document.getElementById("prefVideo"), media = document.getElementById("prefMedia");
    var state = { tier: "motion", fam: 0, demo: 0 };
    Object.keys(byTier).forEach(function (k) {
      var s = widget.querySelector('[data-count="' + k + '"]');
      if (s) s.textContent = byTier[k].length + " preferences";
    });

    function show() {
      var tier = TIERS[state.tier], fams = byTier[state.tier], fam = fams[state.fam], t = fam.demos[state.demo];
      stage.style.setProperty("--c", tier.color);
      document.getElementById("prefPill").textContent = tier.label;
      document.getElementById("prefTitle").textContent = t.title;
      document.getElementById("prefTask").textContent = "Task: " + t.task;
      document.getElementById("prefHow").innerHTML = "<b>Scored by</b> " + esc(t.metrics[0].about) + "." + (t.note ? " " + esc(t.note) : "");
      document.getElementById("prefScores").innerHTML = scoreChips(t);
      document.getElementById("prefSwitch").innerHTML = fam.demos.map(function (d, i) {
        return '<button type="button" data-demo="' + i + '" class="' + (i === state.demo ? "on" : "") + '">Layout ' + "AB"[i] + "</button>";
      }).join("");
      document.getElementById("prefChipsTitle").textContent = "All " + fams.length + " " + tier.label.toLowerCase() + (state.tier === "profile" ? " preferences" : "s");
      document.getElementById("prefChips").innerHTML = fams.map(function (f, i) {
        return '<button type="button" class="chip' + (i === state.fam ? " on" : "") + '" data-fam="' + i + '">' + esc(f.name) + "</button>";
      }).join("");
      media.classList.remove("playing"); media._pinned = false;
      video.pause(); video.poster = t.poster; video.src = t.video; video.load();
      if (!reduceMotion && media.matches(":hover")) video.play().then(function () { media.classList.add("playing"); }).catch(function () {});
    }
    widget.addEventListener("click", function (e) {
      var tab = e.target.closest(".tab"), chip = e.target.closest("[data-fam]"), demo = e.target.closest("[data-demo]");
      if (tab) {
        state = { tier: tab.getAttribute("data-tier"), fam: 0, demo: 0 };
        widget.querySelectorAll(".tab").forEach(function (b) { b.classList.toggle("on", b === tab); b.setAttribute("aria-selected", b === tab); });
      } else if (chip) { state.fam = +chip.getAttribute("data-fam"); state.demo = 0; }
      else if (demo) { state.demo = +demo.getAttribute("data-demo"); }
      else return;
      show();
    });
    show();
  }

  /* ---------- task explorer ---------- */
  var grid = document.getElementById("taskGrid");
  if (grid) {
    var pool = TASKS.filter(function (t) { return !t.held; });
    var PAGE = 8, shown = 0, current = "all", list = pool;
    var filters = document.getElementById("taskFilters"), note = document.getElementById("taskNote"), more = document.getElementById("taskMore");
    var order = ["single", "conflict", "compose", "scale"];
    filters.innerHTML = '<button type="button" class="filter on" data-suite="all">All suites<small>' + pool.length + "</small></button>" +
      order.map(function (s) {
        var n = pool.filter(function (t) { return t.suite === s; }).length;
        return n ? '<button type="button" class="filter" data-suite="' + s + '">' + SUITES[s].name + "<small>" + n + "</small></button>" : "";
      }).join("");

    function card(t) {
      var tier = TIERS[t.tier] || TIERS.multi;
      var c = el("div", "card task-card");
      c.innerHTML =
        '<div class="media" data-video><video src="' + t.video + '" poster="' + t.poster + '" muted loop playsinline preload="none"></video><span class="play">▶</span></div>' +
        '<div class="task-body">' +
          '<div class="task-title">' + esc(t.title) + "</div>" +
          '<div class="task-task">' + esc(t.task) + "</div>" +
          '<div class="task-meta"><span class="tag" style="--c:' + tier.color + ";--cb:" + tier.bg + '">' + SUITES[t.suite].name + "</span>" +
            (t.cond ? '<span class="tag">' + esc(t.cond) + "</span>" : "") + '<span class="id mono">' + esc(t.id) + "</span></div>" +
          '<div class="scores">' + scoreChips(t) + "</div>" +
        "</div>";
      bindVideo(c.querySelector("[data-video]"));
      return c;
    }
    function fill() {
      list.slice(shown, shown + PAGE).forEach(function (t) { grid.appendChild(card(t)); });
      shown = Math.min(shown + PAGE, list.length);
      more.style.display = shown < list.length ? "" : "none";
      more.textContent = "Show more (" + shown + " of " + list.length + ")";
    }
    function apply(suite) {
      current = suite;
      list = suite === "all" ? pool : pool.filter(function (t) { return t.suite === suite; });
      note.textContent = suite === "all" ? "Clips are grouped by suite. Pick one to see how its conditions are laid out." : SUITES[suite].note;
      grid.innerHTML = ""; shown = 0; fill();
    }
    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".filter");
      if (!b) return;
      filters.querySelectorAll(".filter").forEach(function (x) { x.classList.toggle("on", x === b); });
      apply(b.getAttribute("data-suite"));
    });
    more.addEventListener("click", fill);
    apply("all");
  }

  /* ---------- nav highlight + scroll progress ---------- */
  var bar = document.getElementById("progressBar");
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute("href").slice(1)) }; }).filter(function (s) { return s.el; });
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    var pos = window.scrollY + 130, cur = sections[0];
    sections.forEach(function (s) { if (s.el.offsetTop <= pos) cur = s; });
    links.forEach(function (a) { a.classList.toggle("active", cur && a === cur.a); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (e) { rio.observe(e); });
  } else {
    reveals.forEach(function (e) { e.classList.add("in"); });
  }

  /* ---------- BibTeX copy ---------- */
  var copy = document.getElementById("copyBibtex");
  if (copy) {
    copy.addEventListener("click", function () {
      var text = document.getElementById("bibtex").textContent.trim();
      function done() {
        copy.textContent = "Copied ✓"; copy.classList.add("done");
        setTimeout(function () { copy.textContent = "Copy BibTeX"; copy.classList.remove("done"); }, 1800);
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* nothing to do */ }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
      else fallback();
    });
  }
})();
