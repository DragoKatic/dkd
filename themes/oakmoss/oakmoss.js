// Oakmoss Barbers – barber shop website demo by Drago Katić Development
(function () {
  "use strict";

  var header = document.querySelector(".om-header");
  var menu = document.querySelector(".om-menu");
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

  document.querySelectorAll(".om-nav a").forEach(function (link) {
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

  // header video: muted loop with a pause button; waits for a click with reduced motion
  var video = document.querySelector(".om-hero-video");
  var playButton = document.querySelector(".om-play");
  var playText = playButton.querySelector(".om-play-text");

  function setPlaying(playing) {
    // the label says what the button will do; no aria-pressed as well, or a screen reader
    // would announce "Play video, pressed" while the video is paused
    playButton.classList.toggle("is-paused", !playing);
    playText.textContent = playing ? "Pause video" : "Play video";
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

  // booking: the next open days and their free times (a few are taken, for realism)
  var form = document.querySelector(".om-form");
  var daySelect = document.getElementById("om-date");
  var slotList = form.querySelector(".om-slot-list");
  var status = form.querySelector(".om-status");
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var day = new Date();
  var added = 0;
  while (added < 6) {
    day.setDate(day.getDate() + 1);
    var dow = day.getDay();
    if (dow === 0 || dow === 1) {
      continue; // closed on Sunday and Monday
    }
    var option = document.createElement("option");
    option.value = day.getFullYear() + "-" + (day.getMonth() + 1) + "-" + day.getDate() + "|" + dow;
    option.textContent = DAY_NAMES[dow] + " " + day.getDate() + " " + MONTHS[day.getMonth()];
    daySelect.appendChild(option);
    added++;
  }

  function showSlots() {
    slotList.innerHTML = "";
    if (!daySelect.selectedIndex) {
      slotList.innerHTML = '<p class="om-slot-hint">Pick a day first.</p>';
      return;
    }
    var parts = daySelect.value.split("|");
    var saturday = parts[1] === "6";
    var seed = Number(parts[0].replace(/-/g, "")) % 97;
    for (var h = saturday ? 8 : 9; h < (saturday ? 16 : 20); h++) {
      ["00", "30"].forEach(function (m, k) {
        var time = (h < 10 ? "0" : "") + h + ":" + m;
        var taken = (seed + h * 3 + k * 5) % 7 < 2;
        var label = document.createElement("label");
        label.innerHTML = '<input type="radio" name="time" value="' + time + '"' + (taken ? " disabled" : "") + '><span>' + time + "</span>";
        if (taken) {
          label.title = "Already booked";
        }
        slotList.appendChild(label);
      });
    }
  }

  daySelect.addEventListener("change", showSlots);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name;
    var phone = form.elements.phone;
    var time = form.querySelector('input[name="time"]:checked');
    if (!daySelect.selectedIndex || !time) {
      status.textContent = "Please choose a day and a free time.";
      (daySelect.selectedIndex ? slotList.querySelector("input:not(:disabled)") : daySelect).focus();
      return;
    }
    var first = null;
    [[name, !name.value.trim()], [phone, phone.value.replace(/\D/g, "").length < 6]].forEach(function (pair) {
      pair[0].setAttribute("aria-invalid", pair[1] ? "true" : "false");
      if (pair[1] && !first) {
        first = pair[0];
      }
    });
    if (first) {
      status.textContent = "Please add your name and a mobile number.";
      first.focus();
      return;
    }
    status.textContent = "See you on " + daySelect.options[daySelect.selectedIndex].textContent + " at " + time.value +
      ", " + name.value.trim() + "! This is a demo website, so no chair was booked.";
    form.reset();
    showSlots();
  });

  // fade content in as it scrolls into view
  var items = document.querySelectorAll(".om-reveal");
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
