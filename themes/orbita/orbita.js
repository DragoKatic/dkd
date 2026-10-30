// Orbita – fintech landing page demo by Drago Katić Development
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

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

  // header border once the page is scrolled
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll); // after the first layout, so reading scrollY does not force one

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

  // phone tilts toward the pointer (mouse only, not with reduced motion)
  var phone = document.getElementById("phone");
  var stage = phone && phone.parentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (stage && !calm && window.matchMedia("(hover: hover)").matches) {
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      phone.style.transform = "rotateY(" + (x * 16).toFixed(2) + "deg) rotateX(" + (-y * 12).toFixed(2) + "deg)";
    });
    stage.addEventListener("mouseleave", function () {
      phone.style.transform = "";
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
