// Brightcut Studio – video production website demo by Drago Katić Development
(function () {
  "use strict";

  var header = document.querySelector(".bc-header");
  var menu = document.querySelector(".bc-menu");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  // header background after scrolling, mobile menu
  function onScroll() {
    header.classList.toggle("is-solid", window.scrollY > 30);
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

  document.querySelectorAll(".bc-nav a").forEach(function (link) {
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

  // showreel: plays muted in a loop, with a pause button;
  // with reduced motion it waits for the visitor to press play
  var video = document.querySelector(".bc-hero-video");
  var playButton = document.querySelector(".bc-play");
  var playText = playButton.querySelector(".bc-play-text");

  function setPlaying(playing) {
    // the label says what the button will do; no aria-pressed as well, or a screen reader
    // would announce "Play video, pressed" while the video is paused
    playButton.classList.toggle("is-paused", !playing);
    playText.textContent = playing ? "Pause showreel" : "Play showreel";
  }

  function play() {
    var attempt = video.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () {
        setPlaying(false);
      });
    }
  }

  video.addEventListener("play", function () {
    setPlaying(true);
  });
  video.addEventListener("pause", function () {
    setPlaying(false);
  });

  playButton.hidden = false;
  playButton.addEventListener("click", function () {
    if (video.paused) {
      play();
    } else {
      video.pause();
    }
  });

  setPlaying(false);
  if (!calm.matches) {
    play();
  }

  // pause the video while the hero is off screen
  if ("IntersectionObserver" in window) {
    var wasPlaying = false;
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (wasPlaying) {
          play();
        }
      } else {
        wasPlaying = !video.paused;
        video.pause();
      }
    }).observe(video);
  }

  // work filter
  var buttons = document.querySelectorAll(".bc-filter button");
  var items = document.querySelectorAll(".bc-grid li");
  var count = document.getElementById("bc-work-count");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.getAttribute("data-filter");
      var shown = 0;
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b === button ? "true" : "false");
      });
      items.forEach(function (item) {
        var match = filter === "all" || item.getAttribute("data-kind") === filter;
        item.hidden = !match;
        if (match) {
          shown++;
        }
      });
      count.textContent = shown + (shown === 1 ? " project shown" : " projects shown");
    });
  });

  // contact form: demo only, nothing is sent
  var form = document.querySelector(".bc-form");
  var status = form.querySelector(".bc-form-status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name;
    var email = form.elements.email;
    var first = null;
    [name, email].forEach(function (field) {
      var value = field.value.trim();
      var bad = !value || (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value));
      field.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && !first) {
        first = field;
      }
    });
    if (first) {
      status.textContent = "Please add your name and a valid email address.";
      first.focus();
      return;
    }
    status.textContent = "Thanks, " + name.value.trim() + "! This is a demo website, so your brief was not sent anywhere.";
    form.reset();
  });

  // fade sections in as they scroll into view
  var reveals = document.querySelectorAll(".bc-reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    reveals.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
