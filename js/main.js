/* LIBERO-PeRM project page.
   Hero lanes, preference board, task explorer, the shared clip player, rail navigation, BibTeX copy.
   Data comes from assets/tasks/tasks.js (window.PERM_TASKS, window.PERM_META). */
(function () {
  "use strict";

  /* Fill these in when the links go live; an empty entry is shown as "soon". */
  var LINKS = { paper: "", code: "https://github.com/LIBERO-PeRM-NeurIPS/LIBERO-PeRM", dataset: "" };

  var TASKS = window.PERM_TASKS || [];
  var META = window.PERM_META || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var LEVELS = {
    motion:  { name: "Motion",       label: "Motion preference", what: "How the trajectory moves",         brief: "How it moves" },
    skill:   { name: "Skill",        label: "Skill preference",  what: "How a skill is executed",          brief: "How a skill is done" },
    profile: { name: "User profile", label: "User profile",      what: "Which object or target is chosen", brief: "What gets chosen" },
    multi:   { name: "Two preferences", label: "Two preferences", what: "" }
  };
  var LEVEL_ORDER = ["motion", "skill", "profile"];
  var SUITES = {
    single:   { name: "SinglePref",   note: "One preference per task. The top rollout follows it, the bottom one runs the same task without it." },
    scale:    { name: "PrefScale",    note: "Layout and task variants used for the data-scaling study." },
    conflict: { name: "PrefConflict", note: "P1 and P2 are the two sides of a conflict, each with its own rollout. In P1 + P2 the two rollouts each follow one preference and both metrics are plotted. In task + preference clips one rollout follows the task wording and the other follows the preference." },
    compose:  { name: "PrefCompose",  note: "Four conditions per layout: no preference, A, B, and A + B. Both metrics are plotted in every condition, against the no-preference rollout." }
  };
  var SUITE_ORDER = ["single", "scale", "conflict", "compose"];
  /* families whose layouts word the same preference differently */
  var FAMILY_NAME = { "1-4": "Keep away from an object" };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lower(s) { return String(s).charAt(0) + String(s).slice(1).toLowerCase(); }

  /* ---------- outbound links ---------- */
  document.querySelectorAll("[data-link]").forEach(function (a) {
    var url = LINKS[a.getAttribute("data-link")];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
    else {
      a.classList.add("soon"); a.removeAttribute("href"); a.setAttribute("aria-disabled", "true");
      a.appendChild(el("span", "tag-soon", "soon"));
    }
  });
  /* the filled button goes to the first hero link that is live */
  var firstLive = document.querySelector(".actions a[data-link]:not(.soon)");
  if (firstLive) firstLive.classList.add("solid");

  /* ---------- enlarged clip ---------- */
  var lightbox = $("lightbox"), lightboxVideo = $("lightboxVideo");
  function enlarge(task) {
    if (!lightbox || !lightbox.showModal) { window.open(task.video, "_blank"); return; }
    lightboxVideo.poster = task.poster; lightboxVideo.src = task.video;
    lightbox.showModal();
    lightboxVideo.play().catch(function () {});
  }
  if (lightbox) {
    $("lightboxClose").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("close", function () { lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.load(); });
  }

  /* ---------- clip player ----------
     One instance under the preference board, one in the task explorer. */
  function metricColours(t) {
    var cols = t.metrics.map(function (m) { return "var(--" + (LEVELS[m.tier] && m.tier !== "multi" ? m.tier : "second") + ")"; });
    if (cols.length === 2 && cols[0] === cols[1]) cols[1] = "var(--second)";   /* same rule as the rendered curves */
    return cols;
  }
  function makePlayer(root, opts) {
    opts = opts || {};
    root.innerHTML =
      '<div class="clip"><video muted loop playsinline preload="metadata"></video></div>' +
      '<div class="p-top"><span class="lvl"></span><span class="p-id"></span>' +
        '<div class="p-ctl"><button type="button" data-act="toggle">Pause</button><button type="button" data-act="enlarge">Enlarge</button></div><div class="p-extra"></div></div>' +
      "<h3></h3><p class=\"p-task\"></p><p class=\"p-how\"></p><div class=\"readout\"></div>";
    var video = root.querySelector("video"), toggle = root.querySelector('[data-act="toggle"]');
    var extra = root.querySelector(".p-extra"), current = null;
    extra.className = opts.extraClass || "p-nav";

    function setToggle() { toggle.textContent = video.paused ? "Play" : "Pause"; }
    function flip() { if (video.paused) video.play().catch(function () {}); else video.pause(); }
    video.addEventListener("click", flip);
    video.addEventListener("play", setToggle);
    video.addEventListener("pause", setToggle);
    toggle.addEventListener("click", flip);
    root.querySelector('[data-act="enlarge"]').addEventListener("click", function () { if (current) { video.pause(); enlarge(current); } });

    /* play only while on screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (!en.isIntersecting) video.pause(); });
      }).observe(root);
    }

    return {
      extra: extra,
      show: function (t, autoplay) {
        current = t;
        var lv = LEVELS[t.tier] ? t.tier : "multi", cols = metricColours(t);
        root.className = "player lv-" + lv;
        root.querySelector(".lvl").textContent = t.suite === "single" || t.suite === "scale" ? LEVELS[lv].label : SUITES[t.suite].name + (t.cond ? ", " + t.cond : "");
        root.querySelector(".p-id").textContent = t.id;
        root.querySelector("h3").textContent = t.title;
        root.querySelector(".p-task").textContent = "Task: " + t.task;
        root.querySelector(".p-how").innerHTML = t.metrics.map(function (m) {
          return "<b>" + esc(t.metrics.length > 1 ? m.name : "Scored by") + (t.metrics.length > 1 ? ":</b> " : "</b> ") + esc(m.about) + ".";
        }).join(" ") + (t.note ? " " + esc(t.note) : "") + (t.held ? " This curve is still under review." : "");
        root.querySelector(".readout").innerHTML = '<span class="r-title">Satisfaction at the end of the episode</span>' + t.final.map(function (f) {
          var m = t.metrics[f.m], row = lower(t.rows[f.r]);
          var label = t.metrics.length > 1 ? m.name + ", " + row.charAt(0).toLowerCase() + row.slice(1) : row;
          var fill = t.metrics.length > 1 ? cols[f.m] : (f.r === 0 ? "" : "var(--none)");   /* empty: the player's own level colour */
          return '<span class="r-lab">' + esc(label) + '</span><span class="r-bar"><i style="width:' + (f.v == null ? 0 : f.v) + "%" + (fill ? ";background:" + fill : "") + '"></i></span>' +
                 '<span class="r-val">' + (f.v == null ? "n/a" : f.v) + "</span>";
        }).join("");
        video.pause(); video.poster = t.poster; video.src = t.video; video.load();
        if (autoplay && !reduceMotion) video.play().catch(function () {});
        setToggle();
      }
    };
  }

  /* ---------- hero: three lanes of rollouts ---------- */
  var lanes = $("lanes");
  if (lanes && META.reel && META.reel.length) {
    var speeds = { motion: 78, skill: 96, profile: 86 };
    LEVEL_ORDER.forEach(function (lv, i) {
      var clips = META.reel.filter(function (c) { return c.tier === lv; });
      if (!clips.length) return;
      var lane = el("div", "lane lv-" + lv + (i === 1 ? " down" : ""));
      lane.appendChild(el("div", "lane-head", "<b>" + esc(LEVELS[lv].name) + "</b><small>" + esc(LEVELS[lv].brief) + "</small>"));
      var html = clips.map(function (c) {
        return '<a class="tile" href="#pref=' + c.family + '"><video src="assets/reel/' + c.id + '.mp4" muted loop playsinline preload="none" disablepictureinpicture></video><span>' + esc(c.title) + "</span></a>";
      }).join("");
      var track = el("div", "lane-track", reduceMotion ? html : html + html);   /* doubled: the track loops at -50% */
      track.style.setProperty("--dur", speeds[lv] + "s");
      track.style.animationDelay = (-i * 23) + "s";               /* start the lanes out of phase so the tiles never line up in rows */
      if (!reduceMotion) {   /* the copy is for the loop only: keep it out of the tab order and the accessibility tree */
        Array.prototype.slice.call(track.children, clips.length).forEach(function (a) { a.tabIndex = -1; a.setAttribute("aria-hidden", "true"); });
      }
      lane.appendChild(track);
      lanes.appendChild(lane);
    });
    /* After a mouse click on a tile the page jumps to the board. Drop the focus the click left on the tile and
       keep the lanes running, so they are already moving again when the reader scrolls back up. */
    lanes.addEventListener("click", function (e) {
      var tile = e.target.closest(".tile");
      if (!tile || e.detail === 0) return;          /* detail 0 = activated from the keyboard: leave focus alone */
      tile.blur();
      lanes.classList.add("go");
    });
    lanes.addEventListener("mouseleave", function () { lanes.classList.remove("go"); });
    if ("IntersectionObserver" in window) {
      var laneVideos = lanes.querySelectorAll("video");
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          laneVideos.forEach(function (v) { if (en.isIntersecting && !reduceMotion) v.play().catch(function () {}); else v.pause(); });
        });
      }, { rootMargin: "80px" }).observe(lanes);
    }
  }

  /* ---------- preference board ---------- */
  var families = {}, familyList = { motion: [], skill: [], profile: [] };
  TASKS.filter(function (t) { return t.tour; }).forEach(function (t) {
    var f = families[t.family];
    if (!f) {
      f = families[t.family] = { id: t.family, tier: t.tier, name: FAMILY_NAME[t.family] || t.title, demos: [] };
      familyList[t.tier].push(f);
    }
    f.demos.push(t);
  });
  var boardLanes = $("boardLanes"), board = null;
  if (boardLanes && Object.keys(families).length) {
    var prefPlayer = makePlayer($("prefPlayer"), { extraClass: "switch" });
    var bstate = { family: familyList.motion[0].id, demo: 0 };
    LEVEL_ORDER.forEach(function (lv) {
      var col = el("div", "blane lv-" + lv);
      col.innerHTML = "<h3>" + esc(LEVELS[lv].name) + "</h3><p>" + esc(LEVELS[lv].what) + ". " + familyList[lv].length + " preferences.</p>" +
        familyList[lv].map(function (f) { return '<button type="button" class="pref" data-family="' + f.id + '" aria-pressed="false">' + esc(f.name) + "</button>"; }).join("");
      boardLanes.appendChild(col);
    });
    var prefButtons = Array.prototype.slice.call(boardLanes.querySelectorAll(".pref"));

    board = {
      select: function (familyId, demo, autoplay) {
        var f = families[familyId];
        if (!f) return false;
        bstate = { family: familyId, demo: Math.min(demo || 0, f.demos.length - 1) };
        prefButtons.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-family") === familyId ? "true" : "false"); });
        prefPlayer.extra.innerHTML = f.demos.map(function (d, i) {
          return '<button type="button" data-demo="' + i + '" aria-pressed="' + (i === bstate.demo) + '">Layout ' + "AB".charAt(i) + "</button>";
        }).join("");
        prefPlayer.show(f.demos[bstate.demo], autoplay);
        return true;
      }
    };
    boardLanes.addEventListener("click", function (e) {
      var b = e.target.closest(".pref");
      if (b) board.select(b.getAttribute("data-family"), 0, true);
    });
    /* arrow keys walk the board: up and down inside a lane, left and right across lanes */
    boardLanes.addEventListener("keydown", function (e) {
      var b = e.target.closest(".pref");
      if (!b || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) < 0) return;
      var cols = Array.prototype.slice.call(boardLanes.children), ci = cols.indexOf(b.parentNode);
      var items = Array.prototype.slice.call(b.parentNode.querySelectorAll(".pref")), ri = items.indexOf(b), next = null;
      if (e.key === "ArrowUp") next = items[ri - 1];
      else if (e.key === "ArrowDown") next = items[ri + 1];
      else {
        var other = cols[ci + (e.key === "ArrowRight" ? 1 : -1)];
        if (other) { var o = other.querySelectorAll(".pref"); next = o[Math.min(ri, o.length - 1)]; }
      }
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
    prefPlayer.extra.addEventListener("click", function (e) {
      var d = e.target.closest("[data-demo]");
      if (d) board.select(bstate.family, +d.getAttribute("data-demo"), true);
    });
    board.select(bstate.family, 0, false);
  }

  /* ---------- task explorer ---------- */
  var exList = $("exList"), explorer = null;
  if (exList) {
    var pool = TASKS.filter(function (t) { return !t.held; });
    var taskPlayer = makePlayer($("taskPlayer"));
    var exSuites = $("exSuites"), exSearch = $("exSearch"), exNote = $("exNote"), exCount = $("exCount");
    var estate = { suite: "all", query: "", list: pool, index: 0 };
    taskPlayer.extra.innerHTML = '<button type="button" data-step="-1">Previous</button><button type="button" data-step="1">Next</button>';

    exSuites.innerHTML = '<button type="button" data-suite="all" aria-pressed="true">All suites<small>' + pool.length + "</small></button>" +
      SUITE_ORDER.map(function (s) {
        var n = pool.filter(function (t) { return t.suite === s; }).length;
        return n ? '<button type="button" data-suite="' + s + '" aria-pressed="false">' + SUITES[s].name + "<small>" + n + "</small></button>" : "";
      }).join("");

    function rowHtml(t, i) {
      var lv = LEVELS[t.tier] ? t.tier : "multi";
      return '<button type="button" class="row lv-' + lv + '" data-i="' + i + '"><b>' + esc(t.title) + "</b><span>" + esc(t.task) + "</span><em>" +
        esc(SUITES[t.suite].name + (t.cond ? ", " + t.cond : "") + ", " + t.id) + "</em></button>";
    }
    function mark(scroll) {
      var rows = exList.querySelectorAll(".row");
      rows.forEach(function (r, i) { if (i === estate.index) r.setAttribute("aria-current", "true"); else r.removeAttribute("aria-current"); });
      var cur = rows[estate.index];
      if (cur && scroll) {   /* keep the selected row in view without moving the page */
        var top = cur.offsetTop, bottom = top + cur.offsetHeight;
        if (top < exList.scrollTop) exList.scrollTop = top;
        else if (bottom > exList.scrollTop + exList.clientHeight) exList.scrollTop = bottom - exList.clientHeight;
      }
      var steps = taskPlayer.extra.querySelectorAll("button");
      steps[0].disabled = estate.index <= 0; steps[1].disabled = estate.index >= estate.list.length - 1;
    }
    function pick(i, autoplay, scroll) {
      if (!estate.list.length) return;
      estate.index = Math.max(0, Math.min(i, estate.list.length - 1));
      taskPlayer.show(estate.list[estate.index], autoplay);
      mark(scroll);
    }
    function refresh(keepId) {
      var q = estate.query.trim().toLowerCase();
      estate.list = pool.filter(function (t) {
        if (estate.suite !== "all" && t.suite !== estate.suite) return false;
        return !q || (t.title + " " + t.task + " " + t.id + " " + (t.cond || "")).toLowerCase().indexOf(q) >= 0;
      });
      exNote.textContent = estate.suite === "all" ? "Tasks are grouped by suite. Pick one to see how its conditions are laid out." : SUITES[estate.suite].note;
      exCount.textContent = estate.list.length + (estate.list.length === 1 ? " task" : " tasks");
      if (!estate.list.length) {
        exList.innerHTML = '<div class="ex-empty">No task matches “' + esc(estate.query) + '”. The filter looks at the preference, the task sentence and the task id.<button type="button" id="exClear">Clear the filter</button></div>';
        return;
      }
      exList.innerHTML = estate.list.map(rowHtml).join("");
      var at = 0;
      if (keepId) estate.list.some(function (t, i) { if (t.suite + "/" + t.id === keepId) { at = i; return true; } return false; });
      exList.scrollTop = 0;
      pick(at, false, true);
    }
    explorer = {
      setSuite: function (s) {
        estate.suite = s;
        exSuites.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-suite") === s ? "true" : "false"); });
        refresh();
      },
      open: function (key) {   /* key = "<suite>/<task id>" */
        var hit = pool.filter(function (t) { return t.suite + "/" + t.id === key; })[0];
        if (!hit) return false;
        estate.query = ""; exSearch.value = "";
        estate.suite = hit.suite;
        exSuites.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-suite") === hit.suite ? "true" : "false"); });
        refresh(key);
        return true;
      }
    };
    exSuites.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) explorer.setSuite(b.getAttribute("data-suite"));
    });
    exSearch.addEventListener("input", function () { estate.query = exSearch.value; refresh(); });
    exList.addEventListener("click", function (e) {
      if (e.target.id === "exClear") { estate.query = ""; exSearch.value = ""; refresh(); exSearch.focus(); return; }
      var r = e.target.closest(".row");
      if (r) pick(+r.getAttribute("data-i"), true, false);
    });
    exList.addEventListener("keydown", function (e) {
      var r = e.target.closest(".row");
      if (!r) return;
      var i = +r.getAttribute("data-i"), to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? estate.list.length - 1 : null;
      if (to == null || to < 0 || to >= estate.list.length) return;
      e.preventDefault();
      pick(to, true, true);
      exList.querySelectorAll(".row")[to].focus({ preventScroll: true });
    });
    taskPlayer.extra.addEventListener("click", function (e) {
      var b = e.target.closest("[data-step]");
      if (b) pick(estate.index + (+b.getAttribute("data-step")), true, true);
    });
    refresh();
  }

  /* ---------- suite strip opens the explorer on that suite ---------- */
  var strip = $("suiteStrip");
  if (strip && explorer) {
    strip.addEventListener("click", function (e) {
      var b = e.target.closest("[data-suite]");
      if (!b) return;
      explorer.setSuite(b.getAttribute("data-suite"));
      $("tasks").scrollIntoView();
    });
  }

  /* ---------- deep links: #pref=<family> and #task=<suite>/<id> ---------- */
  function route() {
    var h = decodeURIComponent(location.hash.slice(1)), m;
    if ((m = /^pref=(.+)$/.exec(h)) && board && board.select(m[1], 0, true)) $("preferences").scrollIntoView();
    else if ((m = /^task=(.+)$/.exec(h)) && explorer && explorer.open(m[1])) $("tasks").scrollIntoView();
  }
  window.addEventListener("hashchange", route);
  route();

  /* ---------- rail: current section, and the menu on narrow screens ---------- */
  var rail = $("rail"), railToggle = $("railToggle");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".rail-nav a"));
  var sections = navLinks.map(function (a) { return { a: a, el: $(a.getAttribute("href").slice(1)) }; }).filter(function (s) { return s.el; });
  function onScroll() {
    var pos = window.scrollY + window.innerHeight * 0.3, cur = null;
    sections.forEach(function (s) { if (s.el.offsetTop <= pos) cur = s; });
    navLinks.forEach(function (a) {
      if (cur && a === cur.a) { a.classList.add("active"); a.setAttribute("aria-current", "true"); }
      else { a.classList.remove("active"); a.removeAttribute("aria-current"); }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  if (railToggle) {
    railToggle.addEventListener("click", function () {
      var open = rail.classList.toggle("open");
      railToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    rail.addEventListener("click", function (e) {
      if (e.target.closest(".rail-nav a")) { rail.classList.remove("open"); railToggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- BibTeX copy ---------- */
  var copy = $("copyBibtex");
  if (copy) {
    copy.addEventListener("click", function () {
      var text = $("bibtex").textContent.trim();
      function done() { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy BibTeX"; }, 1800); }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (err) { copy.textContent = "Select the text to copy"; }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
      else fallback();
    });
  }
})();
