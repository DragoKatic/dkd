// Liora Vale – model book demo (Verso). Without JS every photo link opens the full image,
// the whole book is shown and the comp card is in centimetres; nothing here is required to read the page.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // footer year
  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // header: solid background once the hero has scrolled a little
  var header = document.querySelector(".vb-header");
  function onScroll() {
    header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll); // after the first layout, so reading scrollY does not force one

  // mobile menu
  var menuBtn = document.querySelector(".vb-menu-btn");
  var nav = document.getElementById("vb-nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  }
  menuBtn.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      setMenu(false);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  // book filter
  var items = Array.prototype.slice.call(document.querySelectorAll(".vb-item"));
  var filters = document.querySelectorAll(".vb-filter");
  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      Array.prototype.forEach.call(filters, function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      items.forEach(function (item) {
        item.hidden = cat !== "all" && item.getAttribute("data-cat") !== cat;
      });
    });
  });

  // lightbox over the visible photos
  var box = document.querySelector(".vb-lightbox");
  if (box && typeof box.showModal === "function") {
    var boxImg = box.querySelector("img");
    var boxCap = box.querySelector("figcaption");
    var boxCount = box.querySelector(".vb-lb-count");
    var current = [];
    var index = 0;

    var show = function (i) {
      index = (i + current.length) % current.length;
      var item = current[index];
      var img = item.querySelector("img");
      boxImg.src = item.querySelector("a").getAttribute("href");
      boxImg.alt = img.alt;
      boxCap.innerHTML = item.querySelector("figcaption").innerHTML;
      boxCount.textContent = (index + 1) + " / " + current.length;
    };

    items.forEach(function (item) {
      item.querySelector("a").addEventListener("click", function (e) {
        e.preventDefault();
        current = items.filter(function (it) { return !it.hidden; });
        show(current.indexOf(item));
        box.showModal();
      });
    });

    box.querySelector(".vb-lb-close").addEventListener("click", function () { box.close(); });
    box.querySelector(".vb-lb-prev").addEventListener("click", function () { show(index - 1); });
    box.querySelector(".vb-lb-next").addEventListener("click", function () { show(index + 1); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(index - 1); }
      if (e.key === "ArrowRight") { show(index + 1); }
    });
    // a click on the dark area (not the photo or a button) closes it
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.tagName === "FIGURE") {
        box.close();
      }
    });
    box.addEventListener("close", function () {
      boxImg.removeAttribute("src");
    });

    var touchX = null;
    box.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (touchX === null) { return; }
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) { show(dx < 0 ? index + 1 : index - 1); }
      touchX = null;
    });
  }

  // comp card units
  var units = document.querySelectorAll(".vb-unit");
  Array.prototype.forEach.call(units, function (btn) {
    btn.addEventListener("click", function () {
      var unit = btn.getAttribute("data-unit");
      Array.prototype.forEach.call(units, function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      Array.prototype.forEach.call(document.querySelectorAll(".vb-measures dd[data-" + unit + "]"), function (dd) {
        dd.textContent = dd.getAttribute("data-" + unit);
      });
    });
  });

  var printBtn = document.querySelector(".vb-print");
  if (printBtn) {
    printBtn.addEventListener("click", function () { window.print(); });
  }

  // booking form: validate, then only show a demo message
  var form = document.getElementById("vb-form");
  var msg = form.querySelector(".vb-form-msg");
  var dateInput = document.getElementById("f-date");
  dateInput.min = new Date().toISOString().slice(0, 10);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (field) {
      var ok = field.checkValidity() && field.value.trim() !== "";
      field.setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstBad) { firstBad = field; }
    });
    if (firstBad) {
      msg.textContent = "Please fill in your name, a valid email, the type of job and the shoot date.";
      firstBad.focus();
      return;
    }
    msg.textContent = "Thank you, " + form.elements.name.value.trim() + ". This is a demo, so nothing was sent – on a live site the agency would now receive your request.";
    form.reset();
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (f) { f.removeAttribute("aria-invalid"); });
  });

  // sections and photos rise in as they come into view
  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".vb-head, .vb-item, .vb-card-in > *, .vb-story-in > *, .vb-list li, .vb-booking-in > *");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("vb-reveal");
      io.observe(el);
    });
  }
})();
