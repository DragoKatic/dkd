// Stackwise – admin dashboard demo by Drago Katić Development
// Shared by all pages; every block checks that its elements exist on the current page.
// Charts are drawn as SVG from the data table inside each <figure class="chart">,
// so the same table is the fallback without JavaScript and the text version for screen readers.
(function () {
  "use strict";

  var doc = document.documentElement;
  var SVGNS = "http://www.w3.org/2000/svg";
  var THEME_KEY = "stackwise-theme";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // ---------------------------------------------------------------- toasts

  var toasts = $(".toasts");

  function toast(message, actionLabel, action) {
    if (!toasts) {
      return;
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg><span></span>';
    el.querySelector("span").textContent = message;
    if (actionLabel) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = actionLabel;
      btn.addEventListener("click", function () {
        action();
        el.remove();
      });
      el.appendChild(btn);
    }
    toasts.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, actionLabel ? 7000 : 4000);
  }

  // ---------------------------------------------------------------- theme

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "system";
    } catch (e) {
      return "system";
    }
  }

  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(pref) {
    var dark = pref === "dark" || (pref === "system" && darkQuery.matches);
    if (dark) {
      doc.setAttribute("data-theme", "dark");
    } else {
      doc.removeAttribute("data-theme");
    }
    $$(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
    });
    $$('input[name="theme"]').forEach(function (r) {
      r.checked = r.value === pref;
    });
  }

  function setTheme(pref) {
    try {
      if (pref === "system") {
        localStorage.removeItem(THEME_KEY);
      } else {
        localStorage.setItem(THEME_KEY, pref);
      }
    } catch (e) {
      // storage blocked: the choice lasts until the page is left
    }
    applyTheme(pref);
  }

  applyTheme(storedTheme());
  $$('input[name="theme"]').forEach(function (r) {
    r.defaultChecked = r.checked;
    r.addEventListener("change", function () {
      setTheme(r.value);
    });
  });
  darkQuery.addEventListener("change", function () {
    if (storedTheme() === "system") {
      applyTheme("system");
    }
  });
  $$(".theme-toggle").forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(doc.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  });

  // ---------------------------------------------------------------- sidebar, menus

  var menuToggle = $(".menu-toggle");
  var sidebar = $("#sidebar");
  var backdrop = $(".backdrop");

  function setMenu(open) {
    document.body.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    backdrop.hidden = !open;
    if (open) {
      var first = $(".nav-link", sidebar);
      if (first) {
        first.focus();
      }
    }
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    backdrop.addEventListener("click", function () {
      setMenu(false);
    });
  }

  $$(".nav-group-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.getElementById(btn.getAttribute("aria-controls")).hidden = !open;
    });
  });

  // notifications
  var notifyBtn = $(".notify-toggle");
  var notifyPanel = $("#notify-panel");

  function setNotify(open) {
    notifyPanel.hidden = !open;
    notifyBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (notifyBtn) {
    notifyBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setNotify(notifyPanel.hidden);
    });
    document.addEventListener("click", function (e) {
      if (!notifyPanel.hidden && !notifyPanel.contains(e.target)) {
        setNotify(false);
      }
    });
    $(".notify-read").addEventListener("click", function () {
      $$(".unread", notifyPanel).forEach(function (li) {
        li.classList.remove("unread");
      });
      notifyBtn.classList.remove("has-dot");
      $(".visually-hidden", notifyBtn).textContent = "Notifications";
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (notifyPanel && !notifyPanel.hidden) {
        setNotify(false);
        notifyBtn.focus();
      }
      if (document.body.classList.contains("nav-open")) {
        setMenu(false);
        menuToggle.focus();
      }
    }
    // "/" jumps to the search box, unless the user is typing somewhere
    var t = e.target;
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
      var q = $("#top-q");
      if (q) {
        e.preventDefault();
        q.focus();
      }
    }
  });

  // sign out asks first
  var signoutDialog = $("#signout-dialog");
  $$(".sign-out").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (signoutDialog && signoutDialog.showModal) {
        e.preventDefault();
        signoutDialog.showModal();
      }
    });
  });

  // dialogs: buttons with data-open / data-close, click on the backdrop closes
  $$("[data-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var d = $(btn.getAttribute("data-open"));
      d.querySelector("form").reset();
      clearStates(d);
      d.showModal();
    });
  });
  $$("dialog.modal").forEach(function (d) {
    d.addEventListener("click", function (e) {
      if (e.target === d) {
        d.close();
      }
    });
    $$("[data-close]", d).forEach(function (b) {
      b.addEventListener("click", function () {
        d.close();
      });
    });
  });

  // dismissible alerts
  $$("[data-dismissible] .alert-close").forEach(function (b) {
    b.addEventListener("click", function () {
      b.closest("[data-dismissible]").remove();
    });
  });

  // ---------------------------------------------------------------- CSV export

  function csvCell(v) {
    return '"' + String(v).replace(/"/g, '""').trim() + '"';
  }

  function download(filename, lines) {
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
    toast(filename + " downloaded");
  }

  function tableCsv(table) {
    return $$("tr", table).filter(function (tr) {
      return !tr.hidden;
    }).map(function (tr) {
      return $$("th, td", tr).filter(function (c) {
        return !c.classList.contains("js-only");
      }).map(function (c) {
        return csvCell(c.hasAttribute("data-v") ? c.getAttribute("data-v") : c.textContent.replace(/\s+/g, " "));
      }).join(",");
    });
  }

  $$("[data-export]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var table = $(btn.getAttribute("data-export"));
      if (table) {
        download(btn.getAttribute("data-filename"), tableCsv(table));
      }
    });
  });

  // ---------------------------------------------------------------- segmented controls that swap charts

  $$(".segmented").forEach(function (group) {
    var buttons = $$("button[data-show]", group);
    if (!buttons.length) {
      return;
    }
    var card = group.closest(".card");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
          $(b.getAttribute("data-show")).hidden = b !== btn;
        });
        var note = $(".range-note", card);
        if (note && btn.getAttribute("data-note")) {
          note.textContent = btn.getAttribute("data-note");
        }
        var exp = $("[data-export]");
        if (exp && /#src-/.test(exp.getAttribute("data-export"))) {
          exp.setAttribute("data-export", btn.getAttribute("data-show") + " .chart-data");
        }
      });
    });
  });

  // ---------------------------------------------------------------- tabs

  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) {
        tab.focus();
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab);
      });
      tab.addEventListener("keydown", function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n !== undefined) {
          e.preventDefault();
          select(tabs[(n + tabs.length) % tabs.length], true);
        }
      });
    });
    select(tabs[0]);
  });

  var taskCount = $(".task-count");
  if (taskCount) {
    var countTasks = function () {
      taskCount.textContent = $$('.tasks input[type="checkbox"]').filter(function (c) {
        return !c.checked;
      }).length;
    };
    $$('.tasks input[type="checkbox"]').forEach(function (c) {
      c.addEventListener("change", countTasks);
    });
    countTasks();
  }

  // ---------------------------------------------------------------- charts

  function fmt(kind, v, axis) {
    if (kind === "eur") {
      if (axis) {
        return "€" + (v >= 1000 ? v / 1000 + "k" : v);
      }
      return "€" + v.toLocaleString("en-US");
    }
    if (kind === "pct") {
      return v + "%";
    }
    if (kind === "pct1") {
      return v.toFixed(axis ? (v % 1 ? 1 : 0) : 1) + "%";
    }
    if (axis && v >= 1000) {
      return v / 1000 + "k";
    }
    return v.toLocaleString("en-US");
  }

  function niceScale(max, ticks) {
    if (max <= 0) {
      return { top: 1, step: 1 };
    }
    var rough = max / ticks;
    var mag = Math.pow(10, Math.floor(Math.log10(rough)));
    var norm = rough / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    return { top: Math.ceil(max / step - 1e-9) * step, step: step };
  }

  function readTable(fig) {
    var table = $(".chart-data", fig);
    var series = $$("thead th", table).slice(1).map(function (th) {
      return { name: th.textContent, cls: th.getAttribute("data-series") || "s1", values: [] };
    });
    var labels = [];
    $$("tbody tr", table).forEach(function (tr) {
      labels.push($("th", tr).textContent);
      $$("td", tr).forEach(function (td, i) {
        series[i].values.push(parseFloat(td.getAttribute("data-v")));
      });
    });
    return { labels: labels, series: series };
  }

  function tipHtml(title, rows) {
    return "<b>" + esc(title) + "</b>" + rows.map(function (r) {
      return '<p><span class="swatch ' + r[0] + '"></span><span>' + esc(r[1]) + "</span><span>" + esc(r[2]) + "</span></p>";
    }).join("");
  }

  function placeTip(tip, fig, x, y) {
    var fw = fig.clientWidth;
    var w = tip.offsetWidth;
    var left = x + 16;
    if (left + w > fw) {
      left = Math.max(0, x - w - 16);
    }
    tip.style.left = left + "px";
    tip.style.top = Math.max(0, y - tip.offsetHeight / 2) + "px";
  }

  function axisChart(fig, canvas, data, kind) {
    var type = fig.getAttribute("data-type");
    var stacked = fig.hasAttribute("data-stacked");
    var W = canvas.clientWidth;
    var H = canvas.clientHeight;
    var n = data.labels.length;
    var pad = { l: 46, r: 10, t: 10, b: 28 };
    var iw = W - pad.l - pad.r;
    var ih = H - pad.t - pad.b;
    var max = 0;
    for (var i = 0; i < n; i++) {
      var sum = 0;
      data.series.forEach(function (s) {
        sum = stacked ? sum + s.values[i] : Math.max(sum, s.values[i]);
      });
      max = Math.max(max, sum);
    }
    var scale = niceScale(max * 1.05, ih < 200 ? 3 : 4);
    var y = function (v) {
      return pad.t + ih * (1 - v / scale.top);
    };
    var band = iw / n;
    var x = type === "line"
      ? function (k) { return pad.l + (n === 1 ? iw / 2 : (k * iw) / (n - 1)); }
      : function (k) { return pad.l + band * k + band / 2; };

    var out = [];
    for (var v = 0; v <= scale.top + 1e-9; v += scale.step) {
      var yy = Math.round(y(v)) + 0.5;
      out.push('<line class="grid-line" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + yy + '" y2="' + yy + '"/>');
      out.push('<text class="axis-text" x="' + (pad.l - 10) + '" y="' + (yy + 4) + '" text-anchor="end">' + esc(fmt(kind, +v.toFixed(6), true)) + "</text>");
    }
    var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 52))));
    data.labels.forEach(function (lbl, k) {
      if (k % every === 0) {
        out.push('<text class="axis-text" x="' + x(k) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(lbl) + "</text>");
      }
    });
    out.push('<rect class="hover-band" x="0" y="' + pad.t + '" width="0" height="' + ih + '" visibility="hidden"/>');

    if (type === "line") {
      data.series.slice().reverse().forEach(function (s, ri) {
        var first = ri === data.series.length - 1;
        var pts = s.values.map(function (val, k) {
          return x(k).toFixed(1) + "," + y(val).toFixed(1);
        });
        if (first) {
          out.push('<path class="area ' + s.cls + '" d="M' + pad.l + "," + y(0) + " L" + pts.join(" L") + " L" + x(n - 1) + "," + y(0) + ' Z"/>');
        }
        out.push('<polyline class="line ' + s.cls + (first ? "" : " dashed") + '" points="' + pts.join(" ") + '"/>');
      });
      out.push('<line class="guide" y1="' + pad.t + '" y2="' + (pad.t + ih) + '" visibility="hidden"/>');
      data.series.forEach(function (s) {
        out.push('<circle class="point ' + s.cls + '" r="4.5" visibility="hidden"/>');
      });
    } else {
      var bw = Math.min(band * 0.62, 40);
      data.labels.forEach(function (lbl, k) {
        var base = 0;
        data.series.forEach(function (s, si) {
          var val = s.values[k];
          var top = y(base + val);
          var h = y(base) - top;
          var bx = stacked || data.series.length === 1 ? x(k) - bw / 2 : x(k) - bw / 2 + (bw / data.series.length) * si;
          var w = stacked || data.series.length === 1 ? bw : bw / data.series.length - 2;
          var gap = stacked && si > 0 ? 1.5 : 0;
          out.push('<rect class="bar-rect ' + s.cls + '" x="' + bx.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(0, h - gap).toFixed(1) + '" rx="3"/>');
          if (stacked) {
            base += val;
          }
        });
      });
    }
    canvas.innerHTML = '<svg xmlns="' + SVGNS + '" width="' + W + '" height="' + H + '">' + out.join("") + "</svg>";

    // hover / touch: nearest point or bar
    var svg = canvas.firstChild;
    var bandRect = $(".hover-band", svg);
    var guide = $(".guide", svg);
    var points = $$(".point", svg);
    var tip = fig._tip;

    function show(k) {
      if (type === "line") {
        guide.setAttribute("x1", x(k));
        guide.setAttribute("x2", x(k));
        guide.setAttribute("visibility", "visible");
        data.series.forEach(function (s, si) {
          points[si].setAttribute("cx", x(k));
          points[si].setAttribute("cy", y(s.values[k]));
          points[si].setAttribute("visibility", "visible");
        });
      } else {
        bandRect.setAttribute("x", pad.l + band * k);
        bandRect.setAttribute("width", band);
        bandRect.setAttribute("visibility", "visible");
      }
      var rows = data.series.map(function (s) {
        return [s.cls, s.name, fmt(kind, s.values[k])];
      });
      if (stacked) {
        rows.push(["", "Total", fmt(kind, data.series.reduce(function (a, s) { return a + s.values[k]; }, 0))]);
      }
      tip.innerHTML = tipHtml(data.labels[k], rows.reverse());
      tip.hidden = false;
      var topVal = type === "line" ? Math.max.apply(null, data.series.map(function (s) { return s.values[k]; })) : 0;
      placeTip(tip, fig, x(k), type === "line" ? y(topVal) : pad.t + ih / 3);
    }

    function hide() {
      tip.hidden = true;
      [bandRect, guide].concat(points).forEach(function (el) {
        if (el) {
          el.setAttribute("visibility", "hidden");
        }
      });
    }

    svg.addEventListener("pointermove", function (e) {
      var r = svg.getBoundingClientRect();
      var px = e.clientX - r.left;
      var k = type === "line" ? Math.round(((px - pad.l) / iw) * (n - 1)) : Math.floor((px - pad.l) / band);
      if (px < pad.l - 10 || k < 0 || k >= n) {
        hide();
        return;
      }
      show(Math.min(n - 1, Math.max(0, k)));
    });
    svg.addEventListener("pointerleave", hide);
  }

  function donutChart(fig, canvas, data, kind) {
    var W = canvas.clientWidth;
    var H = canvas.clientHeight;
    var s = data.series[0];
    var total = s.values.reduce(function (a, b) { return a + b; }, 0);
    var size = Math.min(W, H);
    var r = size / 2 - 18;
    var cx = W / 2;
    var cy = H / 2;
    var c = 2 * Math.PI * r;
    var offset = 0;
    var out = [];
    s.values.forEach(function (v, i) {
      var len = (v / total) * c;
      out.push('<circle class="slice s' + (i + 1) + '" data-i="' + i + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke-width="22" stroke-dasharray="' + Math.max(0, len - 3).toFixed(2) + " " + c.toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 ' + cx + " " + cy + ')"/>');
      offset += len;
    });
    var center = fig.getAttribute("data-center");
    var centerLabel = fig.getAttribute("data-center-label");
    out.push('<text class="donut-value" x="' + cx + '" y="' + (cy + 4) + '">' + esc(center) + "</text>");
    out.push('<text class="donut-label" x="' + cx + '" y="' + (cy + 24) + '">' + esc(centerLabel) + "</text>");
    canvas.innerHTML = '<svg xmlns="' + SVGNS + '" width="' + W + '" height="' + H + '">' + out.join("") + "</svg>";

    var svg = canvas.firstChild;
    var valueEl = $(".donut-value", svg);
    var labelEl = $(".donut-label", svg);
    var items = $$(".legend-list li", fig);

    function hot(i) {
      $$(".slice", svg).forEach(function (sl, k) {
        sl.classList.toggle("is-hot", k === i);
      });
      items.forEach(function (li, k) {
        li.classList.toggle("is-hot", k === i);
      });
      if (i < 0) {
        valueEl.textContent = center;
        labelEl.textContent = centerLabel;
      } else {
        valueEl.textContent = fmt(kind, s.values[i]);
        labelEl.textContent = data.labels[i];
      }
    }

    $$(".slice", svg).forEach(function (sl) {
      sl.addEventListener("pointerenter", function () {
        hot(+sl.getAttribute("data-i"));
      });
      sl.addEventListener("pointerleave", function () {
        hot(-1);
      });
    });
    fig._hot = hot;
  }

  $$("figure.chart").forEach(function (fig) {
    var canvas = $(".chart-canvas", fig);
    var data = readTable(fig);
    var kind = fig.getAttribute("data-format");
    var type = fig.getAttribute("data-type");
    var lastW = 0;
    if (type !== "donut") {
      fig._tip = document.createElement("div");
      fig._tip.className = "chart-tip";
      fig._tip.hidden = true;
      fig._tip.setAttribute("aria-hidden", "true");
      fig.appendChild(fig._tip);
    }

    function draw() {
      var w = canvas.clientWidth;
      if (!w || w === lastW) {
        return;
      }
      lastW = w;
      if (type === "donut") {
        donutChart(fig, canvas, data, kind);
      } else {
        axisChart(fig, canvas, data, kind);
      }
    }

    if (type === "donut") {
      $$(".legend-list li", fig).forEach(function (li, i) {
        li.addEventListener("pointerenter", function () {
          fig._hot(i);
        });
        li.addEventListener("pointerleave", function () {
          fig._hot(-1);
        });
      });
    }

    if (window.ResizeObserver) {
      var raf = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }).observe(canvas);
    } else {
      draw();
      window.addEventListener("resize", draw);
    }
  });

  // sparklines in the KPI cards
  $$("svg.spark[data-points]").forEach(function (svg) {
    var v = svg.getAttribute("data-points").split(",").map(Number);
    var min = Math.min.apply(null, v);
    var max = Math.max.apply(null, v);
    var pts = v.map(function (val, i) {
      return ((i / (v.length - 1)) * 120).toFixed(1) + "," + (32 - ((val - min) / (max - min || 1)) * 28).toFixed(1);
    });
    svg.innerHTML = '<polygon points="0,36 ' + pts.join(" ") + ' 120,36"/><polyline points="' + pts.join(" ") + '"/>';
  });

  // ---------------------------------------------------------------- regions: tile map

  var tiles = $$(".tile[data-code]");
  if (tiles.length) {
    var metric = "revenue";
    var metricNames = { revenue: "revenue", orders: "orders", customers: "customers" };
    var rankBody = $(".rank-table tbody");
    var countryCard = $(".country-card");
    var money = function (v, d) {
      return "€" + v.toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    };
    var val = function (el, m) {
      return +el.getAttribute("data-" + (m || metric));
    };
    var show = function (m, v) {
      return m === "revenue" ? money(v) : v.toLocaleString("en-US");
    };
    var selected = $('.tile[aria-pressed="true"]') || tiles[0];

    var total = function (m) {
      return tiles.reduce(function (a, t) { return a + val(t, m); }, 0);
    };

    var paint = function () {
      var max = Math.max.apply(null, tiles.map(function (t) { return val(t); }));
      tiles.forEach(function (t) {
        var v = Math.sqrt(val(t) / max);
        t.style.setProperty("--v", v.toFixed(3));
        t.classList.toggle("light-text", v > 0.86);
        t.setAttribute("aria-label", t.getAttribute("data-name") + ", " + show(metric, val(t)) + " " + metricNames[metric]);
      });

      // ranking table follows the chosen metric
      var sum = total(metric);
      var rows = $$("tr", rankBody).sort(function (a, b) {
        return val($('.tile[data-code="' + b.getAttribute("data-code") + '"]')) - val($('.tile[data-code="' + a.getAttribute("data-code") + '"]'));
      });
      rows.forEach(function (tr, i) {
        var t = $('.tile[data-code="' + tr.getAttribute("data-code") + '"]');
        tr.querySelector(".rank").textContent = i + 1;
        $(".share .bar > span", tr).style.width = ((val(t) / max) * 100).toFixed(1) + "%";
        $(".share", tr).lastChild.textContent = ((val(t) / sum) * 100).toFixed(1) + "%";
        rankBody.appendChild(tr);
      });
      $(".rank-table thead th:last-child").textContent = "Share of " + metricNames[metric];
      $(".rank-table").closest(".card").querySelector(".card-sub").textContent = "All markets by " + metricNames[metric];
      select(selected);
    };

    var select = function (tile) {
      selected = tile;
      tiles.forEach(function (t) {
        t.setAttribute("aria-pressed", t === tile ? "true" : "false");
      });
      var rev = val(tile, "revenue");
      var ord = val(tile, "orders");
      var share = (val(tile) / total(metric)) * 100;
      var rank = tiles.filter(function (t) { return val(t) > val(tile); }).length + 1;
      $(".country-name", countryCard).textContent = tile.getAttribute("data-name");
      $('[data-stat="revenue"]', countryCard).textContent = money(rev);
      $('[data-stat="orders"]', countryCard).textContent = ord.toLocaleString("en-US");
      $('[data-stat="customers"]', countryCard).textContent = val(tile, "customers").toLocaleString("en-US");
      $('[data-stat="aov"]', countryCard).textContent = money(rev / ord, 2);
      $('[data-stat="share"]', countryCard).textContent = share.toFixed(1) + "%";
      $('[data-stat="share"]', countryCard).nextSibling.textContent = " of all " + metricNames[metric] + " · rank ";
      $('[data-stat="rank"]', countryCard).textContent = rank;
      $('[data-stat="bar"]', countryCard).style.width = share.toFixed(1) + "%";
      $$("tr", rankBody).forEach(function (tr) {
        tr.classList.toggle("is-selected", tr.getAttribute("data-code") === tile.getAttribute("data-code"));
      });
    };

    tiles.forEach(function (t) {
      t.addEventListener("click", function () {
        select(t);
      });
    });
    $$(".segmented [data-metric]").forEach(function (btn, i, all) {
      btn.addEventListener("click", function () {
        all.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        metric = btn.getAttribute("data-metric");
        paint();
      });
    });
    paint();
  }

  // ---------------------------------------------------------------- form validation helpers

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setState(input, state, msg) {
    var field = input.closest(".field");
    field.classList.remove("is-valid", "is-warn", "is-invalid");
    if (state) {
      field.classList.add("is-" + state);
    }
    input.setAttribute("aria-invalid", state === "invalid" ? "true" : "false");
    var m = $(".field-msg", field);
    if (m) {
      if (!m.hasAttribute("data-hint")) {
        m.setAttribute("data-hint", m.textContent);
      }
      m.textContent = msg !== undefined ? msg : m.getAttribute("data-hint");
      if (!input.getAttribute("aria-describedby") && m.id === "") {
        m.id = input.id + "-msg";
        input.setAttribute("aria-describedby", m.id);
      }
    }
  }

  function clearStates(root) {
    $$(".field", root).forEach(function (f) {
      var input = $("input, select, textarea", f);
      if (input && $(".field-msg", f)) {
        setState(input, null);
      }
    });
  }

  function checkBasic(input) {
    var v = input.value.trim();
    var label = $("label", input.closest(".field")).textContent.toLowerCase();
    if (input.required && !v) {
      setState(input, "invalid", "Please enter your " + label + ".");
      return false;
    }
    if (input.type === "email" && v && !EMAIL.test(v)) {
      setState(input, "invalid", "This does not look like an email address.");
      return false;
    }
    if (input.pattern && v && !new RegExp("^(?:" + input.pattern + ")$").test(v)) {
      setState(input, "invalid");
      return false;
    }
    if (input.minLength > 0 && v.length < input.minLength) {
      setState(input, "invalid", "Use at least " + input.minLength + " characters.");
      return false;
    }
    return true;
  }

  function firstInvalid(form) {
    var f = $(".is-invalid input, .is-invalid select", form);
    if (f) {
      f.focus();
    }
    return !f;
  }

  // ---------------------------------------------------------------- customers table

  var ctable = $(".customers-table");
  if (ctable) {
    var tbody = $("tbody", ctable);
    var PER_PAGE = 8;
    var st = { q: "", status: "", key: "", dir: 1, page: 1 };
    var data = $$("tr", tbody);
    var search = $("#c-search");
    var statusSel = $("#c-status");
    var info = $(".pager-info");
    var pages = $(".pager-pages");
    var bulk = $(".bulk");
    var selectAll = $(".select-all");
    var statusCls = { Active: "ok", Invited: "info", Paused: "warn" };
    var visible = [];
    var filtered = [];

    var get = function (tr, k) {
      return tr.getAttribute("data-" + k);
    };

    var render = function () {
      var q = st.q.toLowerCase();
      filtered = data.filter(function (tr) {
        var hay = (get(tr, "name") + " " + get(tr, "email") + " " + $(".c-country", tr).textContent).toLowerCase();
        return (!q || hay.indexOf(q) !== -1) && (!st.status || get(tr, "status") === st.status);
      });
      if (st.key) {
        var numeric = st.key === "orders" || st.key === "spent";
        filtered.sort(function (a, b) {
          var x = st.key === "country" ? $(".c-country", a).textContent : get(a, st.key);
          var y = st.key === "country" ? $(".c-country", b).textContent : get(b, st.key);
          return (numeric ? x - y : x.localeCompare(y)) * st.dir;
        });
      }
      var pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
      st.page = Math.min(st.page, pageCount);
      var from = (st.page - 1) * PER_PAGE;
      visible = filtered.slice(from, from + PER_PAGE);
      data.forEach(function (tr) {
        tr.hidden = visible.indexOf(tr) === -1;
      });
      filtered.forEach(function (tr) {
        tbody.appendChild(tr);
      });
      $(".empty").hidden = filtered.length > 0;
      info.textContent = filtered.length
        ? "Showing " + (from + 1) + "–" + (from + visible.length) + " of " + filtered.length + " customers"
        : "No customers";
      pages.innerHTML = "";
      for (var p = 1; p <= pageCount; p++) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = p;
        b.setAttribute("aria-label", "Page " + p);
        if (p === st.page) {
          b.setAttribute("aria-current", "page");
        }
        b.addEventListener("click", goTo.bind(null, p));
        pages.appendChild(b);
      }
      $('[data-page="prev"]').disabled = st.page === 1;
      $('[data-page="next"]').disabled = st.page === pageCount;
      updateBulk();
    };

    var goTo = function (p) {
      st.page = p;
      render();
    };

    var checked = function () {
      return data.filter(function (tr) {
        return $(".sel input", tr).checked;
      });
    };

    var updateBulk = function () {
      var sel = checked();
      bulk.hidden = sel.length === 0;
      $(".bulk-count").textContent = sel.length + " selected";
      var onPage = visible.filter(function (tr) { return $(".sel input", tr).checked; }).length;
      selectAll.checked = visible.length > 0 && onPage === visible.length;
      selectAll.indeterminate = onPage > 0 && onPage < visible.length;
    };

    var setStatus = function (tr, s) {
      tr.setAttribute("data-status", s);
      var pill = $(".c-status", tr);
      pill.textContent = s;
      pill.className = "pill " + statusCls[s] + " c-status";
    };

    var removeRows = function (rows) {
      var removed = rows.map(function (tr) {
        return { tr: tr, index: data.indexOf(tr) };
      });
      data = data.filter(function (tr) { return rows.indexOf(tr) === -1; });
      rows.forEach(function (tr) {
        $(".sel input", tr).checked = false;
        tr.remove();
      });
      render();
      var label = rows.length === 1 ? get(rows[0], "name") + " deleted" : rows.length + " customers deleted";
      toast(label, "Undo", function () {
        removed.sort(function (a, b) { return a.index - b.index; }).forEach(function (r) {
          data.splice(r.index, 0, r.tr);
          tbody.appendChild(r.tr);
        });
        render();
      });
    };

    var fillRow = function (tr, name, email, cc) {
      var parts = name.trim().split(/\s+/);
      var initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
      tr.setAttribute("data-name", name);
      tr.setAttribute("data-email", email);
      tr.setAttribute("data-country", cc);
      $(".c-name", tr).textContent = name;
      $(".c-email", tr).textContent = email;
      $(".avatar", tr).textContent = initials;
      $(".c-country", tr).textContent = $('#e-country option[value="' + cc + '"]').textContent;
      $(".sel input", tr).setAttribute("aria-label", "Select " + name);
      $('[data-action="edit"] .visually-hidden', tr).textContent = "Edit " + name;
      $('[data-action="delete"] .visually-hidden', tr).textContent = "Delete " + name;
    };

    // row buttons
    var editDialog = $("#edit-dialog");
    var editForm = $("form", editDialog);
    var editing = null;
    tbody.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) {
        return;
      }
      var tr = btn.closest("tr");
      if (btn.getAttribute("data-action") === "delete") {
        removeRows([tr]);
      } else {
        editing = tr;
        clearStates(editDialog);
        editForm.name.value = get(tr, "name");
        editForm.email.value = get(tr, "email");
        editForm.country.value = get(tr, "country");
        editForm.status.value = get(tr, "status");
        editDialog.showModal();
      }
    });
    tbody.addEventListener("change", updateBulk);

    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = [editForm.name, editForm.email].map(checkBasic).every(Boolean);
      if (!ok) {
        firstInvalid(editForm);
        return;
      }
      fillRow(editing, editForm.name.value.trim(), editForm.email.value.trim(), editForm.country.value);
      setStatus(editing, editForm.status.value);
      editDialog.close();
      render();
      toast("Changes to " + get(editing, "name") + " saved");
    });

    var inviteDialog = $("#invite-dialog");
    var inviteForm = $("form", inviteDialog);
    var nextId = data.length + 1;
    var template = data[0].cloneNode(true);
    inviteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = [inviteForm.name, inviteForm.email].map(checkBasic).every(Boolean);
      if (!ok) {
        firstInvalid(inviteForm);
        return;
      }
      var tr = template.cloneNode(true);
      tr.hidden = false;
      tr.setAttribute("data-id", nextId++);
      tr.setAttribute("data-orders", "0");
      tr.setAttribute("data-spent", "0");
      var now = new Date();
      tr.setAttribute("data-joined", now.toISOString().slice(0, 10));
      tr.children[4].textContent = now.getDate() + " " + now.toLocaleString("en-US", { month: "short" }) + " " + now.getFullYear();
      tr.children[5].textContent = "0";
      tr.children[6].textContent = "€0.00";
      $(".sel input", tr).checked = false;
      fillRow(tr, inviteForm.name.value.trim(), inviteForm.email.value.trim(), inviteForm.country.value);
      setStatus(tr, "Invited");
      data.unshift(tr);
      tbody.insertBefore(tr, tbody.firstChild);
      st.page = 1;
      inviteDialog.close();
      render();
      toast("Invite sent to " + inviteForm.email.value.trim() + " (demo, nothing was emailed)");
    });

    // search, filter, sort, paging, bulk actions
    search.addEventListener("input", function () {
      st.q = search.value.trim();
      st.page = 1;
      render();
    });
    statusSel.addEventListener("change", function () {
      st.status = statusSel.value;
      st.page = 1;
      render();
    });
    $$("th[data-sort]", ctable).forEach(function (th) {
      $("button", th).addEventListener("click", function () {
        var key = th.getAttribute("data-sort");
        st.dir = st.key === key ? -st.dir : (key === "orders" || key === "spent" || key === "joined" ? -1 : 1);
        st.key = key;
        $$("th[data-sort]", ctable).forEach(function (h) {
          h.removeAttribute("aria-sort");
        });
        th.setAttribute("aria-sort", st.dir === 1 ? "ascending" : "descending");
        render();
      });
    });
    $('[data-page="prev"]').addEventListener("click", function () {
      goTo(st.page - 1);
    });
    $('[data-page="next"]').addEventListener("click", function () {
      goTo(st.page + 1);
    });
    selectAll.addEventListener("change", function () {
      visible.forEach(function (tr) {
        $(".sel input", tr).checked = selectAll.checked;
      });
      updateBulk();
    });
    $('[data-bulk="pause"]').addEventListener("click", function () {
      var rows = checked();
      rows.forEach(function (tr) {
        setStatus(tr, "Paused");
        $(".sel input", tr).checked = false;
      });
      render();
      toast(rows.length + (rows.length === 1 ? " customer" : " customers") + " paused");
    });
    $('[data-bulk="delete"]').addEventListener("click", function () {
      removeRows(checked());
    });
    $("[data-export-customers]").addEventListener("click", function () {
      var lines = [["Name", "Email", "Country", "Status", "Joined", "Orders", "Spent (EUR)"].map(csvCell).join(",")];
      filtered.forEach(function (tr) {
        lines.push([get(tr, "name"), get(tr, "email"), $(".c-country", tr).textContent, get(tr, "status"), get(tr, "joined"), get(tr, "orders"), get(tr, "spent")].map(csvCell).join(","));
      });
      download("oakmere-customers.csv", lines);
    });

    // ?q= from the search box in the top bar
    var q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      search.value = q;
      st.q = q.trim();
      $("#top-q").value = q;
    }
    render();
  }

  // ---------------------------------------------------------------- settings

  var settings = $("form.settings");
  if (settings) {
    var emailInput = $("#s-email");
    var originalEmail = emailInput.value;
    var pNew = $("#s-new");
    var pConfirm = $("#s-confirm");
    var pCurrent = $("#s-current");
    var meter = $(".strength");
    var notes = $("#s-notes");
    var counter = $(".char-count");

    var checkField = function (input) {
      if (!checkBasic(input)) {
        return false;
      }
      if (input === emailInput && input.value.trim() !== originalEmail) {
        setState(input, "warn", "We will send a confirmation link to the new address.");
      } else if (input.id === "s-user") {
        setState(input, "valid", "Looks good — this name is free.");
      } else {
        setState(input, "valid", "");
      }
      return true;
    };

    var strength = function (p) {
      var s = 0;
      if (p.length >= 10) { s++; }
      if (/[a-z]/.test(p) && /[A-Z]/.test(p)) { s++; }
      if (/\d/.test(p)) { s++; }
      if (/[^A-Za-z0-9]/.test(p)) { s++; }
      return p ? Math.max(1, s) : 0;
    };

    var checkPasswords = function () {
      var ok = true;
      var p = pNew.value;
      var level = strength(p);
      meter.setAttribute("data-level", level);
      if (!p && !pConfirm.value && !pCurrent.value) {
        [pNew, pConfirm, pCurrent].forEach(function (i) { setState(i, null); });
        return true;
      }
      if (!pCurrent.value) {
        setState(pCurrent, "invalid", "Enter your current password to change it.");
        ok = false;
      } else {
        setState(pCurrent, null);
      }
      if (level < 2 || p.length < 10) {
        setState(pNew, "invalid", (["", "Weak", "Fair", "Good", "Strong"][level] || "Weak") + ": use 10+ characters with capitals, numbers and symbols.");
        ok = false;
      } else {
        setState(pNew, level === 4 ? "valid" : "warn", level === 4 ? "Strong password." : "Good. A symbol or number would make it stronger.");
      }
      if (pConfirm.value !== p) {
        setState(pConfirm, "invalid", "The passwords do not match.");
        ok = false;
      } else if (p) {
        setState(pConfirm, "valid", "Passwords match.");
      }
      return ok;
    };

    $$("#s-first, #s-last, #s-user, #s-email", settings).forEach(function (input) {
      input.addEventListener("blur", function () {
        checkField(input);
      });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("is-invalid")) {
          checkField(input);
        }
      });
    });
    [pNew, pConfirm, pCurrent].forEach(function (i) {
      i.addEventListener("input", function () {
        if (i === pNew) {
          meter.setAttribute("data-level", strength(pNew.value));
        }
        if (i.closest(".field").classList.contains("is-invalid") || i === pConfirm) {
          checkPasswords();
        }
      });
      i.addEventListener("blur", checkPasswords);
    });

    var count = function () {
      counter.textContent = notes.value.length;
    };
    notes.addEventListener("input", count);
    count();

    var avatarInput = $("#s-avatar");
    var avatarImg = $(".avatar-field img");
    avatarInput.addEventListener("change", function () {
      var f = avatarInput.files[0];
      if (!f) {
        return;
      }
      if (avatarImg.src) {
        URL.revokeObjectURL(avatarImg.src);
      }
      avatarImg.src = URL.createObjectURL(f);
      avatarImg.hidden = false;
      avatarImg.nextElementSibling.hidden = true;
      $(".file-name").textContent = f.name + " — shown here only, not uploaded.";
    });

    settings.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = $$("#s-first, #s-last, #s-user, #s-email", settings).map(checkField).every(Boolean);
      ok = checkPasswords() && ok;
      if (!firstInvalid(settings) || !ok) {
        toast("Please fix the highlighted fields");
        return;
      }
      [pNew, pConfirm, pCurrent].forEach(function (i) {
        i.value = "";
        setState(i, null);
      });
      meter.setAttribute("data-level", 0);
      $$("input, select, textarea", settings).forEach(function (el) {
        if (el.type === "checkbox" || el.type === "radio") {
          el.defaultChecked = el.checked;
        } else if (el.tagName === "SELECT") {
          $$("option", el).forEach(function (o) { o.defaultSelected = o.selected; });
        } else if (el.type !== "file") {
          el.defaultValue = el.value;
        }
      });
      originalEmail = emailInput.value.trim();
      toast("Settings saved (demo — stored nowhere)");
    });

    settings.addEventListener("reset", function () {
      setTimeout(function () {
        clearStates(settings);
        meter.setAttribute("data-level", 0);
        count();
        setTheme($('input[name="theme"]:checked').value);
        toast("Changes discarded");
      });
    });
  }

  // ---------------------------------------------------------------- sign in

  var signin = $(".signin-form");
  if (signin) {
    var passToggle = $(".pass-toggle");
    var pass = $("#a-pass");
    passToggle.addEventListener("click", function () {
      var show = pass.type === "password";
      pass.type = show ? "text" : "password";
      passToggle.setAttribute("aria-pressed", show ? "true" : "false");
      $(".visually-hidden", passToggle).textContent = show ? "Hide password" : "Show password";
    });
    $$("input[required]", signin).forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value && checkBasic(input)) {
          setState(input, null);
        }
      });
    });
    $(".forgot").addEventListener("click", function (e) {
      e.preventDefault();
      toast("Demo: a reset link would be emailed to you");
    });
    signin.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = $$("input[required]", signin).map(function (i) {
        var good = checkBasic(i);
        if (good) {
          setState(i, null);
        }
        return good;
      }).every(Boolean);
      if (!ok) {
        firstInvalid(signin);
        return;
      }
      var btn = $('button[type="submit"]', signin);
      btn.disabled = true;
      btn.lastChild.textContent = "Signing in…";
      setTimeout(function () {
        window.location.href = signin.getAttribute("action");
      }, 500);
    });
  }
})();
