// Echolane – SaaS landing page demo by Drago Katić Development
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // mobile menu
  function setMenu(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.querySelectorAll(".site-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("nav-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // feedback sorter: scattered notes <-> grouped into themes
  var board = document.getElementById("board");
  var sortBtn = document.querySelector(".sort-btn");
  var touched = false;

  function setGrouped(grouped) {
    board.classList.toggle("is-grouped", grouped);
    sortBtn.setAttribute("aria-pressed", grouped ? "true" : "false");
    sortBtn.textContent = grouped ? "Scatter them again" : "Group into themes";
  }

  sortBtn.addEventListener("click", function () {
    touched = true;
    setGrouped(!board.classList.contains("is-grouped"));
  });

  // group once by itself shortly after the board comes into view
  if ("IntersectionObserver" in window && !calm) {
    var boardObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        boardObserver.disconnect();
        setTimeout(function () {
          if (!touched) {
            setGrouped(true);
          }
        }, 1400);
      }
    }, { threshold: .5 });
    boardObserver.observe(board);
  }

  // monthly / yearly prices
  var options = document.querySelectorAll(".billing-option");
  options.forEach(function (option) {
    option.addEventListener("click", function () {
      var period = option.getAttribute("data-billing");
      options.forEach(function (o) {
        o.setAttribute("aria-pressed", o === option ? "true" : "false");
      });
      document.querySelectorAll(".amount").forEach(function (amount) {
        amount.textContent = amount.getAttribute("data-" + period);
      });
    });
  });

  // fade sections in as they scroll into view
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
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
