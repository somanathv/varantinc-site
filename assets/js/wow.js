/* Varant Inc — "wow" hero: live network canvas + deploy terminal + count-up stats */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Animated network canvas ---------- */
  var canvas = document.getElementById("net-canvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, nodes = [], packets = [], running = true;
    var mouse = { x: -9999, y: -9999 };
    var ACCENTS = ["#e0494f", "#2aa198", "#e0494f", "#2aa198"];

    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(280, r.width); H = Math.max(200, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      nodes = [];
      var n = Math.max(14, Math.min(30, Math.floor((W * H) / 14000)));
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: 2 + Math.random() * 2.4,
          accent: Math.random() < 0.22
        });
      }
      packets = [];
      for (var p = 0; p < 5; p++) packets.push(newPacket());
      // AI core — the heart of the network
      if (nodes.length) {
        var core = nodes[0];
        core.core = true; core.r = 7;
        core.x = W / 2; core.y = H / 2;
        core.vx = 0.1; core.vy = 0.07;
      }
    }

    function newPacket() {
      var a = nodes[(Math.random() * nodes.length) | 0];
      var b;
      // packets preferentially flow to the AI core
      if (nodes[0] && nodes[0].core && Math.random() < 0.65 && a !== nodes[0]) {
        b = nodes[0];
      } else {
        b = nodes[(Math.random() * nodes.length) | 0];
      }
      if (!a || !b || a === b) return { t: 1, a: null, b: null };
      return { t: 0, a: a, b: b, speed: 0.008 + Math.random() * 0.012 };
    }

    function step() {
      // move nodes
      for (var i = 0; i < nodes.length; i++) {
        var nd = nodes[i];
        nd.x += nd.vx; nd.y += nd.vy;
        // gentle mouse repulsion
        var dx = nd.x - mouse.x, dy = nd.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 19600 && d2 > 1) {
          var d = Math.sqrt(d2), f = (140 - d) / 140 * 0.6;
          nd.x += (dx / d) * f; nd.y += (dy / d) * f;
        }
        if (nd.x < 0 || nd.x > W) nd.vx *= -1;
        if (nd.y < 0 || nd.y > H) nd.vy *= -1;
        nd.x = Math.max(0, Math.min(W, nd.x));
        nd.y = Math.max(0, Math.min(H, nd.y));
      }
      // move packets
      for (var p = 0; p < packets.length; p++) {
        var pk = packets[p];
        if (!pk.a) { packets[p] = newPacket(); continue; }
        pk.t += pk.speed;
        if (pk.t >= 1) packets[p] = newPacket();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // links
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.strokeStyle = "rgba(140,170,195," + (0.22 * (1 - d / 140)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // packets (data in flight) — teal when bound for the AI core
      for (var p = 0; p < packets.length; p++) {
        var pk = packets[p];
        if (!pk.a) continue;
        var x = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
        var y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
        var toCore = pk.b && pk.b.core;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, toCore ? "rgba(42,161,152,1)" : "rgba(255,120,120,1)");
        g.addColorStop(1, toCore ? "rgba(42,161,152,0)" : "rgba(255,120,120,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
      }
      // nodes
      for (var k = 0; k < nodes.length; k++) {
        var nd = nodes[k];
        if (nd.core) {
          var pulse = 15 + Math.sin(Date.now() / 450) * 6;
          var cg = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, pulse + 12);
          cg.addColorStop(0, "rgba(224,73,79,0.9)");
          cg.addColorStop(1, "rgba(224,73,79,0)");
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.arc(nd.x, nd.y, pulse + 12, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ff6b70";
          ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, 6.2832); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.font = "600 10px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText("AI", nd.x, nd.y - 17);
          continue;
        }
        if (nd.accent) {
          var col = ACCENTS[k % ACCENTS.length];
          var glow = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 12);
          glow.addColorStop(0, col);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(nd.x, nd.y, 12, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = col;
        } else {
          ctx.fillStyle = "rgba(205,225,240,0.85)";
        }
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, 6.2832); ctx.fill();
      }
    }

    function frame() {
      if (running && !document.hidden) { step(); draw(); }
      requestAnimationFrame(frame);
    }

    canvas.addEventListener("mousemove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener("mouseleave", function () {
      mouse.x = -9999; mouse.y = -9999;
    });
    window.addEventListener("resize", resize);

    // pause when the console scrolls out of view
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(canvas);
    }

    resize();
    if (reduceMotion) { draw(); } else { frame(); }
  }

  /* ---------- Deploy terminal typer ---------- */
  var term = document.getElementById("terminal");
  if (term) {
    var scripts = [
      [
        { t: "$ varant deploy --target production", c: "cmd" },
        { t: "✓ 214 tests passing", c: "ok" },
        { t: "✓ security scan clean", c: "ok" },
        { t: "✓ deployed in 41s — zero downtime", c: "ok" }
      ],
      [
        { t: "$ varant scale --region us-south", c: "cmd" },
        { t: "✓ 12 services healthy", c: "ok" },
        { t: "✓ autoscaled 4 → 16 nodes", c: "ok" },
        { t: "✓ p99 latency 84ms", c: "dim" }
      ],
      [
        { t: "$ varant ship --client \"fortune-1000\"", c: "cmd" },
        { t: "✓ architecture reviewed", c: "ok" },
        { t: "✓ client demo delivered", c: "ok" },
        { t: "✓ handover docs complete", c: "dim" }
      ],
      [
        { t: "$ varant ai deploy --agent support-copilot", c: "cmd" },
        { t: "✓ model fine-tuned on your data", c: "ok" },
        { t: "✓ evals + guardrails passing", c: "ok" },
        { t: "✓ agent live in 3m 12s", c: "dim" }
      ],
      [
        { t: "$ varant rag index --docs ./knowledge-base", c: "cmd" },
        { t: "✓ 12,408 chunks embedded → pgvector", c: "ok" },
        { t: "✓ retrieval recall@5: 0.94", c: "ok" },
        { t: "✓ grounded answers, citations on", c: "dim" }
      ]
    ];
    var si = 0, li = 0, ci = 0, lineEl = null;

    function newLine(cls) {
      lineEl = document.createElement("div");
      lineEl.className = "tline " + cls;
      term.appendChild(lineEl);
      // keep the terminal tidy
      while (term.children.length > 7) term.removeChild(term.firstChild);
    }
    function cursor() {
      var s = document.createElement("span");
      s.className = "cursor";
      return s;
    }
    function typeStep() {
      var script = scripts[si];
      if (li >= script.length) {
        setTimeout(function () {
          term.innerHTML = "";
          si = (si + 1) % scripts.length; li = 0; ci = 0;
          setTimeout(typeStep, 500);
        }, 2600);
        return;
      }
      var line = script[li];
      if (ci === 0) { newLine(line.c); lineEl.appendChild(cursor()); }
      if (ci < line.t.length) {
        lineEl.insertBefore(document.createTextNode(line.t.charAt(ci)), lineEl.lastChild);
        ci++;
        setTimeout(typeStep, line.c === "cmd" ? 34 : 14);
      } else {
        li++; ci = 0;
        setTimeout(typeStep, 320);
      }
    }

    if (reduceMotion) {
      scripts[0].forEach(function (line) {
        var d = document.createElement("div");
        d.className = "tline " + line.c;
        d.textContent = line.t;
        term.appendChild(d);
      });
    } else {
      typeStep();
    }
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(countUp);
    }
  }
})();
