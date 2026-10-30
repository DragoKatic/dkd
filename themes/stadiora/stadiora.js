// Stadiora Sport – sports TV channel website demo by Drago Katić Development
(function () {
  "use strict";

  var header = document.querySelector(".sd-header");
  var menu = document.querySelector(".sd-menu");

  // header shadow after scrolling, mobile menu
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll); // after the first layout, so reading scrollY does not force one

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
  }
  menu.addEventListener("click", function () {
    setMenu(menu.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      menu.focus();
    }
  });

  // scores ticker: pause button (the crawl is off with reduced motion)
  var ticker = document.querySelector(".sd-ticker");
  if (ticker) {
    var pause = ticker.querySelector(".sd-ticker-pause");
    pause.addEventListener("click", function () {
      var paused = pause.getAttribute("aria-pressed") !== "true";
      pause.setAttribute("aria-pressed", paused ? "true" : "false");
      pause.textContent = paused ? "Play" : "Pause";
      ticker.classList.toggle("is-paused", paused);
    });
  }

  // live match clock on the score bug: one minute per real minute, then stoppage time
  var clock = document.querySelector(".sd-clock");
  if (clock) {
    var minute = Number(clock.getAttribute("data-start"));
    var bug = clock.closest(".sd-bug");
    setInterval(function () {
      minute++;
      clock.textContent = minute <= 90 ? String(minute) : "90+" + Math.min(minute - 90, 5);
      bug.setAttribute("aria-label", "Live score: Ardenport FC 1, Brennholt United 1, minute " + clock.textContent);
    }, 60000);
  }

  // ---- TV guide data: the broadcast day runs 06:00 to 06:00
  var EPG = window.STADIORA;
  var DAY_START = 360;

  function toMin(hhmm) {
    var p = hhmm.split(":");
    var m = Number(p[0]) * 60 + Number(p[1]);
    return m < DAY_START ? m + 1440 : m;
  }

  // index of the current broadcast day (0 = Monday) and minutes since its midnight
  function broadcastNow() {
    var d = new Date();
    var mins = d.getHours() * 60 + d.getMinutes();
    var day = (d.getDay() + 6) % 7;
    if (mins < DAY_START) {
      day = (day + 6) % 7;
      mins += 1440;
    }
    return { day: day, mins: mins };
  }

  function nowAndNext(list, mins) {
    for (var i = 0; i < list.length; i++) {
      var s = toMin(list[i][0]);
      if (mins >= s && mins < s + list[i][1]) {
        return { now: list[i], next: list[i + 1] || null, progress: (mins - s) / list[i][1] };
      }
    }
    return null;
  }

  // home: now & next on every channel
  var rails = document.querySelectorAll(".sd-rail");
  if (rails.length && EPG) {
    var renderRails = function () {
      var bn = broadcastNow();
      rails.forEach(function (rail) {
        var info = nowAndNext(EPG.days[bn.day][rail.getAttribute("data-channel")], bn.mins);
        var box = rail.querySelector(".sd-rail-now");
        if (!info) {
          return;
        }
        box.textContent = "";
        var label = document.createElement("span");
        label.className = "sd-rail-label";
        label.textContent = "Now · " + info.now[0];
        var title = document.createElement("b");
        title.textContent = info.now[2];
        box.appendChild(label);
        box.appendChild(title);
        var meta = document.createElement("span");
        meta.className = "sd-prog-meta";
        meta.textContent = info.now[3] + " ";
        if (info.now[4] === "live") {
          var lt = document.createElement("b");
          lt.className = "sd-live-tag";
          lt.textContent = "Live";
          meta.appendChild(lt);
        }
        box.appendChild(meta);
        var bar = rail.querySelector(".sd-progress") || document.createElement("div");
        bar.className = "sd-progress";
        bar.setAttribute("aria-hidden", "true");
        bar.innerHTML = "<span></span>";
        bar.firstChild.style.setProperty("--p", Math.round(info.progress * 100) + "%");
        rail.appendChild(bar);
        var next = rail.querySelector(".sd-rail-next") || document.createElement("p");
        next.className = "sd-rail-next";
        next.textContent = "";
        if (info.next) {
          next.appendChild(document.createTextNode("Next " + info.next[0] + " "));
          var nb = document.createElement("b");
          nb.textContent = info.next[2];
          next.appendChild(nb);
        }
        rail.appendChild(next);
      });
    };
    renderRails();
    setInterval(renderRails, 60000);
  }

  // TV guide page: day tabs, sport and live filters, what's on now
  var guide = document.querySelector(".sd-guide");
  if (guide) {
    var days = guide.querySelectorAll(".sd-day");
    var tabs = guide.querySelector(".sd-days");
    var chips = guide.querySelectorAll(".sd-chip");
    var liveOnly = guide.querySelector(".sd-live-only");
    var empty = guide.querySelector(".sd-empty");
    var DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var bn = broadcastNow();
    var sport = "all";
    var current = bn.day;

    var tabButtons = [];
    for (var k = 0; k < 7; k++) {
      var di = (bn.day + k) % 7;
      var date = new Date();
      date.setDate(date.getDate() + k - (new Date().getHours() * 60 + new Date().getMinutes() < DAY_START ? 1 : 0));
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.id = "sd-tab-" + di;
      b.setAttribute("aria-controls", "sd-daypanel-" + di);
      b.setAttribute("data-day", di);
      b.innerHTML = (k === 0 ? "Today" : k === 1 ? "Tomorrow" : DAY_LONG[di].slice(0, 3)) +
        "<small>" + DAY_LONG[di].slice(0, 3) + " " + date.getDate() + "." + (date.getMonth() + 1) + ".</small>";
      tabs.appendChild(b);
      tabButtons.push(b);
    }
    days.forEach(function (d) {
      var i = d.getAttribute("data-day");
      d.id = "sd-daypanel-" + i;
      d.setAttribute("role", "tabpanel");
      d.setAttribute("aria-labelledby", "sd-tab-" + i);
      d.querySelector(".sd-day-title").classList.add("sd-sr");
    });

    var markNow = function () {
      var now = broadcastNow();
      guide.querySelectorAll(".sd-prog").forEach(function (p) {
        p.classList.remove("is-now", "is-past");
      });
      days[now.day].querySelectorAll(".sd-prog").forEach(function (p) {
        var s = toMin(p.getAttribute("data-start"));
        var e = s + Number(p.getAttribute("data-min"));
        p.classList.toggle("is-now", now.mins >= s && now.mins < e);
        p.classList.toggle("is-past", now.mins >= e);
      });
    };

    var apply = function () {
      var shown = 0;
      days.forEach(function (d) {
        var on = Number(d.getAttribute("data-day")) === current;
        d.hidden = !on;
        if (!on) {
          return;
        }
        d.querySelectorAll(".sd-prog").forEach(function (p) {
          var ok = (sport === "all" || p.getAttribute("data-sport") === sport) &&
            (!liveOnly.checked || p.classList.contains("sd-live"));
          p.hidden = !ok;
          shown += ok ? 1 : 0;
        });
      });
      empty.hidden = shown > 0;
      tabButtons.forEach(function (t) {
        var sel = Number(t.getAttribute("data-day")) === current;
        t.setAttribute("aria-selected", sel ? "true" : "false");
        t.tabIndex = sel ? 0 : -1;
      });
    };

    tabButtons.forEach(function (t, n) {
      t.addEventListener("click", function () {
        current = Number(t.getAttribute("data-day"));
        apply();
      });
      t.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (step) {
          e.preventDefault();
          var to = tabButtons[(n + step + 7) % 7];
          to.focus();
          to.click();
        }
      });
    });
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        sport = c.getAttribute("data-sport");
        chips.forEach(function (x) {
          x.setAttribute("aria-pressed", x === c ? "true" : "false");
        });
        apply();
      });
    });
    liveOnly.addEventListener("change", apply);

    markNow();
    apply();
    setInterval(markNow, 60000);

    // #s1, #s2, #s3, #max: jump to that channel today
    var target = location.hash.slice(1);
    if (/^(s1|s2|s3|max)$/.test(target)) {
      var col = document.getElementById(target + "-" + current);
      if (col) {
        col.scrollIntoView();
      }
    }
  }

  // results page: sport tabs (all panels show without JS)
  var tabList = document.querySelector(".sd-tabs");
  if (tabList) {
    var sTabs = Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      sTabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) {
        tab.focus();
      }
      history.replaceState(null, "", "#" + tab.getAttribute("aria-controls"));
    };
    sTabs.forEach(function (t, n) {
      t.addEventListener("click", function () {
        select(t, false);
      });
      t.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (step) {
          e.preventDefault();
          select(sTabs[(n + step + sTabs.length) % sTabs.length], true);
        }
      });
    });
    var fromHash = document.getElementById("tab-" + location.hash.slice(1));
    select(fromHash || sTabs[0], false);
  }

  // league table: sort by a column (descending first, again for ascending)
  document.querySelectorAll(".sd-sortable").forEach(function (table) {
    var body = table.tBodies[0];
    table.querySelectorAll("thead button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var th = btn.parentNode;
        var col = Number(btn.getAttribute("data-col"));
        var desc = th.getAttribute("aria-sort") !== "descending";
        table.querySelectorAll("thead th").forEach(function (h) {
          h.removeAttribute("aria-sort");
        });
        th.setAttribute("aria-sort", desc ? "descending" : "ascending");
        var rows = Array.prototype.slice.call(body.rows);
        rows.sort(function (a, b) {
          var x = parseFloat(a.cells[col].textContent.replace("−", "-"));
          var y = parseFloat(b.cells[col].textContent.replace("−", "-"));
          return desc ? y - x : x - y;
        });
        rows.forEach(function (r) {
          body.appendChild(r);
        });
      });
    });
  });

  // newsletter: checked in the browser only (demo, nothing is sent)
  var form = document.querySelector(".sd-signup");
  if (form) {
    var email = form.querySelector("input");
    var status = form.querySelector(".sd-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      email.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) {
        status.textContent = "Please enter a valid email address.";
        email.focus();
        return;
      }
      form.reset();
      status.textContent = "Thanks! In a real channel site the first TV guide would now be on its way.";
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
