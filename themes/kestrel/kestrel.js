// Kestrel Ridge Outdoors – hiking, camping and climbing website demo by Drago Katić Development
(function () {
  "use strict";

  // mobile menu
  var header = document.querySelector(".kr-header");
  var menu = document.querySelector(".kr-menu");

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
  }

  menu.addEventListener("click", function () {
    setMenu(menu.getAttribute("aria-expanded") !== "true");
  });

  document.querySelectorAll(".kr-nav a").forEach(function (link) {
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

  // trip catalogue: search, activity, difficulty and length filters (trips.html)
  var filters = document.querySelector(".kr-filters");
  if (filters) {
    var query = document.getElementById("kr-q");
    var difficulty = document.getElementById("kr-difficulty");
    var length = document.getElementById("kr-length");
    var cards = document.querySelectorAll(".kr-trip");
    var count = document.getElementById("kr-count");
    var empty = document.querySelector(".kr-empty");

    var activity = function () {
      return filters.querySelector('input[name="activity"]:checked').value;
    };

    var fits = function (card, attr, value) {
      return value === "all" || card.getAttribute(attr) === value;
    };

    var apply = function () {
      var words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (card) {
        var text = card.getAttribute("data-search");
        var match = fits(card, "data-activity", activity()) &&
          fits(card, "data-difficulty", difficulty.value) &&
          fits(card, "data-length", length.value) &&
          words.every(function (w) { return text.indexOf(w) !== -1; });
        card.hidden = !match;
        if (match) {
          shown++;
        }
      });
      count.textContent = shown === cards.length ? "Showing all " + shown + " trips" :
        "Showing " + shown + " of " + cards.length + " trips";
      empty.hidden = shown !== 0;
    };

    // preselect an activity from the link, e.g. trips.html?activity=camping
    var wanted = new URLSearchParams(window.location.search).get("activity");
    var radio = wanted && filters.querySelector('input[name="activity"][value="' + wanted.replace(/[^a-z]/g, "") + '"]');
    if (radio) {
      radio.checked = true;
    }

    filters.addEventListener("input", apply);
    filters.addEventListener("change", apply);
    filters.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    document.querySelector(".kr-reset").addEventListener("click", function () {
      filters.reset();
      apply();
      query.focus();
    });
    apply();
  }

  // booking form: demo only, nothing is sent
  var form = document.querySelector(".kr-form");
  if (form) {
    var status = form.querySelector(".kr-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var el = form.elements;
      var people = parseInt(el.people.value, 10);
      var checks = [
        [el.name, !el.name.value.trim()],
        [el.email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim())],
        [el.people, !(people >= 1 && people <= 6)]
      ];
      var first = null;
      checks.forEach(function (c) {
        c[0].setAttribute("aria-invalid", c[1] ? "true" : "false");
        if (c[1] && !first) {
          first = c[0];
        }
      });
      if (first) {
        status.textContent = "Please enter your name, a valid email address and a group of 1 to 6 people.";
        first.focus();
        return;
      }
      status.textContent = "Thank you, " + el.name.value.trim() + "! This is a demo website, so your request for " +
        el.trip.value + " (" + people + (people === 1 ? " person" : " people") + ") was not sent.";
      form.reset();
    });
  }

  // fade content in as it scrolls into view
  var items = document.querySelectorAll(".kr-reveal");
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
