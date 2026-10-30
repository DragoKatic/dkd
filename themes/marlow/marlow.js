// Iva Marlow – illustrator portfolio website demo by Drago Katić Development
(function () {
  "use strict";

  // gallery lightbox: a native <dialog>; without JS the links open the artwork itself
  var dialog = document.querySelector(".im-lightbox");
  var links = Array.prototype.slice.call(document.querySelectorAll(".im-gallery a"));
  var current = 0;
  var opener = null;

  if (dialog && typeof dialog.showModal === "function") {
    var img = dialog.querySelector("img");
    var title = dialog.querySelector("h3");
    var text = dialog.querySelector("figcaption p");

    var showWork = function (index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      img.src = link.getAttribute("href");
      img.alt = link.querySelector("img").alt;
      title.textContent = link.getAttribute("data-title");
      text.textContent = link.getAttribute("data-text");
    };

    links.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        opener = link;
        showWork(i);
        dialog.showModal();
      });
    });

    dialog.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        showWork(current + Number(button.getAttribute("data-step")));
      });
    });

    dialog.querySelector(".im-lightbox-close").addEventListener("click", function () {
      dialog.close();
    });

    // click on the backdrop closes the dialog
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) {
        dialog.close();
      }
    });

    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        showWork(current + 1);
      } else if (e.key === "ArrowLeft") {
        showWork(current - 1);
      }
    });

    dialog.addEventListener("close", function () {
      if (opener) {
        opener.focus();
      }
    });
  }

  // contact form: demo only, nothing is sent
  var form = document.querySelector(".im-form");
  var status = form.querySelector(".im-status-msg");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var first = null;
    [form.elements.name, form.elements.email].forEach(function (field) {
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
    status.textContent = "Thank you, " + form.elements.name.value.trim() + "! This is a demo website, so your message was not sent.";
    form.reset();
  });

  // fade content in as it scrolls into view
  var items = document.querySelectorAll(".im-reveal");
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
