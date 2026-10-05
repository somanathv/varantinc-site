/* Varant Inc — shared site JS */
(function () {
  "use strict";

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

  /* Contact form -> mailto */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cf-name").value;
      var email = document.getElementById("cf-email").value;
      var company = document.getElementById("cf-company").value;
      var topic = document.getElementById("cf-topic").value;
      var msg = document.getElementById("cf-message").value;
      var subject = encodeURIComponent("Website enquiry: " + topic + " — " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\nEmail: " + email + "\nCompany: " + company +
        "\nTopic: " + topic + "\n\n" + msg
      );
      window.location.href = "mailto:info@varantinc.com?subject=" + subject + "&body=" + body;
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
