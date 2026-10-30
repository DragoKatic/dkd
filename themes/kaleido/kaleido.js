// Kaleido Tribe – festival clothing shop website demo by Drago Katić Development
// The cart lives in localStorage ("kaleido-cart"), so it stays filled from page to page.
// Nothing can be bought: checkout only shows a demo message.
(function () {
  "use strict";

  var FREE_SHIPPING = 75;
  var KEY = "kaleido-cart";

  function money(v) {
    return "€" + v.toFixed(2);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  // ---------------------------------------------------------------- menu
  var header = document.querySelector(".kt-header");
  var menu = document.querySelector(".kt-menu");

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

  // ---------------------------------------------------------------- cart
  var cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    cart = [];
  }

  var drawer = document.querySelector(".kt-drawer");
  var lines = drawer.querySelector(".kt-lines");
  var empty = drawer.querySelector(".kt-empty");
  var foot = drawer.querySelector(".kt-drawer-foot");
  var countBadge = document.querySelector(".kt-count");
  var cartButton = document.querySelector(".kt-cart-btn");
  var note = drawer.querySelector(".kt-checkout-note");

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (e) {
      // storage blocked: the cart still works on this page
    }
  }

  function render() {
    var count = 0;
    var subtotal = 0;
    lines.innerHTML = cart.map(function (item, i) {
      count += item.qty;
      subtotal += item.qty * item.price;
      return '<li><img src="' + esc(item.img) + '" alt="" width="64" height="64">' +
        "<div><h3>" + esc(item.name) + "</h3>" +
        '<span class="kt-line-qty"><button type="button" data-line="' + i + '" data-step="-1" aria-label="One less ' + esc(item.name) + '">−</button>' +
        "<span>" + item.qty + "</span>" +
        '<button type="button" data-line="' + i + '" data-step="1" aria-label="One more ' + esc(item.name) + '">+</button></span> ' +
        '<button type="button" class="kt-remove" data-remove="' + i + '">Remove</button></div>' +
        '<span class="kt-line-price">' + money(item.qty * item.price) + "</span></li>";
    }).join("");
    empty.hidden = cart.length > 0;
    lines.hidden = cart.length === 0;
    foot.hidden = cart.length === 0;
    countBadge.textContent = count;
    cartButton.setAttribute("aria-label", "Cart, " + count + (count === 1 ? " item" : " items"));
    drawer.querySelector(".kt-subtotal strong").textContent = money(subtotal);
    var left = Math.max(0, FREE_SHIPPING - subtotal);
    drawer.querySelector(".kt-ship-text").textContent = left ? "Add " + money(left) + " more for free delivery." : "Your order ships free.";
    drawer.querySelector(".kt-ship-bar span").style.width = Math.min(100, subtotal / FREE_SHIPPING * 100) + "%";
  }

  function add(item, qty) {
    var existing = cart.filter(function (c) { return c.id === item.id; })[0];
    if (existing) {
      existing.qty = Math.min(20, existing.qty + qty);
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: qty });
    }
    save();
    render();
    countBadge.classList.remove("is-bump");
    void countBadge.offsetWidth;
    countBadge.classList.add("is-bump");
  }

  function openCart() {
    note.textContent = "";
    if (typeof drawer.showModal === "function") {
      drawer.showModal();
    } else {
      drawer.setAttribute("open", "");
    }
  }

  cartButton.addEventListener("click", openCart);
  drawer.querySelector(".kt-drawer-close").addEventListener("click", function () {
    drawer.close();
  });
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer) {
      drawer.close();
      return;
    }
    var step = e.target.closest("[data-step]");
    var remove = e.target.closest("[data-remove]");
    if (step && step.hasAttribute("data-line")) {
      var item = cart[Number(step.getAttribute("data-line"))];
      item.qty += Number(step.getAttribute("data-step"));
      if (item.qty < 1) {
        cart.splice(cart.indexOf(item), 1);
      }
    } else if (remove) {
      cart.splice(Number(remove.getAttribute("data-remove")), 1);
    } else {
      return;
    }
    save();
    render();
  });
  drawer.addEventListener("close", function () {
    cartButton.focus();
  });
  drawer.querySelector(".kt-checkout").addEventListener("click", function () {
    note.textContent = "This is a demo shop, so there is no checkout. In a WooCommerce shop you would now pay " +
      drawer.querySelector(".kt-subtotal strong").textContent + " plus delivery.";
  });

  document.querySelectorAll(".kt-add").forEach(function (button) {
    button.addEventListener("click", function () {
      add({
        id: button.getAttribute("data-id"),
        name: button.getAttribute("data-name"),
        price: Number(button.getAttribute("data-price")),
        img: button.getAttribute("data-img")
      }, 1);
      button.classList.add("is-added");
      button.textContent = "Added ✓";
      setTimeout(function () {
        button.classList.remove("is-added");
        button.textContent = "Add to cart";
      }, 1600);
    });
  });

  render();

  // ---------------------------------------------------------------- shop filters
  var filters = document.querySelector(".kt-filters");
  if (filters) {
    var grid = document.querySelector(".kt-grid-shop");
    var cards = Array.prototype.slice.call(grid.children);
    var max = document.getElementById("kt-max");
    var sort = document.getElementById("kt-sort");
    var countText = document.getElementById("kt-count-text");
    var none = document.querySelector(".kt-none");

    var apply = function () {
      var cat = filters.querySelector('input[name="cat"]:checked').value;
      var limit = Number(max.value);
      document.getElementById("kt-max-out").textContent = "€" + limit;
      var shown = 0;
      cards.forEach(function (card) {
        var match = (cat === "all" || card.getAttribute("data-cat") === cat) && Number(card.getAttribute("data-price")) <= limit;
        card.hidden = !match;
        if (match) {
          shown++;
        }
      });
      var sorted = cards.slice();
      var by = sort.value;
      if (by === "price-asc" || by === "price-desc") {
        sorted.sort(function (a, b) {
          var d = Number(a.getAttribute("data-price")) - Number(b.getAttribute("data-price"));
          return by === "price-asc" ? d : -d;
        });
      } else if (by === "name") {
        sorted.sort(function (a, b) {
          return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
        });
      }
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
      countText.textContent = shown + (shown === 1 ? " product" : " products");
      none.hidden = shown !== 0;
    };

    var wanted = new URLSearchParams(window.location.search).get("cat");
    var radio = wanted && filters.querySelector('input[name="cat"][value="' + wanted.replace(/[^a-z]/g, "") + '"]');
    if (radio) {
      radio.checked = true;
    }
    filters.addEventListener("input", apply);
    filters.addEventListener("change", apply);
    filters.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    document.querySelector(".kt-reset").addEventListener("click", function () {
      filters.reset();
      apply();
    });
    apply();
  }

  // ---------------------------------------------------------------- product page
  // Gallery: the whole product and a close-up. Colour (hoodie) and size (clothing) exist only on some pages.
  var buy = document.querySelector(".kt-buy");
  if (buy) {
    var mainImg = document.querySelector(".kt-main-img");
    var thumbs = document.querySelectorAll(".kt-thumbs button");
    var colourName = buy.querySelector(".kt-colour-name");
    var sizeName = buy.querySelector(".kt-size-name");
    var qty = document.getElementById("kt-qty");
    var addMain = buy.querySelector(".kt-add-main");
    var view = "main";

    var checked = function (group) {
      return buy.querySelector('input[name="' + group + '"]:checked');
    };

    var showView = function (which) {
      view = which;
      thumbs.forEach(function (t) {
        var on = t.getAttribute("data-view") === which;
        t.setAttribute("aria-current", on ? "true" : "false");
        if (on) {
          mainImg.src = t.querySelector("img").getAttribute("src");
        }
      });
      mainImg.alt = mainImg.getAttribute("data-alt-" + which);
    };

    var chooseColour = function () {
      var radio = checked("colour");
      var name = radio.parentNode.querySelector("span").textContent;
      var product = addMain.getAttribute("data-name");
      thumbs.forEach(function (t) {
        t.querySelector("img").src = radio.getAttribute("data-" + t.getAttribute("data-view"));
      });
      mainImg.setAttribute("data-alt-main", product + " in " + name.toLowerCase());
      mainImg.setAttribute("data-alt-detail", "Close-up of the " + product + " in " + name.toLowerCase());
      colourName.textContent = name;
      showView(view);
    };

    thumbs.forEach(function (t) {
      t.addEventListener("click", function () {
        showView(t.getAttribute("data-view"));
      });
    });
    buy.addEventListener("change", function (e) {
      if (e.target.name === "colour") {
        chooseColour();
      } else if (e.target.name === "size") {
        sizeName.textContent = e.target.value;
      }
    });
    buy.addEventListener("click", function (e) {
      var step = e.target.closest(".kt-qty [data-step]");
      if (step) {
        qty.value = Math.max(1, Math.min(10, (Number(qty.value) || 1) + Number(step.getAttribute("data-step"))));
      }
    });
    buy.addEventListener("submit", function (e) {
      e.preventDefault();
      var colour = checked("colour");
      var size = checked("size");
      var id = addMain.getAttribute("data-id");
      var options = [];
      if (colour) {
        id += "-" + colour.value;
        options.push(colour.parentNode.querySelector("span").textContent);
      }
      if (size) {
        id += "-" + size.value.toLowerCase().replace("/", "-");
        options.push(size.value);
      }
      var n = Math.max(1, Math.min(10, Math.floor(Number(qty.value) || 1)));
      qty.value = n;
      add({
        id: id,
        name: addMain.getAttribute("data-name") + (options.length ? " – " + options.join(", ") : ""),
        price: Number(addMain.getAttribute("data-price")),
        img: thumbs.length ? thumbs[0].querySelector("img").getAttribute("src") : mainImg.getAttribute("src")
      }, n);
      openCart();
    });
    if (checked("colour")) {
      chooseColour();
    }
  }

  // ---------------------------------------------------------------- simple demo forms
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  var news = document.querySelector(".kt-news-form");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = news.elements.email;
      var out = news.querySelector(".kt-news-status");
      if (!validEmail(input.value.trim())) {
        out.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }
      out.textContent = "Welcome to the tribe! Your 10% code would arrive by email. (Demo: nothing was saved.)";
      news.reset();
    });
  }

  var contact = document.querySelector(".kt-form");
  if (contact) {
    contact.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = contact.querySelector(".kt-form-status");
      var first = null;
      [contact.elements.name, contact.elements.email].forEach(function (field) {
        var bad = !field.value.trim() || (field.type === "email" && !validEmail(field.value.trim()));
        field.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !first) {
          first = field;
        }
      });
      if (first) {
        status.textContent = "Please enter your name and a valid email address.";
        first.focus();
        return;
      }
      status.textContent = "Thank you, " + contact.elements.name.value.trim() + "! This is a demo shop, so your message was not sent.";
      contact.reset();
    });
  }

  // ---------------------------------------------------------------- reveal
  var items = document.querySelectorAll(".kt-reveal");
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
