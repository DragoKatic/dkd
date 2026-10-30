// Meridia Travel – travel agency website demo by Drago Katić Development
// Shared by all pages; every block checks that its elements exist on the current page.
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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("nav-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // home: cross-fading hero photos with the place name
  var slides = document.querySelectorAll(".hero-slide");
  var place = document.querySelector(".hero-place");
  if (slides.length > 1 && !calm) {
    var current = 0;
    setInterval(function () {
      if (document.hidden) {
        return;
      }
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
      place.textContent = slides[current].getAttribute("data-place");
    }, 7000);
  }

  // ---------- WooCommerce-style booking: basket kept in localStorage ----------
  var KEY = "meridia-basket";
  var COUPONS = { MERIDIA10: 10 };

  function money(n) {
    return "€" + Math.round(n).toLocaleString("en-US");
  }

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY));
      if (data && Array.isArray(data.items)) {
        return data;
      }
    } catch (e) {
      // storage blocked or broken: start empty
    }
    return { items: [], coupon: "" };
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // storage blocked: the basket only lives on this page
    }
    showCount(data);
  }

  function showCount(data, bump) {
    var n = data.items.length;
    document.querySelectorAll(".basket-count").forEach(function (el) {
      el.textContent = n;
      el.classList.toggle("is-empty", n === 0);
      if (bump && !calm) {
        el.classList.remove("is-bump");
        void el.offsetWidth;
        el.classList.add("is-bump");
      }
    });
  }

  function totals(data) {
    var sub = data.items.reduce(function (sum, it) { return sum + it.total; }, 0);
    var pct = COUPONS[data.coupon] || 0;
    var discount = Math.round(sub * pct / 100);
    return { sub: sub, pct: pct, discount: discount, total: sub - discount };
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function details(it) {
    var lines = ["Departure: " + fmtDate(it.date)];
    lines.push("Travellers: " + it.adults + (it.adults === 1 ? " adult" : " adults") + (it.children ? ", " + it.children + (it.children === 1 ? " child" : " children") : ""));
    lines.push("Room: " + (it.room === "single" ? "single room" : "shared twin"));
    if (it.extras.length) {
      lines.push("Extras: " + it.extras.join(", "));
    }
    return lines;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) {
      node.className = cls;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  showCount(load());

  // ---------- tours: region, month and sort (buttons, selects or ?region= / ?month= from the home search) ----------
  var shop = document.querySelector(".tours-shop");
  if (shop) {
    var cards = Array.prototype.slice.call(shop.querySelectorAll(".tour"));
    var filters = document.querySelectorAll(".filter[data-region]");
    var monthSel = document.getElementById("t-month");
    var sortSel = document.getElementById("t-sort");
    var count = document.querySelector(".result-count");
    var none = document.querySelector(".no-results");
    var state = { region: "all", month: "all" };
    var params = new URLSearchParams(window.location.search);

    if (document.querySelector('.filter[data-region="' + params.get("region") + '"]')) {
      state.region = params.get("region");
    }
    if (monthSel.querySelector('option[value="' + params.get("month") + '"]')) {
      state.month = params.get("month");
    }
    if (sortSel.querySelector('option[value="' + params.get("orderby") + '"]')) {
      sortSel.value = params.get("orderby");
    }

    var apply = function (updateUrl) {
      var shown = 0;
      filters.forEach(function (f) {
        f.setAttribute("aria-pressed", f.getAttribute("data-region") === state.region ? "true" : "false");
      });
      monthSel.value = state.month;
      cards.forEach(function (card) {
        var ok = (state.region === "all" || card.getAttribute("data-region") === state.region) &&
          (state.month === "all" || card.getAttribute("data-months").indexOf(state.month) !== -1);
        card.hidden = !ok;
        shown += ok ? 1 : 0;
      });
      var key = sortSel.value;
      cards.slice().sort(function (a, b) {
        var num = function (el, k) { return parseFloat(el.getAttribute("data-" + k)); };
        if (key === "price") { return num(a, "price") - num(b, "price"); }
        if (key === "price-desc") { return num(b, "price") - num(a, "price"); }
        if (key === "rating") { return num(b, "rating") - num(a, "rating"); }
        if (key === "days") { return num(a, "days") - num(b, "days"); }
        return num(a, "pop") - num(b, "pop");
      }).forEach(function (card) {
        shop.appendChild(card);
      });
      count.textContent = shown === cards.length ? "Showing all " + shown + " results" :
        shown === 1 ? "Showing the single result" : "Showing " + shown + " of " + cards.length + " results";
      none.hidden = shown !== 0;
      if (updateUrl) {
        var url = new URL(window.location.href);
        [["region", state.region, "all"], ["month", state.month, "all"], ["orderby", key, "popularity"]].forEach(function (p) {
          if (p[1] === p[2]) {
            url.searchParams.delete(p[0]);
          } else {
            url.searchParams.set(p[0], p[1]);
          }
        });
        url.searchParams.delete("travellers");
        history.replaceState(null, "", url);
      }
    };

    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        state.region = f.getAttribute("data-region");
        apply(true);
      });
    });
    monthSel.addEventListener("change", function () {
      state.month = monthSel.value;
      apply(true);
    });
    sortSel.addEventListener("change", function () {
      apply(true);
    });
    document.querySelector(".shop-toolbar").addEventListener("submit", function (e) {
      e.preventDefault();
    });
    document.querySelector(".reset-filters").addEventListener("click", function () {
      state.region = "all";
      state.month = "all";
      apply(true);
    });
    apply(false);
  }

  // ---------- product page: gallery, tabs, booking form ----------
  var mainImg = document.querySelector(".product-img");
  document.querySelectorAll(".thumb").forEach(function (thumb, i, all) {
    thumb.addEventListener("click", function () {
      mainImg.src = thumb.getAttribute("data-src");
      mainImg.width = thumb.getAttribute("data-w");
      mainImg.height = thumb.getAttribute("data-h");
      all.forEach(function (t) {
        t.setAttribute("aria-pressed", t === thumb ? "true" : "false");
      });
    });
  });

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  if (tabs.length) {
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) {
        tab.focus();
      }
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (step) {
          e.preventDefault();
          select(tabs[(i + step + tabs.length) % tabs.length], true);
        }
      });
    });
    select(tabs[0]);
    var reviewLink = document.querySelector(".review-link");
    if (reviewLink) {
      reviewLink.addEventListener("click", function () {
        select(document.getElementById("tab-btn-reviews"));
      });
    }
  }

  var booking = document.getElementById("booking");
  if (booking) {
    var num = function (name) { return parseFloat(booking.getAttribute("data-" + name)); };
    var adults = document.getElementById("q-adults");
    var children = document.getElementById("q-children");
    var out = booking.querySelector("output");
    var err = booking.querySelector(".booking-error");

    var wanted = new URLSearchParams(window.location.search).get("date");
    var pick = wanted && booking.querySelector('input[name="date"][value="' + wanted + '"]:not(:disabled)');
    if (pick) {
      pick.checked = true;
    }

    var clamp = function (input) {
      var v = parseInt(input.value, 10);
      if (isNaN(v)) { v = parseInt(input.min, 10); }
      input.value = Math.max(parseInt(input.min, 10), Math.min(parseInt(input.max, 10), v));
    };

    var calc = function () {
      clamp(adults);
      clamp(children);
      var a = parseInt(adults.value, 10);
      var c = parseInt(children.value, 10);
      var people = a + c;
      var total = a * num("adult") + c * num("child");
      if (booking.elements.room.value === "single") { total += a * num("single"); }
      if (booking.elements.insurance.checked) { total += people * num("insurance"); }
      if (booking.elements.transfer.checked) { total += people * num("transfer"); }
      out.value = money(total);
      var date = booking.querySelector('input[name="date"]:checked');
      var left = date ? parseInt(date.getAttribute("data-left"), 10) : 0;
      err.textContent = !date ? "Please choose a departure." :
        people > left ? "Only " + left + (left === 1 ? " place is" : " places are") + " left on this departure." : "";
      return { total: total, a: a, c: c, date: date, ok: !!date && people <= left };
    };

    booking.addEventListener("input", calc);
    booking.addEventListener("change", calc);
    booking.querySelectorAll(".qty-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = btn.parentNode.querySelector("input");
        input.value = parseInt(input.value, 10) + parseInt(btn.getAttribute("data-step"), 10);
        calc();
      });
    });

    booking.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = calc();
      if (!r.ok) {
        err.focus();
        return;
      }
      var extras = [];
      if (booking.elements.insurance.checked) { extras.push("travel insurance"); }
      if (booking.elements.transfer.checked) { extras.push("airport transfers"); }
      var data = load();
      data.items.push({
        slug: booking.getAttribute("data-slug"),
        title: booking.getAttribute("data-title"),
        img: booking.getAttribute("data-img"),
        date: r.date.value,
        adults: r.a,
        children: r.c,
        room: booking.elements.room.value,
        extras: extras,
        total: r.total
      });
      save(data);
      showCount(data, true);
      var notice = document.querySelector(".woo-notice");
      notice.innerHTML = "";
      notice.appendChild(el("p", "", "“" + booking.getAttribute("data-title") + "” has been added to your basket."));
      var view = el("a", "btn btn-teal btn-small", "View basket");
      view.href = "basket.html";
      notice.appendChild(view);
      notice.hidden = false;
      notice.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    });
    calc();
  }

  // ---------- basket page ----------
  var basket = document.getElementById("basket");
  if (basket) {
    var deposit = parseFloat(basket.getAttribute("data-deposit"));
    var body = basket.querySelector(".shop-table tbody");
    var totalsBody = basket.querySelector(".totals-table tbody");
    var couponForm = basket.querySelector(".coupon");
    var couponMsg = basket.querySelector(".coupon-msg");

    var row = function (label, value, cls) {
      var tr = el("tr", cls || "");
      tr.appendChild(el("th", "", label));
      tr.appendChild(el("td", "", value));
      return tr;
    };

    var render = function () {
      var data = load();
      var empty = data.items.length === 0;
      basket.querySelector(".basket-empty").hidden = !empty;
      basket.querySelector(".basket-full").hidden = empty;
      body.innerHTML = "";
      data.items.forEach(function (it, i) {
        var tr = el("tr");
        var tdTour = el("td");
        var wrap = el("div", "line-tour");
        var im = el("img");
        im.src = it.img;
        im.alt = "";
        im.width = 92;
        im.height = 69;
        var link = el("a", "", it.title);
        link.href = it.slug + ".html";
        wrap.appendChild(im);
        wrap.appendChild(link);
        tdTour.appendChild(wrap);
        var tdDet = el("td");
        var ul = el("ul", "line-details");
        details(it).forEach(function (line) { ul.appendChild(el("li", "", line)); });
        tdDet.appendChild(ul);
        var tdSum = el("td", "num", money(it.total));
        var tdRm = el("td");
        var rm = el("button", "remove", "×");
        rm.type = "button";
        rm.setAttribute("aria-label", "Remove " + it.title + " from the basket");
        rm.addEventListener("click", function () {
          var d = load();
          d.items.splice(i, 1);
          if (!d.items.length) { d.coupon = ""; }
          save(d);
          render();
        });
        tdRm.appendChild(rm);
        [tdTour, tdDet, tdSum, tdRm].forEach(function (td) { tr.appendChild(td); });
        body.appendChild(tr);
      });
      var t = totals(data);
      totalsBody.innerHTML = "";
      totalsBody.appendChild(row("Subtotal", money(t.sub)));
      if (t.pct) {
        totalsBody.appendChild(row("Coupon: " + data.coupon, "−" + money(t.discount), "discount"));
      }
      totalsBody.appendChild(row("Total", money(t.total), "total-row"));
      totalsBody.appendChild(row("Deposit due at checkout (" + deposit + "%)", money(t.total * deposit / 100), "deposit"));
    };

    couponForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = couponForm.elements.coupon.value.trim().toUpperCase();
      var data = load();
      if (COUPONS[code]) {
        data.coupon = code;
        save(data);
        couponMsg.textContent = "Coupon code applied successfully.";
        couponForm.reset();
      } else {
        couponMsg.textContent = code ? "Coupon “" + code + "” does not exist." : "Please enter a coupon code.";
      }
      render();
    });
    render();
  }

  // ---------- checkout page ----------
  var checkout = document.getElementById("checkout");
  if (checkout) {
    var depositPct = parseFloat(checkout.getAttribute("data-deposit"));
    var form2 = checkout.querySelector(".checkout");
    var data2 = load();
    var t2 = totals(data2);
    var received = checkout.querySelector(".order-received");

    if (data2.items.length) {
      checkout.querySelector(".basket-empty").hidden = true;
      form2.hidden = false;
      var tb = form2.querySelector(".review-table tbody");
      data2.items.forEach(function (it) {
        var tr = el("tr");
        var th = el("td");
        th.appendChild(el("b", "", it.title));
        var ul = el("ul", "line-details");
        details(it).forEach(function (line) { ul.appendChild(el("li", "", line)); });
        th.appendChild(ul);
        tr.appendChild(th);
        tr.appendChild(el("td", "num", money(it.total)));
        tb.appendChild(tr);
      });
      var tf = form2.querySelector(".review-table tfoot");
      var foot = function (label, value, cls) {
        var tr = el("tr", cls || "");
        tr.appendChild(el("th", "", label));
        tr.appendChild(el("td", "num", value));
        tf.appendChild(tr);
      };
      foot("Subtotal", money(t2.sub));
      if (t2.pct) {
        foot("Coupon: " + data2.coupon, "−" + money(t2.discount));
      }
      foot("Total", money(t2.total), "total-row");
      form2.querySelector(".deposit-amount").textContent = money(t2.total * depositPct / 100) + " today, the rest 30 days before departure";
    }

    form2.addEventListener("submit", function (e) {
      e.preventDefault();
      var error = form2.querySelector(".checkout-error");
      var firstBad = null;
      form2.querySelectorAll("[required]").forEach(function (field) {
        var ok = field.type === "checkbox" ? field.checked :
          field.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()) : field.value.trim().length > 1;
        field.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstBad) {
          firstBad = field;
        }
      });
      if (firstBad) {
        error.textContent = firstBad.type === "checkbox" ? "Please read and accept the booking terms to continue." :
          "Please fill in the required fields marked with *.";
        firstBad.focus();
        return;
      }
      var full = form2.elements.plan.value === "full";
      var paid = full ? t2.total : t2.total * depositPct / 100;
      var number = "MER-" + String(Date.now()).slice(-6);
      var email = form2.elements.email.value.trim();
      received.innerHTML = "";
      received.appendChild(el("p", "thanks", "Thank you. Your booking has been received."));
      received.appendChild(el("p", "muted", "This is a demo: nothing was charged and no email was sent. On a live WooCommerce site " + email + " would now get the booking confirmation and the travel documents."));
      var ov = el("ul", "order-overview");
      [["Order number", number], ["Date", new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
       [full ? "Paid in full" : "Deposit paid", money(paid)], ["Payment method", form2.elements.method.value]].forEach(function (p) {
        var li = el("li", "", p[0]);
        li.appendChild(el("b", "", p[1]));
        ov.appendChild(li);
      });
      received.appendChild(ov);
      received.appendChild(el("h2", "", "Booking details"));
      var table = form2.querySelector(".review-table").cloneNode(true);
      received.appendChild(table);
      var back = el("a", "btn btn-teal", "Book another tour");
      back.href = "tours.html";
      back.style.marginTop = "28px";
      received.appendChild(back);
      form2.hidden = true;
      received.hidden = false;
      save({ items: [], coupon: "" });
      document.querySelector(".shop-title").textContent = "Order received";
      received.focus();
      window.scrollTo(0, 0);
    });
  }

  // contact form: checked in the browser only (demo, nothing is sent)
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var rules = [
      { id: "f-name", test: function (v) { return v.length >= 2; }, msg: "Please tell us your name." },
      { id: "f-email", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, msg: "Please enter a valid email address." },
      { id: "f-message", test: function (v) { return v.length >= 10; }, msg: "Tell us a little about your trip (at least 10 characters)." }
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
      status.textContent = "Thank you! On a real site a travel planner would now reply within one working day.";
    });
  }

  // newsletter in the footer (demo)
  var news = document.querySelector(".newsletter");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = news.querySelector("input");
      var msg = document.querySelector(".newsletter-status");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        msg.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }
      news.reset();
      msg.textContent = "Subscribed — demo only, no email is stored.";
    });
  }

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
