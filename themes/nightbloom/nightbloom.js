// Nightbloom Festival – music festival website demo by Drago Katić Development
(function () {
  "use strict";

  var header = document.querySelector(".nb-header");
  var menu = document.querySelector(".nb-menu");
  var hero = document.querySelector(".nb-hero");

  // header background once the page is scrolled (always solid on pages without a hero)
  function onScroll() {
    header.classList.toggle("is-solid", !hero || window.scrollY > 30);
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

  document.querySelectorAll(".nb-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      menu.focus();
    }
  });

  // countdown to the first festival day
  var countdown = document.querySelector(".nb-countdown");
  if (countdown) {
    var start = new Date("2027-07-16T16:00:00").getTime();
    var units = {};
    countdown.querySelectorAll("[data-unit]").forEach(function (el) {
      units[el.getAttribute("data-unit")] = el;
    });
    var tick = function () {
      var left = Math.max(0, start - Date.now());
      var s = Math.floor(left / 1000);
      units.days.textContent = Math.floor(s / 86400);
      units.hours.textContent = Math.floor(s % 86400 / 3600);
      units.minutes.textContent = Math.floor(s % 3600 / 60);
      units.seconds.textContent = s % 60;
    };
    countdown.hidden = false;
    tick();
    setInterval(tick, 1000);
  }

  // line-up day tabs (without JS all days are listed one below the other)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.nb-tablist [role="tab"]'));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", selected ? "true" : "false");
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    if (focus) {
      tab.focus();
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      selectTab(tab, false);
    });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") {
        next = tabs[(i + 1) % tabs.length];
      } else if (e.key === "ArrowLeft") {
        next = tabs[(i - 1 + tabs.length) % tabs.length];
      } else if (e.key === "Home") {
        next = tabs[0];
      } else if (e.key === "End") {
        next = tabs[tabs.length - 1];
      }
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });
  if (tabs.length) {
    selectTab(tabs[0], false);
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  // newsletter: demo only
  var news = document.querySelector(".nb-news-form");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = news.elements.email;
      var out = news.querySelector(".nb-news-status");
      if (!validEmail(input.value.trim())) {
        input.setAttribute("aria-invalid", "true");
        out.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      out.textContent = "You're on the list! (Demo: nothing was saved.)";
      news.reset();
    });
  }

  // ticket shop: quantities, order summary and demo checkout
  var shop = document.querySelector(".nb-shop-grid");
  if (shop) {
    var tickets = shop.querySelectorAll(".nb-ticket");
    var lines = shop.querySelector(".nb-order-lines");
    var feeOut = document.getElementById("nb-fee");
    var totalOut = document.getElementById("nb-total");
    var status = shop.querySelector(".nb-order-status");
    var MAX = 8;
    var money = function (v) {
      return "€" + v.toFixed(2);
    };

    var count = function () {
      var n = 0;
      tickets.forEach(function (t) {
        n += Number(t.querySelector("input").value) || 0;
      });
      return n;
    };

    var update = function () {
      var subtotal = 0;
      var items = [];
      tickets.forEach(function (t) {
        var input = t.querySelector("input");
        var qty = Math.max(0, Math.min(MAX, Math.floor(Number(input.value) || 0)));
        input.value = qty;
        t.classList.toggle("is-picked", qty > 0);
        if (qty) {
          var price = Number(t.getAttribute("data-price"));
          subtotal += qty * price;
          items.push("<li><span>" + qty + " × " + t.querySelector("h2").textContent + "</span><span>" + money(qty * price) + "</span></li>");
        }
      });
      var fee = subtotal ? 2.5 + subtotal * 0.02 : 0;
      lines.innerHTML = items.length ? items.join("") : '<li class="nb-order-empty">No tickets selected yet.</li>';
      feeOut.textContent = money(fee);
      totalOut.textContent = money(subtotal + fee);
    };

    shop.addEventListener("click", function (e) {
      var button = e.target.closest("[data-step]");
      if (!button) {
        return;
      }
      var input = button.parentNode.querySelector("input");
      var step = Number(button.getAttribute("data-step"));
      if (step > 0 && count() >= MAX) {
        status.textContent = "You can buy up to " + MAX + " tickets per order.";
        return;
      }
      status.textContent = "";
      input.value = Math.max(0, (Number(input.value) || 0) + step);
      update();
    });

    shop.addEventListener("input", function (e) {
      if (e.target.type === "number") {
        update();
      }
    });

    shop.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = shop.elements.name;
      var email = shop.elements.email;
      if (!count()) {
        status.textContent = "Please choose at least one ticket.";
        tickets[0].querySelector("[data-step='1']").focus();
        return;
      }
      var first = null;
      [[name, !name.value.trim()], [email, !validEmail(email.value.trim())]].forEach(function (pair) {
        pair[0].setAttribute("aria-invalid", pair[1] ? "true" : "false");
        if (pair[1] && !first) {
          first = pair[0];
        }
      });
      if (first) {
        status.textContent = "Please enter the name on the tickets and a valid email address.";
        first.focus();
        return;
      }
      status.textContent = "Thank you! In a real shop you would now pay " + totalOut.textContent + ". This is a demo, so nothing was charged.";
    });

    update();
  }

  // fade content in as it scrolls into view
  var items = document.querySelectorAll(".nb-reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -50px 0px" });
    items.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    items.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
