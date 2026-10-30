// Olmara – Mediterranean restaurant website demo by Drago Katić Development
(function () {
  "use strict";

  var STORE = "olmara-order";
  var MAX = 20;
  var header = document.querySelector(".ol-header");

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll); // after the first layout, so reading scrollY does not force one

  function euro(n) {
    return "€" + n.toFixed(2);
  }

  // ---- opening hours: "open now" line in the hero and today's row in the table
  var open = document.querySelector(".ol-open");
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (open) {
    var hours = JSON.parse(open.getAttribute("data-hours"));
    var toMin = function (t) {
      var p = t.split(":");
      var m = Number(p[0]) * 60 + Number(p[1]);
      return m === 0 ? 1440 : m;
    };
    var now = new Date();
    var today = (now.getDay() + 6) % 7;
    var mins = now.getHours() * 60 + now.getMinutes();
    var h = hours[today];
    if (h && mins >= toMin(h[0]) && mins < toMin(h[1])) {
      open.textContent = "Open now · until " + h[1];
      open.classList.add("is-open");
    } else if (h && mins < toMin(h[0])) {
      open.textContent = "Opens today at " + h[0];
    } else {
      for (var k = 1; k <= 7; k++) {
        var d = (today + k) % 7;
        if (hours[d]) {
          open.textContent = "Closed now · opens " + (k === 1 ? "tomorrow" : DAYS[d]) + " at " + hours[d][0];
          break;
        }
      }
    }
    var row = document.querySelectorAll(".ol-hours tbody tr")[today];
    if (row) {
      row.classList.add("is-today");
      row.querySelector("th").insertAdjacentText("beforeend", " (today)");
    }
  }

  // ---- the menu and the order
  var form = document.getElementById("ol-form");
  if (!form) {
    return;
  }
  var items = [];
  var byId = {};
  form.querySelectorAll(".ol-item").forEach(function (li) {
    var it = {
      id: li.getAttribute("data-id"),
      name: li.getAttribute("data-name"),
      price: Number(li.getAttribute("data-price")),
      tags: li.getAttribute("data-tags").split(" "),
      text: li.textContent.toLowerCase(),
      li: li,
      input: li.querySelector("input")
    };
    items.push(it);
    byId[it.id] = it;
  });

  var lines = form.querySelector(".ol-lines");
  var empty = form.querySelector(".ol-empty");
  var sum = form.querySelector(".ol-sum");
  var badge = document.querySelector(".ol-count");
  var bar = document.querySelector(".ol-bar");
  var barCount = bar.querySelector(".ol-bar-count");
  var barSum = bar.querySelector(".ol-bar-sum");
  var status = form.querySelector(".ol-status");
  var live = document.createElement("p");
  live.className = "ol-sr";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  var liveTimer = null;

  function qty(it) {
    var n = Math.floor(Number(it.input.value));
    return isFinite(n) ? Math.min(Math.max(n, 0), MAX) : 0;
  }

  function save() {
    var data = {};
    items.forEach(function (it) {
      if (qty(it)) {
        data[it.id] = qty(it);
      }
    });
    try {
      localStorage.setItem(STORE, JSON.stringify(data));
    } catch (e) {
      // storage blocked: the order just isn't remembered
    }
  }

  function render(announce) {
    var count = 0;
    var total = 0;
    lines.textContent = "";
    items.forEach(function (it) {
      var n = qty(it);
      it.li.classList.toggle("has-qty", n > 0);
      if (!n) {
        return;
      }
      count += n;
      total += n * it.price;
      var li = document.createElement("li");
      var q = document.createElement("b");
      q.textContent = n + "×";
      var name = document.createElement("span");
      name.textContent = it.name;
      var price = document.createElement("span");
      price.textContent = euro(n * it.price);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.setAttribute("aria-label", "Remove " + it.name);
      rm.addEventListener("click", function () {
        it.input.value = 0;
        render(true);
        save();
        (lines.querySelector("button") || it.input).focus();
      });
      li.appendChild(q);
      li.appendChild(name);
      li.appendChild(price);
      li.appendChild(rm);
      lines.appendChild(li);
    });
    empty.hidden = count > 0;
    sum.textContent = euro(total);
    badge.textContent = count;
    barCount.textContent = count + (count === 1 ? " dish" : " dishes");
    barSum.textContent = euro(total);
    if (announce) {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        live.textContent = "Your order: " + count + (count === 1 ? " dish, " : " dishes, ") + euro(total);
      }, 700);
    }
  }

  // restore the last order
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    Object.keys(saved).forEach(function (id) {
      if (byId[id]) {
        byId[id].input.value = Math.min(Math.max(Number(saved[id]) || 0, 0), MAX);
      }
    });
  } catch (e) {
    // nothing saved
  }

  form.addEventListener("click", function (e) {
    var step = e.target.closest(".ol-step");
    if (!step) {
      return;
    }
    var it = byId[step.closest(".ol-item").getAttribute("data-id")];
    it.input.value = Math.min(Math.max(qty(it) + Number(step.getAttribute("data-step")), 0), MAX);
    render(true);
    save();
  });
  form.addEventListener("input", function (e) {
    if (e.target.closest(".ol-qty")) {
      render(true);
      save();
    }
  });
  form.addEventListener("change", function (e) {
    var box = e.target.closest(".ol-qty");
    if (box) {
      var it = byId[box.closest(".ol-item").getAttribute("data-id")];
      it.input.value = qty(it); // tidy up typed values like "2.5" or "-1"
    }
  });

  // ---- search and dietary filters
  var search = document.querySelector(".ol-search input");
  var chips = document.querySelectorAll(".ol-chip");
  var none = form.querySelector(".ol-none");

  function filter() {
    var q = search.value.trim().toLowerCase();
    var want = [];
    chips.forEach(function (c) {
      if (c.getAttribute("aria-pressed") === "true") {
        want.push(c.getAttribute("data-tag"));
      }
    });
    var shown = 0;
    items.forEach(function (it) {
      var ok = (!q || it.text.indexOf(q) !== -1) && want.every(function (t) {
        return it.tags.indexOf(t) !== -1;
      });
      it.li.hidden = !ok;
      shown += ok ? 1 : 0;
    });
    form.querySelectorAll(".ol-cat").forEach(function (cat) {
      cat.hidden = !cat.querySelector(".ol-item:not([hidden])");
    });
    none.hidden = shown > 0;
  }
  search.addEventListener("input", filter);
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
      filter();
    });
  });

  // ---- highlight the category in view
  var catLinks = document.querySelectorAll(".ol-cats a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          catLinks.forEach(function (a) {
            var on = a.getAttribute("href") === "#" + en.target.id;
            a.classList.toggle("is-current", on);
            if (on) {
              a.setAttribute("aria-current", "true");
            } else {
              a.removeAttribute("aria-current");
            }
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    form.querySelectorAll(".ol-cat").forEach(function (cat) {
      spy.observe(cat);
    });
  }

  // ---- table or takeaway
  var forTable = form.querySelector(".ol-for-table");
  var forTake = form.querySelector(".ol-for-takeaway");
  var tableInput = document.getElementById("ol-table");
  form.querySelectorAll('input[name="how"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var take = form.elements.how.value === "takeaway";
      forTable.hidden = take;
      forTake.hidden = !take;
    });
  });

  // ---- order panel as a bottom sheet on small screens
  var panel = document.getElementById("order");
  var closeBtn = panel.querySelector(".ol-close");
  var small = window.matchMedia("(max-width: 980px)");

  function setPanel(openIt) {
    panel.classList.toggle("is-open", openIt);
    bar.setAttribute("aria-expanded", openIt ? "true" : "false");
    if (openIt) {
      closeBtn.focus();
    }
  }
  bar.addEventListener("click", function () {
    setPanel(!panel.classList.contains("is-open"));
  });
  closeBtn.addEventListener("click", function () {
    setPanel(false);
    bar.focus();
  });
  document.querySelector(".ol-btn-order").addEventListener("click", function (e) {
    if (small.matches) {
      e.preventDefault();
      setPanel(true);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      setPanel(false);
      bar.focus();
    }
  });

  // ---- send (demo: nothing leaves the browser)
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var count = items.reduce(function (s, it) {
      return s + qty(it);
    }, 0);
    if (!count) {
      status.textContent = "Add at least one dish: enter a quantity next to it in the menu.";
      return;
    }
    var take = form.elements.how.value === "takeaway";
    var table = Number(tableInput.value);
    if (!take && !(table >= 1 && table <= 30)) {
      tableInput.setAttribute("aria-invalid", "true");
      status.textContent = "Please enter your table number (1–30); it is on the card on your table.";
      tableInput.focus();
      return;
    }
    tableInput.setAttribute("aria-invalid", "false");
    var total = sum.textContent;
    var no = "OL-" + String(Date.now()).slice(-4);
    status.textContent = "Thank you! Order " + no + ", " + count + (count === 1 ? " dish, " : " dishes, ") + total +
      (take ? ", ready for pick-up at " + form.elements.time.value : ", for table " + table) +
      ". This is a demo website, so nothing was sent to the kitchen.";
    items.forEach(function (it) {
      it.input.value = 0;
    });
    form.elements.note.value = "";
    render(false);
    save();
  });

  render(false);
  document.getElementById("year").textContent = new Date().getFullYear();
})();
