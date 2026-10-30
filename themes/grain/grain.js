// Grain & Light – photography website demo by Drago Katić Development
(function () {
  "use strict";

  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  // solid header once the hero photo is scrolled away
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll); // after the first layout, so reading scrollY does not force one

  // hero: cross-fading background photos
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll(".hero-dots button");
  var caption = document.querySelector(".hero-caption");
  var currentSlide = 0;
  var timer = null;

  function showSlide(i) {
    currentSlide = (i + slides.length) % slides.length;
    slides.forEach(function (slide, n) {
      slide.classList.toggle("is-active", n === currentSlide);
    });
    dots.forEach(function (dot, n) {
      dot.setAttribute("aria-pressed", n === currentSlide ? "true" : "false");
    });
    caption.textContent = slides[currentSlide].getAttribute("data-caption");
  }

  function play() {
    if (calm) {
      return;
    }
    clearInterval(timer);
    timer = setInterval(function () {
      showSlide(currentSlide + 1);
    }, 6500);
  }

  dots.forEach(function (dot, n) {
    dot.addEventListener("click", function () {
      showSlide(n);
      play();
    });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearInterval(timer);
    } else {
      play();
    }
  });
  play();

  // gallery filters
  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  var filters = document.querySelectorAll(".filter");
  filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      var cat = filter.getAttribute("data-filter");
      filters.forEach(function (f) {
        f.setAttribute("aria-pressed", f === filter ? "true" : "false");
      });
      shots.forEach(function (shot) {
        shot.hidden = cat !== "all" && shot.getAttribute("data-cat") !== cat;
      });
    });
  });

  // lightbox for the visible gallery photos
  var box = document.getElementById("lightbox");
  var boxImg = box.querySelector(".lb-img");
  var boxCaption = box.querySelector(".lb-caption");
  var visible = [];
  var boxIndex = 0;
  var opener = null;

  function showPhoto(i) {
    boxIndex = (i + visible.length) % visible.length;
    var shot = visible[boxIndex];
    var thumb = shot.querySelector("img");
    boxImg.src = shot.getAttribute("href");
    boxImg.alt = thumb.alt;
    boxCaption.textContent = shot.querySelector("span").textContent + " · " + (boxIndex + 1) + " / " + visible.length;
  }

  function openBox(shot) {
    visible = shots.filter(function (s) {
      return !s.hidden;
    });
    opener = shot;
    showPhoto(visible.indexOf(shot));
    box.hidden = false;
    document.body.classList.add("no-scroll");
    box.querySelector(".lb-close").focus();
  }

  function closeBox() {
    box.hidden = true;
    document.body.classList.remove("no-scroll");
    if (opener) {
      opener.focus();
    }
  }

  shots.forEach(function (shot) {
    shot.addEventListener("click", function (e) {
      e.preventDefault();
      openBox(shot);
    });
  });

  box.querySelector(".lb-close").addEventListener("click", closeBox);
  box.querySelector(".lb-prev").addEventListener("click", function () {
    showPhoto(boxIndex - 1);
  });
  box.querySelector(".lb-next").addEventListener("click", function () {
    showPhoto(boxIndex + 1);
  });
  box.addEventListener("click", function (e) {
    if (e.target === box) {
      closeBox();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) {
        setMenu(false);
        toggle.focus();
      }
      return;
    }
    if (e.key === "Escape") {
      closeBox();
    } else if (e.key === "ArrowRight") {
      showPhoto(boxIndex + 1);
    } else if (e.key === "ArrowLeft") {
      showPhoto(boxIndex - 1);
    } else if (e.key === "Tab") {
      // keep focus inside the viewer
      var buttons = box.querySelectorAll("button");
      var first = buttons[0];
      var last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  var touchX = null;
  box.addEventListener("touchstart", function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (touchX === null) {
      return;
    }
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) {
      showPhoto(boxIndex + (dx < 0 ? 1 : -1));
    }
    touchX = null;
  }, { passive: true });

  // contact form: checked in the browser only (demo, nothing is sent)
  var form = document.getElementById("contact-form");
  var status = form.querySelector(".form-status");
  var rules = [
    { id: "f-name", test: function (v) { return v.length >= 2; }, msg: "Please tell us your name." },
    { id: "f-email", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, msg: "Please enter a valid email address." },
    { id: "f-message", test: function (v) { return v.length >= 10; }, msg: "A few words about the shoot, please (at least 10 characters)." }
  ];

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    rules.forEach(function (rule) {
      var field = document.getElementById(rule.id);
      var ok = rule.test(field.value.trim());
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      document.getElementById(field.getAttribute("aria-describedby")).textContent = ok ? "" : rule.msg;
      if (!ok && !firstBad) {
        firstBad = field;
      }
    });
    if (firstBad) {
      status.textContent = "";
      firstBad.focus();
      return;
    }
    form.reset();
    status.textContent = "Thank you — in a real studio site, we would now be on our way to your inbox.";
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
