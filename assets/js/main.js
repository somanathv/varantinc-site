/* Varant Inc — shared site JS */
(function () {
  "use strict";

  /* Theme: dark is default; toggle persists to localStorage */
  var rootEl = document.documentElement;
  function currentTheme() {
    return rootEl.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function syncThemeIcon() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var light = currentTheme() === "light";
    var sun = btn.querySelector(".icon-sun");
    var moon = btn.querySelector(".icon-moon");
    if (sun) sun.style.display = light ? "none" : "";
    if (moon) moon.style.display = light ? "" : "none";
    btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
  }
  try {
    var saved = localStorage.getItem("varant-theme");
    rootEl.setAttribute("data-theme", saved === "light" ? "light" : "dark");
  } catch (e) { rootEl.setAttribute("data-theme", "dark"); }
  syncThemeIcon();
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("#theme-toggle") : null;
    if (!btn) return;
    var next = currentTheme() === "light" ? "dark" : "light";
    rootEl.setAttribute("data-theme", next);
    try { localStorage.setItem("varant-theme", next); } catch (e) {}
    syncThemeIcon();
  });

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* News loader (home page) */
  var newsList = document.getElementById("news-list");
  if (newsList) {
    fetch("/content/news.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = (data.news || []).filter(function (n) { return n.active !== false; });
        if (!items.length) {
          newsList.innerHTML = '<div class="empty-state">News updates coming soon.</div>';
          return;
        }
        newsList.innerHTML = items.map(function (n) {
          return '<article class="news-item reveal visible">' +
            '<div class="news-date">' + escapeHtml(n.date || "") + "</div>" +
            "<div><h3>" + escapeHtml(n.title || "") + "</h3><p>" +
            escapeHtml(n.summary || "") + "</p></div></article>";
        }).join("");
      })
      .catch(function () {
        newsList.innerHTML = '<div class="empty-state">Unable to load news right now.</div>';
      });
  }

  /* Jobs loader (careers page) */
  var jobsGrid = document.getElementById("jobs-grid");
  var jobsCount = document.getElementById("jobs-count");
  var jobSearch = document.getElementById("job-search");
  var jobFilter = document.getElementById("job-filter");
  var allJobs = [];
  function renderJobs() {
    if (!jobsGrid) return;
    var q = jobSearch ? jobSearch.value.trim().toLowerCase() : "";
    var dept = jobFilter ? jobFilter.value : "";
    var list = allJobs.filter(function (j) {
      if (j.active === false) return false;
      if (dept && j.department !== dept) return false;
      if (q && (j.title + " " + j.description + " " + j.location).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (jobsCount) {
      jobsCount.textContent = list.length + (list.length === 1 ? " open role" : " open roles");
    }
    if (!list.length) {
      jobsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">No roles match your search right now. Check back soon — or send your resume to <a href="mailto:info@varantinc.com">info@varantinc.com</a>.</div>';
      return;
    }
    jobsGrid.innerHTML = list.map(function (j) {
      var subject = encodeURIComponent("Application: " + j.title + " (" + j.id + ")");
      return '<article class="card job-card">' +
        '<h3>' + escapeHtml(j.title) + "</h3>" +
        '<div class="job-meta"><span>' + escapeHtml(j.location || "") + "</span><span>" +
        escapeHtml(j.type || "Full-time") + "</span><span>" + escapeHtml(j.department || "") + "</span></div>" +
        "<p>" + escapeHtml(j.description || "") + "</p>" +
        '<a class="card-link" href="mailto:info@varantinc.com?subject=' + subject + '">Apply for this role</a>' +
        "</article>";
    }).join("");
  }
  if (jobsGrid) {
    fetch("/content/jobs.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        allJobs = (data.jobs || []).filter(function (j) { return j.active !== false; });
        if (jobFilter) {
          var depts = [];
          allJobs.forEach(function (j) { if (j.department && depts.indexOf(j.department) < 0) depts.push(j.department); });
          depts.sort().forEach(function (d) {
            var opt = document.createElement("option");
            opt.value = d; opt.textContent = d;
            jobFilter.appendChild(opt);
          });
        }
        renderJobs();
      })
      .catch(function () {
        jobsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Unable to load openings right now. Please email <a href="mailto:info@varantinc.com">info@varantinc.com</a>.</div>';
      });
    if (jobSearch) jobSearch.addEventListener("input", renderJobs);
    if (jobFilter) jobFilter.addEventListener("change", renderJobs);
  }

  /* Office tabs (contact page) */
  var tabs = document.querySelectorAll(".office-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".office-panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      var panel = document.getElementById("office-" + tab.getAttribute("data-office"));
      if (panel) panel.classList.add("active");
    });
  });

  /* Contact form -> server-side email */
  var form = document.getElementById("contact-form");
  if (form) {
    // Prefill from ?topic= & ?src= (e.g. "Get notified at launch" buttons).
    var srcField = document.createElement("input");
    srcField.type = "hidden"; srcField.name = "source"; srcField.id = "cf-source";
    form.appendChild(srcField);
    try {
      var qs = new URLSearchParams(window.location.search);
      var qTopic = (qs.get("topic") || "").trim();
      var qSrc = (qs.get("src") || "").trim();
      if (qSrc) srcField.value = qSrc;
      if (qTopic) {
        var sel = document.getElementById("cf-topic");
        var ql = qTopic.toLowerCase();
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text.toLowerCase().indexOf(ql) === 0) {
            sel.selectedIndex = i;
            break;
          }
        }
        // Show where they came from.
        var note = document.createElement("p");
        note.id = "cf-context";
        note.style.cssText = "font-size:0.88rem;color:var(--muted);margin:-4px 0 18px;";
        note.textContent = "You're reaching out about " + sel.options[sel.selectedIndex].text + " — we've pre-selected it below.";
        var h2 = form.parentElement.querySelector(".section-head");
        if (h2) h2.appendChild(note);
      }
    } catch (e) { /* ignore */ }
    // Honeypot field (hidden from humans, bots fill it).
    var hp = document.createElement("input");
    hp.type = "text"; hp.name = "website"; hp.tabIndex = -1;
    hp.autocomplete = "off"; hp.style.display = "none";
    form.appendChild(hp);

    var statusEl = document.createElement("p");
    statusEl.id = "cf-status";
    statusEl.style.cssText = "font-size:0.92rem;margin-top:14px;min-height:1.4em;";
    form.querySelector('button[type="submit"]').after(statusEl);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var payload = {
        name: document.getElementById("cf-name").value,
        email: document.getElementById("cf-email").value,
        company: document.getElementById("cf-company").value,
        topic: document.getElementById("cf-topic").value,
        message: document.getElementById("cf-message").value,
        source: document.getElementById("cf-source").value,
        website: hp.value
      };
      btn.disabled = true;
      btn.textContent = "Sending…";
      statusEl.style.color = "var(--muted)";
      statusEl.textContent = "";
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (out) {
        if (out.ok) {
          statusEl.style.color = "#3ecf8e";
          statusEl.textContent = "Message sent — we'll get back to you within one business day.";
          form.reset();
        } else {
          statusEl.style.color = "#e0494f";
          statusEl.textContent = (out.j && out.j.error) || "Something went wrong. Please email info@varantinc.com directly.";
        }
      }).catch(function () {
        statusEl.style.color = "#e0494f";
        statusEl.textContent = "Couldn't reach our server. Please email info@varantinc.com directly.";
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = "Send message";
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
