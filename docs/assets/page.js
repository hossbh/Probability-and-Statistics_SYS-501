/* Probability and statistics labs: each panel recomputes from its controls. The maths is in kit.js. */
(function () {
  'use strict';
  var K = window.K, $ = K.$, $$ = K.$$, esc = K.esc, f = K.fmt;
  var S1 = 'var(--s1)', S2 = 'var(--s2)', S3 = 'var(--s3)';
  var kv = function (k, v, sub) { return '<div><span class="k">' + k + '</span><span class="v">' + v + (sub ? ' <small>' + sub + '</small>' : '') + '</span></div>'; };
  var val = function (id) { return +$('#' + id).value; };
  var out = function (id, t) { var o = $('#' + id + 'O'); if (o) o.textContent = t; };
  // wire a set of controls to a redraw function, with a label formatter per control
  var wire = function (map, fn, wait) {
    var run = wait ? K.debounce(fn, wait) : fn;
    Object.keys(map).forEach(function (id) {
      var el = $('#' + id), lab = map[id];
      var upd = function () { if (lab) out(id, lab(+el.value)); };
      upd(); el.addEventListener('input', function () { upd(); run(); });
    });
    fn();
  };
  var seg = function (id, fn) {
    $('#' + id).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      fn();
    });
  };
  var segVal = function (id, attr) { var b = $('#' + id + ' button[aria-pressed="true"]'); return b ? +b.getAttribute(attr) : NaN; };
  var p4 = function (v) { return v < 1e-4 && v > 0 ? '< 0.0001' : f(v, 4); };
  var int = function (v) { return String(Math.round(v)); };

  /* ---------------------------------------------------------------- Poisson: café arrivals */
  function pois() {
    var rate = val('pRate'), min = val('pMin'), k = val('pK'), m = val('pM'), t = val('pT'), lam = rate * min / 60;
    var pk = K.poissonPmf(k, lam), pge = m <= 0 ? 1 : 1 - K.poissonCdf(m - 1, lam), next = 1 - Math.exp(-rate * t / 60);
    $('#pOut').innerHTML = kv('Mean arrivals, λ', f(lam, 2), 'per ' + min + ' min') + kv('P(Y = ' + k + ')', f(pk, 4)) + kv('P(Y ≥ ' + m + ')', f(pge, 4)) + kv('Next arrival within ' + t + ' min', f(next, 4));
    var top = Math.max(10, Math.ceil(lam + 4.5 * Math.sqrt(lam)), k + 2, m + 2), lo = [], hi = [];
    for (var y = 0; y <= top; y++) (y >= m ? hi : lo).push([y, K.poissonPmf(y, lam)]);
    K.chart($('#pChart'), {
      height: 260, aria: 'Poisson probabilities of the number of customers in ' + min + ' minutes',
      x: { min: -0.7, max: top + 0.7, label: 'Customers in ' + min + ' minutes', fmt: int, tfmt: int },
      y: { min: 0, label: 'Probability', fmt: function (v) { return v.toFixed(2); }, tfmt: function (v) { return v.toFixed(4); } },
      series: [{ type: 'cols', name: 'P(Y = y)', color: S1, data: lo, width: 1 }, { type: 'cols', name: 'Counted in P(Y ≥ ' + m + ')', color: S2, data: hi, width: 1 }],
      labels: [{ x: k, y: pk, dy: -7, text: 'k', cls: 'lbl2' }], snap: Math.round
    });
  }
  wire({ pRate: function (v) { return v + ' / h'; }, pMin: function (v) { return v + ' min'; }, pK: String, pM: String, pT: function (v) { return v + ' min'; } }, pois);

  /* ---------------------------------------------------------------- binomial: pooled blood test */
  function bin() {
    var n = val('bN'), p = val('bP'), lam = n * p;
    var pos = 1 - Math.pow(1 - p, n), ge2 = (1 - K.binomCdf(1, n, p)) / pos;
    var posP = 1 - Math.exp(-lam), ge2P = (1 - K.poissonCdf(1, lam)) / posP;
    $('#bOut').innerHTML = kv('Expected cases, E[X]', f(lam, 2)) + kv('P(test positive)', f(pos, 4), 'Poisson ' + f(posP, 4)) + kv('P(X ≥ 2 | positive)', f(ge2, 4), 'Poisson ' + f(ge2P, 4));
    var top = Math.max(6, Math.ceil(lam + 4 * Math.sqrt(lam))), b = [], q = [];
    for (var k = 0; k <= top; k++) { b.push([k - 0.21, K.binomPmf(k, n, p)]); q.push([k + 0.21, K.poissonPmf(k, lam)]); }
    K.chart($('#bChart'), {
      height: 260, aria: 'Binomial and Poisson probabilities of the number of cases',
      x: { min: -0.7, max: top + 0.7, label: 'People with the disease', fmt: int, tfmt: int },
      y: { min: 0, label: 'Probability', fmt: function (v) { return v.toFixed(2); } },
      series: [{ type: 'cols', name: 'Binomial', color: S1, data: b, width: 0.4 }, { type: 'cols', name: 'Poisson, λ = np', color: S2, data: q, width: 0.4 }],
      snap: Math.round,
      tip: function (xv) { var k = Math.round(xv); if (k < 0 || k > top) return null; return '<b>' + k + ' with the disease</b><div class="r"><span><i class="k" style="--c:' + S1 + '"></i>Binomial</span><span>' + f(K.binomPmf(k, n, p), 4) + '</span></div><div class="r"><span><i class="k" style="--c:' + S2 + '"></i>Poisson</span><span>' + f(K.poissonPmf(k, lam), 4) + '</span></div>'; }
    });
  }
  wire({ bN: String, bP: function (v) { return v.toFixed(4); } }, bin);

  /* ---------------------------------------------------------------- normal: shaft tolerance */
  function norm() {
    var mu = val('nMu'), s = val('nS'), tol = val('nTol'), tgt = val('nTgt'), L = 0.9 - tol, U = 0.9 + tol;
    var defect = function (sg) { return K.normCdf(L, mu, sg) + 1 - K.normCdf(U, mu, sg); };
    var d = defect(s), sMax = null;
    if (defect(1e-7) <= tgt) sMax = K.invert(function (sg) { return defect(sg); }, tgt, 1e-7, 0.1);
    $('#nOut').innerHTML = kv('Out of tolerance', K.pct(d, 2)) + kv('Within tolerance', K.pct(1 - d, 2)) + kv('Largest σ for ≤ ' + K.pct(tgt, 1), sMax ? f(sMax, 5) + ' <small>in</small>' : '–');
    var lo = Math.min(L - tol * 0.5, mu - 4.2 * s), hi = Math.max(U + tol * 0.5, mu + 4.2 * s), pts = [], tl = [], tr = [];
    for (var i = 0; i <= 240; i++) { var x = lo + (hi - lo) * i / 240, y = K.normPdf(x, mu, s); pts.push([x, y]); if (x <= L) tl.push([x, y]); if (x >= U) tr.push([x, y]); }
    if (tl.length) tl.push([L, K.normPdf(L, mu, s)]);
    if (tr.length) tr.unshift([U, K.normPdf(U, mu, s)]);
    var fx = function (v) { return v.toFixed(3); };
    K.chart($('#nChart'), {
      height: 260, aria: 'Normal distribution of shaft diameters with the tolerance limits',
      x: { min: lo, max: hi, label: 'Shaft diameter (in)', fmt: fx, tfmt: function (v) { return v.toFixed(4) + ' in'; } },
      y: { min: 0, label: 'Density', fmt: K.compact },
      series: [
        { type: 'area', name: 'Diameter distribution', color: S1, data: pts },
        { type: 'area', name: 'Out of tolerance', color: S2, data: tl },
        { type: 'area', color: S2, data: tr, noLegend: true },
        { type: 'vline', x: L, color: 'var(--ink-3)', dash: '4 4', width: 1, label: 'lower limit' },
        { type: 'vline', x: U, color: 'var(--ink-3)', dash: '4 4', width: 1, label: 'upper limit' }
      ],
      tip: function (xv) { var out = xv < L || xv > U; return '<b>' + xv.toFixed(4) + ' in</b><div class="r"><span>' + (out ? 'Out of tolerance' : 'Within tolerance') + '</span><span></span></div><div class="r"><span>P(diameter ≤ x)</span><span>' + f(K.normCdf(xv, mu, s), 4) + '</span></div>'; }
    });
    $('#nSay').innerHTML = 'About <b>' + K.pct(d, 1) + '</b> of shafts fall outside 0.9 ± ' + tol + ' in. ' + (sMax ? 'To keep defects at or below ' + K.pct(tgt, 1) + ', σ must be at most <b>' + f(sMax, 5) + ' in</b> (now ' + s + ').' : 'With the mean this far off centre, no σ meets a ' + K.pct(tgt, 1) + ' target: re-centre the process first.');
  }
  wire({ nMu: function (v) { return v.toFixed(4); }, nS: function (v) { return v.toFixed(4); }, nTol: function (v) { return '± ' + v.toFixed(4); }, nTgt: function (v) { return K.pct(v, 1); } }, norm);

  /* ---------------------------------------------------------------- reliability: exponential and Weibull */
  function rel() {
    var mean = val('rMean'), lam = val('rScale'), k = val('rK'), x = val('rX'), a = val('rA');
    var Se = function (t) { return Math.exp(-t / mean); }, Sw = function (t) { return Math.exp(-Math.pow(t / lam, k)); };
    $('#rOut').innerHTML = kv('New · exponential', K.pct(Se(x), 1)) + kv('New · Weibull', K.pct(Sw(x), 1)) + kv('Used · Weibull', K.pct(Sw(a + x) / Sw(a), 1), 'after ' + a + 'k mi') + kv('Used · exponential', K.pct(Se(x), 1), 'no memory');
    var top = Math.max(60, x + a + 10), e = [], w = [], u = [];
    for (var i = 0; i <= 200; i++) { var t = top * i / 200; e.push([t, Se(t)]); w.push([t, Sw(t)]); u.push([t, Sw(a + t) / Sw(a)]); }
    K.chart($('#rChart'), {
      height: 270, aria: 'Survival curves for a new and a used motorcycle',
      x: { min: 0, max: top, label: 'Thousand miles without a failure', fmt: K.compact, tfmt: function (v) { return v.toFixed(1) + 'k mi'; } },
      y: { min: 0, max: 1, label: 'Survival probability', fmt: function (v) { return Math.round(v * 100) + ' %'; }, tfmt: function (v) { return K.pct(v, 1); } },
      series: [{ type: 'line', name: 'Exponential, new', color: S1, data: e }, { type: 'line', name: 'Weibull, new', color: S2, data: w }, { type: 'line', name: 'Weibull, used (' + a + 'k mi)', color: S3, data: u }, { type: 'vline', x: x, color: 'var(--ink-3)', dash: '3 3', width: 1, label: x + 'k mi' }]
    });
  }
  wire({ rMean: function (v) { return v + 'k'; }, rScale: function (v) { return v + 'k'; }, rK: function (v) { return v.toFixed(1); }, rX: function (v) { return v + 'k mi'; }, rA: function (v) { return v + 'k mi'; } }, rel);

  /* ---------------------------------------------------------------- Monte Carlo: the dart game */
  var P25 = Math.PI * 4 / 144, P15 = Math.PI * 12 / 144, P5 = Math.PI * 20 / 144, P0 = 1 - Math.PI * 36 / 144, EX = 25 * P25 + 15 * P15 + 5 * P5;
  function darts() {
    var N = val('dN'), seed = Math.max(1, parseInt($('#dSeed').value, 10) || 1), r = K.rng(seed);
    var pts = { 25: [], 15: [], 5: [], 0: [] }, cnt = { 25: 0, 15: 0, 5: 0, 0: 0 }, sum = 0, conv = [], every = Math.max(1, Math.floor(N / 200)), MAXDRAW = 4000;
    var score = function (x, y) { var d = Math.sqrt((x - 6) * (x - 6) + (y - 6) * (y - 6)); return d <= 2 ? 25 : d <= 4 ? 15 : d <= 6 ? 5 : 0; };
    for (var i = 1; i <= N; i++) {
      var x = 12 * r(), y = 12 * r(), s = score(x, y);
      cnt[s]++; sum += s; if (i <= MAXDRAW) pts[s].push([x, y]);
      if (i % every === 0 || i === N) conv.push([i, sum / i]);
    }
    var both = 0;
    for (i = 0; i < N; i++) { if (score(12 * r(), 12 * r()) >= 15 && score(12 * r(), 12 * r()) >= 15) both++; }
    var exact = (P25 + P15) * (P25 + P15);
    var ring = function (s, c) { return { type: 'dots', name: s ? s + ' points' : 'No score', color: c, data: pts[s], r: 2, ring: false, opacity: s ? 0.9 : 0.45 }; };
    K.chart($('#dBoard'), {
      height: 380, equal: true, legend: true, crosshair: false, aria: 'Simulated dart throws on the board',
      x: { min: 0, max: 12, ticks: [0, 2, 4, 6, 8, 10, 12], fmt: int }, y: { min: 0, max: 12, ticks: [0, 2, 4, 6, 8, 10, 12], fmt: int },
      series: [ring(0, 'var(--ink-3)'), ring(5, S3), ring(15, S2), ring(25, S1),
        { type: 'rect', x0: 0, x1: 12, y0: 0, y1: 12, color: 'var(--line-2)', width: 1 },
        { type: 'circle', cx: 6, cy: 6, r: 6, color: 'var(--ink-2)', width: 1.2 }, { type: 'circle', cx: 6, cy: 6, r: 4, color: 'var(--ink-2)', width: 1.2 }, { type: 'circle', cx: 6, cy: 6, r: 2, color: 'var(--ink-2)', width: 1.2 }],
      tip: function (xv, yv) { if (xv < 0 || xv > 12 || yv < 0 || yv > 12) return null; var s = score(xv, yv); return '<b>(' + xv.toFixed(1) + ', ' + yv.toFixed(1) + ') in</b><div class="r"><span>Scores</span><span>' + s + '</span></div>'; }
    });
    var row = function (lab, sim, ex, dp) { return '<tr><td>' + lab + '</td><td class="n">' + f(sim, dp) + '</td><td class="n">' + f(ex, dp) + '</td></tr>'; };
    $('#dTable').innerHTML = '<thead><tr><th></th><th class="n">Simulated</th><th class="n">Exact</th></tr></thead><tbody>' +
      row('P(score 25)', cnt[25] / N, P25, 4) + row('P(score 15)', cnt[15] / N, P15, 4) + row('P(score 5)', cnt[5] / N, P5, 4) + row('P(no score)', cnt[0] / N, P0, 4) +
      row('Expected score', sum / N, EX, 3) + row('P(two throws both ≥ 15)', both / N, exact, 4) + '</tbody>';
    K.chart($('#dConv'), {
      height: 200, aria: 'Running estimate of the expected score',
      x: { min: 0, max: N, label: 'Throws', fmt: K.compact, tfmt: function (v) { return Math.round(v).toLocaleString('en-US'); } },
      y: { label: 'Expected score', fmt: function (v) { return v.toFixed(1); }, tfmt: function (v) { return v.toFixed(3); } },
      series: [{ type: 'line', name: 'Running estimate', color: S1, data: conv }, { type: 'hline', y: EX, name: 'Exact, ' + EX.toFixed(3), color: 'var(--ink-2)', dash: '5 4', width: 1.5 }]
    });
    if (N > MAXDRAW) $('#dBoard').insertAdjacentHTML('beforeend', '<p class="chart-cap">Showing the first ' + MAXDRAW.toLocaleString('en-US') + ' of ' + N.toLocaleString('en-US') + ' throws.</p>');
  }
  wire({ dN: function (v) { return v.toLocaleString('en-US'); } }, darts, 60);
  $('#dSeed').addEventListener('input', K.debounce(darts, 150));
  $('#dDice').addEventListener('click', function () { $('#dSeed').value = 1 + Math.floor(Math.random() * 9999); darts(); });

  /* ---------------------------------------------------------------- Monte Carlo: highway accidents */
  function highway() {
    var m2 = val('hMu2'), s2 = val('hS2'), m3 = val('hMu3'), s3 = val('hS3'), dmin = val('hD'), N = val('hN'), L = 10, est = [];
    for (var sd = 0; sd < 10; sd++) {
      var r = K.rng(sd + 1), ok = 0;
      for (var i = 0; i < N; i++) {
        var a = L * r(), b = K.clamp(m2 + s2 * K.randn(r), 0, L), c = K.clamp(m3 + s3 * K.randn(r), 0, L);
        if (Math.abs(a - b) >= dmin && Math.abs(a - c) >= dmin && Math.abs(b - c) >= dmin) ok++;
      }
      est.push(ok / N);
    }
    var mean = K.mean(est), hi = Math.max.apply(null, est), lo = Math.min.apply(null, est), conv = hi - lo < 0.05 * hi;
    $('#hOut').innerHTML = kv('P(all ≥ ' + dmin + ' mi apart)', f(mean, 4)) + kv('Spread across seeds', f(hi - lo, 4), conv ? 'converged' : 'not yet: add runs') + kv('Simulated days', (10 * N).toLocaleString('en-US'));
    K.chart($('#hChart'), {
      height: 200, aria: 'Estimates from ten random seeds',
      x: { min: 0.5, max: 10.5, ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], label: 'Seed', fmt: int },
      y: { label: 'Estimate', fmt: function (v) { return v.toFixed(3); }, pad: 0.3 },
      series: [{ type: 'dots', name: 'Estimate per seed', color: S1, data: est.map(function (p, i) { return [i + 1, p]; }), r: 5 }, { type: 'hline', y: mean, name: 'Average, ' + mean.toFixed(4), color: 'var(--ink-2)', dash: '5 4', width: 1.5 }],
      crosshair: false,
      tip: function (xv, yv, near) { return near ? '<b>Seed ' + near.p[0] + '</b><div class="r"><span>Estimate</span><span>' + near.p[1].toFixed(4) + '</span></div>' : null; }
    });
  }
  var mi = function (v) { return v + ' mi'; };
  wire({ hMu2: mi, hS2: mi, hMu3: mi, hS3: mi, hD: mi, hN: function (v) { return v.toLocaleString('en-US'); } }, highway, 120);

  /* ---------------------------------------------------------------- Poisson: airline accidents */
  function air() {
    var rate = val('aRate'), more = val('aMore'), months = val('aMonths'), kth = val('aKth'), lam = rate * months;
    $('#aOut').innerHTML = kv('P(more than ' + more + ' in ' + months + (months > 1 ? ' months)' : ' month)'), f(1 - K.poissonCdf(more, lam), 4)) + kv('Expected accidents', f(lam, 1), 'in ' + months + (months > 1 ? ' months' : ' month')) + kv('Expected days to accident ' + kth, f(kth / (rate / 30), 1), 'Erlang mean');
  }
  wire({ aRate: function (v) { return v.toFixed(1); }, aMore: String, aMonths: String, aKth: String }, air);

  /* ---------------------------------------------------------------- Welch's t-test and the F-test */
  var parse = function (s) { return s.split(/[\s,;]+/).filter(function (t) { return t !== ''; }).map(Number).filter(isFinite); };
  function gas() {
    var a = parse($('#g1').value), b = parse($('#g2').value), alpha = segVal('gAlpha', 'data-a');
    if (a.length < 2 || b.length < 2) { $('#gOut').innerHTML = ''; $('#gSay').textContent = 'Enter at least two prices for each city.'; $('#gChart').innerHTML = ''; return; }
    var m1 = K.mean(a), m2 = K.mean(b), v1 = K.variance(a), v2 = K.variance(b), n1 = a.length, n2 = b.length;
    var se = Math.sqrt(v1 / n1 + v2 / n2), t = (m1 - m2) / se, df = Math.pow(v1 / n1 + v2 / n2, 2) / (Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1));
    var p = 2 * (1 - K.tCdf(Math.abs(t), df));
    var big = v2 >= v1, F = big ? v2 / v1 : v1 / v2, dn = big ? n2 - 1 : n1 - 1, dd = big ? n1 - 1 : n2 - 1, pF = Math.min(1, 2 * (1 - K.fCdf(F, dn, dd)));
    $('#gOut').innerHTML = kv('City 1 mean', '$' + f(m1, 3), 'n ' + n1) + kv('City 2 mean', '$' + f(m2, 3), 'n ' + n2) + kv('Welch t', f(t, 3), 'df ' + f(df, 1)) + kv('p-value, means', p4(p)) + kv('Variance ratio', f(F, 2)) + kv('p-value, variances', p4(pF));
    var noisier = big ? 'City 2' : 'City 1';
    $('#gSay').innerHTML = (p < alpha ? 'The mean prices <b>differ significantly</b> at the ' + K.pct(alpha, 0) + ' level (p = ' + p4(p) + ').' : '<b>No significant difference</b> in mean price at the ' + K.pct(alpha, 0) + ' level (p = ' + p4(p) + ').') + ' ' +
      (pF < alpha ? 'The variances <b>do differ</b>: ' + noisier + '’s prices are about ' + f(F, 1) + ' times as variable, so the unequal-variance (Welch) test is the right one.' : 'The variances are not significantly different (p = ' + p4(pF) + ').');
    var r = K.rng(7), jit = function (v, row) { return [v, row + (r() - 0.5) * 0.36]; };
    K.chart($('#gChart'), {
      height: 190, aria: 'Gas prices in the two cities', crosshair: false,
      x: { label: 'Price ($)', fmt: function (v) { return v.toFixed(2); }, pad: 0.05 },
      y: { min: 0.4, max: 2.6, ticks: [1, 2], fmt: function (v) { return v === 1 ? 'City 1' : v === 2 ? 'City 2' : ''; } },
      series: [{ type: 'dots', name: 'City 1', color: S1, data: a.map(function (v) { return jit(v, 1); }), r: 4.5 }, { type: 'dots', name: 'City 2', color: S2, data: b.map(function (v) { return jit(v, 2); }), r: 4.5 },
        { type: 'line', name: 'Mean', color: 'var(--ink)', data: [[m1, 0.68], [m1, 1.32]], width: 2.5 }, { type: 'line', color: 'var(--ink)', data: [[m2, 1.68], [m2, 2.32]], width: 2.5, noLegend: true }],
      tip: function (xv, yv, near) { return near && near.s.type === 'dots' ? '<b>' + esc(near.s.name) + '</b><div class="r"><span>Price</span><span>$' + near.p[0].toFixed(2) + '</span></div>' : null; }
    });
  }
  ['#g1', '#g2'].forEach(function (s) { $(s).addEventListener('input', K.debounce(gas, 200)); });
  seg('gAlpha', gas);
  gas();

  /* ---------------------------------------------------------------- confidence intervals */
  function ci() {
    var m = parseFloat($('#cMean').value), s = parseFloat($('#cSd').value), n = parseInt($('#cN').value, 10), c = segVal('cConf', 'data-c');
    if (!(isFinite(m) && s > 0 && n >= 2)) { $('#cOut').innerHTML = kv('Check the inputs', '–', 'std dev above 0, n at least 2'); return; }
    var df = n - 1, a = 1 - c, t = K.tInv(1 - a / 2, df), me = t * s / Math.sqrt(n);
    var lo = K.chi2Inv(a / 2, df), hi = K.chi2Inv(1 - a / 2, df), vL = df * s * s / hi, vH = df * s * s / lo;
    var dp = K.clamp(2 - Math.floor(Math.log(me) / Math.LN10), 2, 8), dps = K.clamp(3 - Math.floor(Math.log(s) / Math.LN10), 2, 8);
    $('#cOut').innerHTML = kv(K.pct(c, 0) + ' CI for the mean', f(m - me, dp) + ' – ' + f(m + me, dp), '± ' + f(me, dp)) + kv(K.pct(c, 0) + ' CI for the std dev', f(Math.sqrt(vL), dps) + ' – ' + f(Math.sqrt(vH), dps)) + kv('t critical value', f(t, 4), 'df ' + df.toLocaleString('en-US'));
  }
  ['#cMean', '#cSd', '#cN'].forEach(function (s) { $(s).addEventListener('input', K.debounce(ci, 150)); });
  seg('cConf', ci);
  ci();

  /* ---------------------------------------------------------------- sample size */
  function size() {
    var s = parseFloat($('#sSig').value), e = parseFloat($('#sMe').value);
    if (!(s > 0 && e > 0)) { $('#sOut').innerHTML = kv('Check the inputs', '–', 'both above 0'); return; }
    $('#sOut').innerHTML = [0.9, 0.95, 0.99].map(function (c) { var z = K.normInv(1 - (1 - c) / 2), n = Math.pow(z * s / e, 2); return kv(K.pct(c, 0) + ' confidence', Math.ceil(n - 1e-9).toLocaleString('en-US'), 'n = ' + f(n, 2)); }).join('');
  }
  ['#sSig', '#sMe'].forEach(function (s) { $(s).addEventListener('input', K.debounce(size, 150)); });
  size();
})();
