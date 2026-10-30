// Fieldnote Forms – accessible web form designs for WordPress, a demo by Drago Katić Development
// Validation, show password, strength meter, card formatting and multi-step forms. Nothing is sent anywhere.
(function () {
  "use strict";

  // mobile menu
  var header = document.querySelector(".fn-header");
  var menu = document.querySelector(".fn-menu");

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
  }

  menu.addEventListener("click", function () {
    setMenu(menu.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      menu.focus();
    }
  });

  // show / hide password
  document.querySelectorAll(".fn-show-pass").forEach(function (button) {
    var input = document.getElementById(button.getAttribute("aria-controls"));
    button.setAttribute("aria-label", "Show password");
    button.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-pressed", show ? "true" : "false");
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  // password strength
  function strength(value) {
    var score = 0;
    if (value.length >= 8) { score++; }
    if (value.length >= 12) { score++; }
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) { score++; }
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) { score++; }
    return value ? Math.max(1, score) : 0;
  }

  var STRENGTH_TEXT = ["", "Weak: make it longer and add numbers or symbols.", "Fair: add capital letters, numbers or a symbol.",
    "Good: a few more characters make it strong.", "Strong password."];

  document.querySelectorAll("[data-strength]").forEach(function (input) {
    var form = input.form;
    var meter = form.querySelector(".fn-meter");
    var text = form.querySelector(".fn-meter-text");
    input.addEventListener("input", function () {
      var score = strength(input.value);
      meter.setAttribute("data-score", score);
      meter.firstElementChild.style.width = (score * 25) + "%";
      text.textContent = STRENGTH_TEXT[score];
    });
  });

  // card number: groups of four and the card brand
  function cardBrand(digits) {
    if (/^4/.test(digits)) { return "Visa"; }
    if (/^(5[1-5]|2[2-7])/.test(digits)) { return "Mastercard"; }
    if (/^3[47]/.test(digits)) { return "American Express"; }
    return "";
  }

  function luhn(digits) {
    var sum = 0;
    for (var i = 0; i < digits.length; i++) {
      var d = Number(digits.charAt(digits.length - 1 - i));
      if (i % 2) {
        d *= 2;
        if (d > 9) { d -= 9; }
      }
      sum += d;
    }
    return digits.length >= 13 && sum % 10 === 0;
  }

  document.querySelectorAll("[data-card]").forEach(function (input) {
    var out = input.form.querySelector(".fn-card-brand");
    input.addEventListener("input", function () {
      var digits = input.value.replace(/\D/g, "").slice(0, 19);
      input.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
      var brand = cardBrand(digits);
      out.textContent = brand ? "Card: " + brand : "";
    });
  });

  document.querySelectorAll("[data-expiry]").forEach(function (input) {
    input.addEventListener("input", function () {
      var digits = input.value.replace(/\D/g, "").slice(0, 4);
      input.value = digits.length > 2 ? digits.slice(0, 2) + " / " + digits.slice(2) : digits;
    });
  });

  // validation rules: returns an error message or ""
  function problem(field) {
    var value = field.type === "checkbox" ? field.checked : field.value.trim();
    var label = field.labels && field.labels[0] ? field.labels[0].textContent.replace(/\s*\(.*\)/, "").trim() : "This field";
    if (field.closest("[hidden]")) {
      return "";
    }
    if (field.required && !value) {
      if (field.hasAttribute("data-missing")) {
        return field.getAttribute("data-missing");
      }
      return field.type === "checkbox" ? "Please tick this box to continue." : "Please enter your " + label.toLowerCase() + ".";
    }
    if (!value) {
      return "";
    }
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return "Please enter an email address like name@example.com.";
    }
    var min = field.getAttribute("data-minlength");
    if (min && value.length < Number(min)) {
      return "Please use at least " + min + " characters.";
    }
    var match = field.getAttribute("data-match");
    if (match && value !== document.getElementById(match).value.trim()) {
      return "The passwords do not match.";
    }
    if (field.hasAttribute("data-card") && !luhn(value.replace(/\D/g, ""))) {
      return "This card number does not look right. Check the digits.";
    }
    if (field.hasAttribute("data-expiry")) {
      var m = value.match(/^(\d{2}) \/ (\d{2})$/);
      var now = new Date();
      if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
        return "Enter the expiry date as MM / YY.";
      }
      var year = 2000 + Number(m[2]);
      if (year < now.getFullYear() || (year === now.getFullYear() && Number(m[1]) < now.getMonth() + 1)) {
        return "This card has expired.";
      }
    }
    if (field.hasAttribute("data-cvc") && !/^\d{3,4}$/.test(value)) {
      return "The security code has 3 or 4 digits.";
    }
    return "";
  }

  function show(field, message) {
    var error = document.getElementById(field.id + "-error");
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
  }

  function fieldsOf(scope) {
    return Array.prototype.slice.call(scope.querySelectorAll("input[id], select[id], textarea[id]"));
  }

  // check a group of fields; returns the list of problems
  function validate(scope) {
    var problems = [];
    fieldsOf(scope).forEach(function (field) {
      var message = problem(field);
      show(field, message);
      if (message) {
        problems.push({ field: field, message: message });
      }
    });
    return problems;
  }

  function summarize(form, problems) {
    var box = form.querySelector(".fn-summary");
    if (!problems.length) {
      box.hidden = true;
      box.textContent = "";
      return;
    }
    var items = problems.map(function (p) {
      return '<li><a href="#' + p.field.id + '">' + p.message + "</a></li>";
    }).join("");
    box.innerHTML = "<p>" + (problems.length === 1 ? "There is 1 thing to fix:" : "There are " + problems.length + " things to fix:") + "</p><ul>" + items + "</ul>";
    box.hidden = false;
    box.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById(link.getAttribute("href").slice(1)).focus();
      });
    });
  }

  // multi-step forms
  function setupSteps(form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll(".fn-step"));
    var marks = form.querySelectorAll(".fn-steps li");
    var label = form.querySelector(".fn-step-label");
    var current = 0;

    function go(index, focus) {
      current = index;
      steps.forEach(function (step, i) {
        step.hidden = i !== index;
      });
      marks.forEach(function (mark, i) {
        mark.classList.toggle("is-current", i === index);
        mark.classList.toggle("is-done", i < index);
      });
      form.classList.toggle("is-last", index === steps.length - 1);
      label.textContent = "Step " + (index + 1) + " of " + steps.length + ": " + steps[index].querySelector("legend").textContent.replace(/^\d+\.\s*/, "");
      if (focus) {
        var first = steps[index].querySelector("input, select, textarea");
        if (first) {
          first.focus();
        }
      }
    }

    form.addEventListener("click", function (e) {
      var button = e.target.closest("[data-step]");
      if (!button) {
        return;
      }
      if (button.getAttribute("data-step") === "next") {
        var problems = validate(steps[current]);
        summarize(form, problems);
        if (problems.length) {
          problems[0].field.focus();
          return;
        }
        go(current + 1, true);
      } else {
        summarize(form, []);
        go(current - 1, true);
      }
    });

    go(0, false);
    form.fnReset = function () {
      go(0, false);
    };
  }

  document.querySelectorAll(".fn-form").forEach(function (form) {
    if (form.classList.contains("fn-multistep")) {
      setupSteps(form);
    }

    // passwordless: the password field only when "Use my password" is chosen
    if (form.hasAttribute("data-magic")) {
      var wrap = form.querySelector(".fn-when-password");
      var submit = form.querySelector(".fn-btn-primary");
      form.querySelectorAll('input[name="method"]').forEach(function (radio) {
        radio.addEventListener("change", function () {
          var usePassword = radio.value === "password" && radio.checked;
          wrap.hidden = !usePassword;
          submit.textContent = usePassword ? "Sign in" : "Email me a link";
        });
      });
      submit.textContent = "Email me a link";
      form.fnReset = function () {
        wrap.hidden = true;
        submit.textContent = "Email me a link";
      };
    }

    // re-check a field when it is left, and live once it has shown an error
    fieldsOf(form).forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.value.trim() || field.getAttribute("aria-invalid") === "true") {
          show(field, problem(field));
        }
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") {
          show(field, problem(field));
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".fn-status");
      var problems = validate(form);
      summarize(form, problems);
      status.textContent = "";
      if (problems.length) {
        var box = form.querySelector(".fn-summary");
        if (problems.length > 1) {
          box.focus();
        } else {
          problems[0].field.focus();
        }
        return;
      }
      status.textContent = form.getAttribute("data-success");
      form.reset();
      fieldsOf(form).forEach(function (field) {
        field.removeAttribute("aria-invalid");
      });
      form.querySelectorAll(".fn-meter-text, .fn-card-brand").forEach(function (el) {
        el.textContent = "";
      });
      var meter = form.querySelector(".fn-meter");
      if (meter) {
        meter.removeAttribute("data-score");
        meter.firstElementChild.style.width = "0";
      }
      if (form.fnReset) {
        form.fnReset();
      }
    });
  });

  // fade cards in as they scroll into view
  var items = document.querySelectorAll(".fn-fade");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -40px 0px" });
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
