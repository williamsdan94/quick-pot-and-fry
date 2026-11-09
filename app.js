/* ==========================================================================
   Quick Pot & Fry — how the app works
   ==========================================================================
   This one file draws every screen. There is no server and no account:
   everything runs in the phone's web browser.

   Screens (the part after # in the web address picks the screen):
     #/                         the recipe list with filters
     #/recipe/ID                one recipe: ingredients and "Start cooking"
     #/cook/ID/2                cooking view, step 2
     #/cook/ID/2/ingredients    ingredients, opened from the cooking view
   ========================================================================== */

(function () {
  "use strict";

  // ---------- Settings ----------

  // The filters the app starts with, and what "Reset filters" goes back to.
  var DEFAULT_FILTERS = { under30: false, appliance: "all" };

  // "30 min or less" means a total of 30 minutes or less (30 itself counts).
  var QUICK_LIMIT_MINUTES = 30;

  var APPLIANCE_LABELS = {
    instantPot: "♨️ Instant Pot",
    airFryer: "🌀 Air fryer",
    both: "♨️🌀 Instant Pot + Air fryer"
  };

  // ---------- App memory (forgotten when the page is closed) ----------

  var recipes = [];                       // filled in by start()
  var filters = copy(DEFAULT_FILTERS);    // the filters right now
  var ticked = {};                        // which ingredients were ticked off
  var timers = {};                        // every step timer, by "recipeId:stepNumber"
  var tickHandle = null;                  // the repeating clock for timers
  var alarmHandle = null;                 // the repeating alarm beep
  var audioCtx = null;                    // used to make the beep sound
  var wakeLock = null;                    // asks the phone to keep the screen on

  var app = document.getElementById("app");
  var chipsBox = document.getElementById("timer-chips");
  // The folder app.js lives in (so test pages inside tests/ also work).
  var APP_DIR = (document.currentScript && document.currentScript.src || "").replace(/app\.js(\?.*)?$/, "");
  var finishedAlarms = [];                // timers that finished and still need an "OK"

  // ---------- Small helpers ----------

  function copy(obj) { return JSON.parse(JSON.stringify(obj)); }

  // Makes text safe to put inside the page (stops stray < or & from breaking it).
  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // A short name for timer chips and alarms, e.g. "Chili".
  function shortName(recipe) {
    return recipe.shortName || recipe.name.replace(/^(Instant Pot|Air Fryer) /, "").replace(/\s*\(.*\)$/, "");
  }

  // Adds up every part of the cooking time: prep, preheat, pressure build-up,
  // cooking, release and finishing.
  function totalMinutes(recipe) {
    var t = recipe.times || {};
    return (t.prep || 0) + (t.preheat || 0) + (t.buildUp || 0) + (t.cook || 0) + (t.release || 0) + (t.finish || 0);
  }

  function findRecipe(id) {
    for (var i = 0; i < recipes.length; i++) if (recipes[i].id === id) return recipes[i];
    return null;
  }

  // Turns milliseconds into "08:00" (or "1:05:00" for an hour or more).
  function clock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    var two = function (n) { return (n < 10 ? "0" : "") + n; };
    return (h > 0 ? h + ":" + two(m) : two(m)) + ":" + two(sec);
  }

  // ==========================================================================
  // SCREEN 1: the recipe list
  // ==========================================================================

  // Which recipes pass the current filters.
  function matchingRecipes() {
    return recipes.filter(function (r) {
      if (filters.under30 && totalMinutes(r) > QUICK_LIMIT_MINUTES) return false;
      if (filters.appliance !== "all" && r.appliance !== filters.appliance) return false;
      return true;
    });
  }

  function chip(action, label, on) {
    return '<button type="button" class="chip' + (on ? " on" : "") + '" data-action="' + action + '" aria-pressed="' + on + '">' +
      '<span class="l">' + label + '</span><span class="s">' + (on ? "✓ On" : "Off") + "</span></button>";
  }

  function segButton(value, label) {
    var on = filters.appliance === value;
    return '<button type="button" class="' + (on ? "on" : "") + '" data-action="appliance" data-value="' + value + '" aria-pressed="' + on + '">' +
      (on ? "✓ " : "") + label + "</button>";
  }

  function card(r) {
    return '<button type="button" class="card" data-action="open" data-id="' + esc(r.id) + '">' +
      '<div class="img" style="background:' + esc(r.color) + '">' + r.emoji + "</div><div>" +
      '<div class="name">' + esc(r.name) + "</div>" +
      '<div class="meta"><span class="time">Total ' + totalMinutes(r) + " min</span><span>" + APPLIANCE_LABELS[r.appliance] + "</span></div>" +
      "</div></button>";
  }

  function renderList() {
    var list = matchingRecipes();
    var html =
      '<header><h1 class="app-title">🍲 Quick Pot &amp; Fry</h1><div class="sub">' +
      "Fast Instant Pot &amp; air fryer dinners</div></header>" +
      '<div class="filters"><div class="row">' +
      chip("toggle-quick", "30 min or less", filters.under30) +
      '</div><div class="seg" role="group" aria-label="Appliance">' +
      segButton("instantPot", "Instant Pot") + segButton("airFryer", "Air fryer") + segButton("all", "Both") +
      "</div></div>" +
      '<div class="count" id="count">' + list.length + (list.length === 1 ? " recipe matches" : " recipes match") + "</div>";

    if (list.length > 0) {
      html += '<div class="list">' + list.map(card).join("") + "</div>";
    } else {
      html += '<div class="empty" id="empty-no-match"><div class="emo">🥄</div>' +
        '<div class="et">No recipes match these filters</div>' +
        '<div class="eh">Tap <b>Reset filters</b> to go back to the usual view: 30 min or less Off, Both appliances.</div>' +
        '<button type="button" class="btn-big" data-action="reset-filters">Reset filters</button></div>';
    }
    app.innerHTML = html;
  }

  // ==========================================================================
  // SCREEN 2: ingredients (from the list, or from the cooking view)
  // ==========================================================================

  function renderIngredients(r, fromStep) {
    var top = fromStep
      ? '<button type="button" class="pill" data-action="go" data-href="#/cook/' + esc(r.id) + "/" + fromStep + '">‹ Back to step</button>'
      : '<button type="button" class="pill" data-action="go" data-href="#/">‹ All recipes</button>';
    var t = r.times || {};
    var parts = [];
    if (t.prep) parts.push("prep " + t.prep);
    if (t.preheat) parts.push("preheat " + t.preheat);
    if (t.buildUp) parts.push("pressure build-up " + t.buildUp);
    if (t.cook) parts.push("cook " + t.cook);
    if (t.release) parts.push("pressure release " + t.release);
    if (t.finish) parts.push("finish " + t.finish);

    var rows = r.ingredients.map(function (ing, i) {
      var key = r.id + ":" + i;
      var on = !!ticked[key];
      return '<li class="' + (on ? "ticked" : "") + '"><button type="button" data-action="tick" data-key="' + esc(key) + '" aria-pressed="' + on + '">' +
        '<span class="box">' + (on ? "✓" : "") + '</span><span class="iname">' + esc(ing.item) + '</span><span class="amt">' + esc(ing.amount || "") + "</span></button></li>";
    }).join("");

    app.innerHTML =
      '<div class="top">' + top + "</div>" +
      '<div class="h">Ingredients</div><h1 class="rname">' + r.emoji + " " + esc(r.name) + "</h1>" +
      (fromStep ? "" : '<div class="facts"><b>Total ' + totalMinutes(r) + " min</b> (" + parts.join(" + ") + " min) · " +
        APPLIANCE_LABELS[r.appliance] + " · Serves " + esc(r.servings) +
        (r.appliance === "airFryer" ? "" : "<br>Instant Pot build-up and release times are estimates; a fuller pot takes longer.") + "</div>") +
      '<ul class="ingr">' + rows + "</ul>" +
      // Optional toddler tip (how spicy it is, how to cut it up).
      (r.familyNote ? '<div class="family" id="family-note"><span>👶</span><span><b>For your toddler</b><br>' + esc(r.familyNote) + ".</span></div>" : "") +
      (fromStep ? '<div class="start-wrap"></div>'
                : '<div class="start-wrap"><button type="button" class="btn-big" data-action="go" data-href="#/cook/' + esc(r.id) + '/1">▶ Start cooking</button></div>');
  }

  // ==========================================================================
  // SCREEN 3: the cooking view, one step at a time
  // ==========================================================================

  function renderCook(r, stepNo) {
    var total = r.steps.length;
    var step = r.steps[stepNo - 1];
    var bar = "";
    for (var i = 1; i <= total; i++) bar += '<div class="' + (i <= stepNo ? "done" : "") + '"></div>';

    var timerHtml = "";
    if (step.timer) {
      var tm = getTimer(r, stepNo);
      timerHtml = '<div class="timer" id="timer"><div class="what">' + esc(step.timer.label) + "</div>" +
        '<div class="t" id="t-display" role="timer">' + clock(tm.remainingMs) + "</div>" +
        // One main button: "Start", then "Pause" while running, then "Resume" after pausing.
        '<div class="tbtns"><button type="button" class="t-start" id="t-main" data-action="t-start">▶ Start</button>' +
        '<button type="button" class="t-reset" data-action="t-reset" aria-label="Reset timer">↺ Reset</button></div></div>' +
        '<div class="lock"><span>🔒</span><span>Keep your screen on, since the alarm may not sound if your phone locks.</span></div>';
    }

    // The toddler tip shows on the one step it belongs to (familyNoteStep).
    var toddler = (r.familyNote && r.familyNoteStep === stepNo)
      ? '<div class="family" id="step-family-note"><span>👶</span><span><b>For your toddler</b><br>' + esc(r.familyNote) + ".</span></div>"
      : "";

    app.innerHTML = '<div class="cook" data-recipe="' + esc(r.id) + '" data-step="' + stepNo + '">' +
      '<div class="top"><button type="button" class="pill" data-action="go" data-href="#/recipe/' + esc(r.id) + '">✕ Exit</button>' +
      '<button type="button" class="pill-green" data-action="go" data-href="#/cook/' + esc(r.id) + "/" + stepNo + '/ingredients">📋 Ingredients</button></div>' +
      '<div class="ctitle">' + esc(r.name) + "</div>" +
      '<div class="prog"><div class="lbl" id="step-label">Step ' + stepNo + " of " + total + '</div><div class="bar">' + bar + "</div></div>" +
      '<div class="step" id="step-text">' + esc(step.text) + "</div>" + toddler +
      timerHtml +
      '<div class="spacer"></div>' +
      '<div class="navbar">' +
      '<div class="nav"><button type="button" class="back" data-action="step-back"' + (stepNo === 1 ? " disabled" : "") + ">‹ Back</button>" +
      (stepNo < total
        ? '<button type="button" class="next" data-action="step-next">Next ›</button>'
        : '<button type="button" class="next" data-action="go" data-href="#/recipe/' + esc(r.id) + '">✓ Done</button>') +
      "</div></div></div>";
    updateTimerUI();
  }

  // ==========================================================================
  // TIMERS
  // A running timer remembers the exact clock time it will END (endAt).
  // Every quarter second we compare that end time with the real clock.
  // So if the phone locks or you switch apps, the time left is still right
  // when you come back.
  // ==========================================================================

  function getTimer(r, stepNo) {
    var key = r.id + ":" + stepNo;
    if (!timers[key]) {
      var ms = r.steps[stepNo - 1].timer.minutes * 60 * 1000;
      timers[key] = { key: key, recipeId: r.id, recipeName: r.name, shortName: shortName(r), stepNo: stepNo, label: r.steps[stepNo - 1].timer.label,
        durationMs: ms, remainingMs: ms, endAt: null, running: false, finished: false };
    }
    return timers[key];
  }

  function currentTimer() {
    var cook = app.querySelector(".cook");
    if (!cook) return null;
    var r = findRecipe(cook.getAttribute("data-recipe"));
    var stepNo = Number(cook.getAttribute("data-step"));
    if (!r || !r.steps[stepNo - 1].timer) return null;
    return getTimer(r, stepNo);
  }

  function startTimer(tm) {
    if (tm.running) return;
    if (tm.remainingMs <= 0) { tm.remainingMs = tm.durationMs; }
    tm.finished = false;
    tm.endAt = Date.now() + tm.remainingMs;   // the fixed end time
    tm.running = true;
    unlockSound();
    keepScreenOn();
    ensureTicking();
    updateTimerUI();
  }

  function pauseTimer(tm) {
    if (!tm.running) return;
    tm.remainingMs = Math.max(0, tm.endAt - Date.now());
    tm.running = false;
    tm.endAt = null;
    updateTimerUI();
  }

  function resetTimer(tm) {
    tm.running = false; tm.endAt = null; tm.finished = false;
    tm.remainingMs = tm.durationMs;
    updateTimerUI();
  }

  function ensureTicking() {
    if (!tickHandle) tickHandle = setInterval(tick, 250);
  }

  // Runs 4 times a second while any timer is running.
  function tick() {
    var anyRunning = false;
    Object.keys(timers).forEach(function (k) {
      var tm = timers[k];
      if (!tm.running) return;
      tm.remainingMs = tm.endAt - Date.now();
      if (tm.remainingMs <= 0) {
        tm.remainingMs = 0; tm.running = false; tm.endAt = null; tm.finished = true;
        soundAlarm(tm);
      } else {
        anyRunning = true;
      }
    });
    if (!anyRunning) { clearInterval(tickHandle); tickHandle = null; letScreenSleep(); }
    updateTimerUI();
  }

  // Updates the numbers and buttons on screen without redrawing the page.
  function updateTimerUI() {
    var tm = currentTimer();
    var display = document.getElementById("t-display");
    if (tm && display) {
      display.textContent = tm.finished ? "Done!" : clock(tm.remainingMs);
      document.getElementById("timer").classList.toggle("finished", tm.finished);
      var main = document.getElementById("t-main");
      if (tm.running) {
        main.setAttribute("data-action", "t-pause"); main.className = "t-pause"; main.textContent = "❚❚ Pause";
      } else {
        var wasPaused = !tm.finished && tm.remainingMs < tm.durationMs;
        main.setAttribute("data-action", "t-start"); main.className = "t-start"; main.textContent = wasPaused ? "▶ Resume" : "▶ Start";
      }
    }
    renderChips();
  }

  // A small chip for every running (or paused) timer, shown at the top of
  // EVERY screen, e.g. "⏱ Chili 12:30". Tapping it goes back to that step.
  // On a recipe's own cooking screen, its own timers are not shown as chips
  // (the big timer is already there). If the chips don't fit on one line,
  // they merge into one "⏱ 2 timers" chip that opens the full list.
  var chipsOpen = false;
  var chipsShape = "";      // what the chips looked like last time (to avoid redrawing every tick)
  function renderChips() {
    var cook = app.querySelector(".cook");
    var hereId = cook ? cook.getAttribute("data-recipe") : null;
    var list = Object.keys(timers).map(function (k) { return timers[k]; })
      .filter(function (t) { return t.running || (!t.finished && t.remainingMs < t.durationMs); })
      .filter(function (t) { return t.recipeId !== hereId; });
    chipsBox.hidden = list.length === 0;
    if (list.length < 2) chipsOpen = false;
    chipsBox.classList.toggle("open", chipsOpen);

    var shape = (chipsOpen ? "open:" : "row:") + list.map(function (t) { return t.key + (t.running ? "+" : "-"); }).join(",");
    if (shape === chipsShape) {
      // Same chips as before: only update the times, so taps are never interrupted.
      list.forEach(function (t) {
        var el = chipsBox.querySelector('[data-key="' + t.key + '"]');
        if (el) el.textContent = chipText(t);
      });
      return;
    }
    chipsShape = shape;
    chipsBox.innerHTML = list.map(function (t) {
      return '<button type="button" class="tchip" data-key="' + esc(t.key) + '" data-action="go" data-href="#/cook/' + esc(t.recipeId) + "/" + t.stepNo +
        '" aria-label="' + esc(t.shortName) + " step " + t.stepNo + " timer, " + (t.running ? "running" : "paused") + '">' + esc(chipText(t)) + "</button>";
    }).join("") + (chipsOpen ? '<button type="button" class="tchip tchip-close" data-action="close-chips">Close</button>' : "");
    // Too wide for one line? Show one merged chip instead (tap it to open the list).
    if (!chipsOpen && list.length >= 2 && chipsBox.scrollWidth > chipsBox.clientWidth + 1) {
      chipsBox.innerHTML = '<button type="button" class="tchip" id="chips-merged" data-action="open-chips" aria-expanded="false">⏱ ' +
        list.length + " timers</button>";
    }
  }

  function chipText(t) {
    return (t.running ? "⏱ " : "⏸ ") + t.shortName + " " + clock(t.remainingMs);
  }

  // ---- The alarm: big red screen + beeping + vibration ----

  // Phones only allow sound after a tap, so we get the sound ready on "Start".
  function unlockSound() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }

  function beep() {
    if (!audioCtx) return;
    try {
      [0, 0.35, 0.7].forEach(function (offset) {
        var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.25;
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + offset);
        osc.stop(audioCtx.currentTime + offset + 0.22);
      });
    } catch (e) { /* no sound on this device; the red screen still shows */ }
  }

  // e.g. "Chili: pressure cook on High is done (step 3)"
  function alarmLine(tm) {
    return tm.shortName + ": " + tm.label.charAt(0).toLowerCase() + tm.label.slice(1) + " is done (step " + tm.stepNo + ")";
  }

  function soundAlarm(tm) {
    finishedAlarms.push(tm);
    document.getElementById("alarm-label").innerHTML = finishedAlarms.map(function (t) { return esc(alarmLine(t)); }).join("<br>");
    document.getElementById("alarm").hidden = false;
    document.title = "⏰ Time's up! — Quick Pot & Fry";
    beep();
    if (navigator.vibrate) { try { navigator.vibrate([500, 200, 500, 200, 500]); } catch (e) { /* not allowed */ } }
    var beeps = 0;
    clearInterval(alarmHandle);
    alarmHandle = setInterval(function () {
      beeps++;
      beep();
      if (beeps >= 40) clearInterval(alarmHandle);   // stop by itself after about a minute
    }, 1500);
  }

  function stopAlarm() {
    finishedAlarms = [];
    clearInterval(alarmHandle); alarmHandle = null;
    document.getElementById("alarm").hidden = true;
    document.title = "Quick Pot & Fry";
    if (navigator.vibrate) { try { navigator.vibrate(0); } catch (e) { /* ignore */ } }
  }

  // ---- Ask the phone to keep the screen on while a timer runs (where supported) ----

  function keepScreenOn() {
    if (!("wakeLock" in navigator) || wakeLock) return;
    navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
      lock.addEventListener("release", function () { wakeLock = null; });
    }).catch(function () { /* not allowed here; the on-screen note covers this */ });
  }

  function letScreenSleep() {
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }

  // When you come back to the app, fix the timers right away and ask for the screen lock again.
  // Phone turned or window resized: check again whether the chips fit on one line.
  window.addEventListener("resize", function () { chipsShape = ""; renderChips(); });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      tick();
      if (tickHandle) keepScreenOn();
    }
  });

  // ==========================================================================
  // Choosing which screen to show, based on the web address
  // ==========================================================================

  function notFound() {
    app.innerHTML = '<div class="empty"><div class="emo">🔍</div><div class="et">Recipe not found</div>' +
      '<div class="eh">This link does not match any recipe.</div>' +
      '<button type="button" class="btn-big" data-action="go" data-href="#/">See all recipes</button></div>';
  }

  function route() {
    var parts;
    try {
      parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    } catch (e) {
      notFound();   // a broken link, e.g. #/recipe/%E0%A4%A
      return;
    }
    if (parts.length === 0) { renderList(); }
    else if (parts[0] === "recipe" && parts.length === 2) {
      var r = findRecipe(parts[1]);
      if (r) renderIngredients(r, null); else notFound();
    } else if (parts[0] === "cook" && (parts.length === 3 || (parts.length === 4 && parts[3] === "ingredients"))) {
      var rc = findRecipe(parts[1]);
      var n = parseInt(parts[2], 10);
      if (!rc) { notFound(); }
      else if (!(n >= 1 && n <= rc.steps.length)) { location.replace("#/cook/" + encodeURIComponent(rc.id) + "/1"); return; }
      else if (parts.length === 4) renderIngredients(rc, n);
      else renderCook(rc, n);
    } else { notFound(); }
    window.scrollTo(0, 0);
    renderChips();
  }

  // ==========================================================================
  // Taps: every button has a data-action that says what it does
  // ==========================================================================

  app.addEventListener("click", handleTap);
  chipsBox.addEventListener("click", handleTap);
  document.getElementById("alarm").addEventListener("click", handleTap);

  function handleTap(event) {
    var btn = event.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    var action = btn.getAttribute("data-action");
    var tm;
    switch (action) {
      case "toggle-quick": filters.under30 = !filters.under30; renderList(); break;
      case "appliance": filters.appliance = btn.getAttribute("data-value"); renderList(); break;
      case "reset-filters": filters = copy(DEFAULT_FILTERS); renderList(); break;
      case "open": location.hash = "#/recipe/" + encodeURIComponent(btn.getAttribute("data-id")); break;
      case "go": chipsOpen = false; location.hash = btn.getAttribute("data-href"); break;
      case "tick":
        var key = btn.getAttribute("data-key");
        ticked[key] = !ticked[key];
        btn.parentNode.classList.toggle("ticked", ticked[key]);
        btn.setAttribute("aria-pressed", String(ticked[key]));
        btn.querySelector(".box").textContent = ticked[key] ? "✓" : "";
        break;
      case "step-back": case "step-next":
        var cook = app.querySelector(".cook");
        var n = Number(cook.getAttribute("data-step")) + (action === "step-next" ? 1 : -1);
        location.hash = "#/cook/" + encodeURIComponent(cook.getAttribute("data-recipe")) + "/" + n;
        break;
      case "t-start": tm = currentTimer(); if (tm) startTimer(tm); break;
      case "t-pause": tm = currentTimer(); if (tm) pauseTimer(tm); break;
      case "t-reset": tm = currentTimer(); if (tm) resetTimer(tm); break;
      case "stop-alarm": stopAlarm(); updateTimerUI(); break;
      case "open-chips": chipsOpen = true; renderChips(); break;
      case "close-chips": chipsOpen = false; renderChips(); break;
    }
  }

  // ==========================================================================
  // Starting the app
  // ==========================================================================

  function start() {
    // index.html loads only recipes.js. Test pages may also load recipes-drafts.js.
    recipes = copy((window.RECIPES || []).concat(window.RECIPE_DRAFTS || []));
    window.addEventListener("hashchange", route);
    route();
    // Home-screen / offline support: register the service worker when the browser allows it.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register((APP_DIR || "./") + "sw.js").catch(function () { /* offline cache is optional */ });
    }
  }

  start();
})();
