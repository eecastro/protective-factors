/**
 * Protective Factors self-check: class data collector
 * Developed by Eric E Castro, Psychology Department, St Ignatius College Prep
 *
 * Receives anonymous scores from the GitHub Pages self-check and saves one row
 * per student to the "Responses" tab, with the date only (no time of day).
 * If a student changes an answer, the page resends with the same random
 * submission ID and the script updates that row instead of adding another.
 * It also returns class averages to the page.
 * The "Trends" tab averages every measure by school year, with a chart.
 *
 * Setup: paste into Extensions > Apps Script in a new Google Sheet, run setup()
 * once, then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * After editing this script later, redeploy: Deploy > Manage deployments > Edit > New version.
 *
 * Instructor dashboard (dashboard.html): run setDashboardKey() once to create a private key.
 * The dashboard asks for that key and receives class averages by semester, school year,
 * and section. It never receives individual rows, and groups under MIN_N stay hidden.
 */

var RESPONSES = 'Responses';
var TRENDS = 'Trends';
var MIN_N = 5;                  // never return averages for fewer than this many students
var YEAR_STARTS_MONTH = 8;      // school year starts in August (1 = January)

var FACTOR_IDS = ['social', 'coping', 'health', 'purpose', 'esteem', 'thinking'];
var HEADERS = [
  'Date', 'School year', 'Section',
  'Social support', 'Coping skills', 'Physical health', 'Sense of purpose', 'Self-esteem', 'Healthy thinking',
  'Close to people at school (1 = yes)', 'Active days (past 7)', 'Sleep hours (school night)', 'Lonely yesterday (1 = yes)',
  'Page version', 'Submission ID (random)'
];
var ID_COL = HEADERS.length;   // column O
var KEY_PROP = 'DASHBOARD_KEY';
var LOW_CUTOFF = 2.5;           // dashboard: share of students whose factor average is below this
var HIGH_CUTOFF = 4;            // dashboard: share of students whose factor average is at or above this

/* ---------- One-time setup: run this once from the editor ---------- */
function setup() {
  var ss = SpreadsheetApp.getActive();

  var sh = ss.getSheetByName(RESPONSES) || ss.insertSheet(RESPONSES, 0);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);   // also upgrades older headers
  sh.setFrozenRows(1);
  sh.getRange('1:1').setFontWeight('bold').setWrap(true);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  sh.getRange('B:C').setNumberFormat('@');           // keep "2026-27" as text
  sh.getRange('D:I').setNumberFormat('0.00');

  var tr = ss.getSheetByName(TRENDS) || ss.insertSheet(TRENDS);
  tr.clear();
  tr.getRange('A1').setFormula(
    '=QUERY(' + RESPONSES + '!A:N,' +
    '"select B, count(D), avg(D), avg(E), avg(F), avg(G), avg(H), avg(I), avg(J), avg(K), avg(L), avg(M) ' +
    'where B is not null group by B order by B ' +
    'label B \'School year\', count(D) \'Students\', avg(D) \'Social support\', avg(E) \'Coping skills\', ' +
    'avg(F) \'Physical health\', avg(G) \'Sense of purpose\', avg(H) \'Self-esteem\', avg(I) \'Healthy thinking\', ' +
    'avg(J) \'Close to people at school\', avg(K) \'Avg active days\', avg(L) \'Avg sleep hours\', avg(M) \'Lonely yesterday\'", 1)'
  );
  tr.getRange('C:H').setNumberFormat('0.00');
  tr.getRange('I:I').setNumberFormat('0%');
  tr.getRange('J:K').setNumberFormat('0.0');
  tr.getRange('L:L').setNumberFormat('0%');
  tr.getRange('1:1').setFontWeight('bold').setWrap(true);
  tr.setFrozenRows(1);
  tr.getRange('A30').setValue('Rows with fewer than ' + MIN_N + ' students are too small to read much into.')
    .setFontStyle('italic');

  tr.getCharts().forEach(function (c) { tr.removeChart(c); });
  var chart = tr.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(tr.getRange('A1:A25'))
    .addRange(tr.getRange('C1:H25'))
    .setNumHeaders(1)
    .setOption('title', 'Protective factors by school year (class average, 1 to 5)')
    .setOption('vAxis', { minValue: 1, maxValue: 5 })
    .setOption('pointSize', 6)
    .setOption('useFirstColumnAsDomain', true)
    .setPosition(2, 14, 0, 0)
    .build();
  tr.insertChart(chart);

  SpreadsheetApp.getUi().alert('Setup complete. Next: Deploy > New deployment > Web app.');
}

/* ---------- Receive one submission ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);
    var f = d.factors || {};
    var p = d.peers || {};

    // Validate everything; reject anything malformed instead of storing it
    var factorVals = FACTOR_IDS.map(function (id) {
      var v = Number(f[id]);
      if (!(v >= 1 && v <= 5)) throw new Error('bad factor ' + id);
      return Math.round(v * 100) / 100;
    });
    var close  = optionalInt(p.close, 0, 1);
    var active = optionalInt(p.active, 0, 7);
    var sleep  = optionalInt(p.sleep, 4, 10);
    var lonely = optionalInt(p.lonely, 0, 1);
    var section = String(d.section || '').replace(/[^A-Za-z0-9 \-]/g, '').slice(0, 20);
    var id = String(d.id || '');
    if (!/^[A-Za-z0-9-]{8,40}$/.test(id)) throw new Error('bad id');
    var version = String(d.v || '').slice(0, 20);

    var today = dateOnly(new Date());   // server date, no time of day
    lock.waitLock(10000);
    var sh = SpreadsheetApp.getActive().getSheetByName(RESPONSES);

    // Same submission ID = same student changing an answer: update that row
    var existing = sh.getLastRow() > 1
      ? sh.getRange(2, ID_COL, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()
      : null;
    if (existing) {
      var r = existing.getRow();
      var kept = sh.getRange(r, 1, 1, 2).getValues()[0];   // keep the original date and school year
      var row = [kept[0], kept[1], section].concat(factorVals).concat([close, active, sleep, lonely, version, id]);
      sh.getRange(r, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow([today, schoolYear(today), section].concat(factorVals).concat([close, active, sleep, lonely, version, id]));
    }
    CacheService.getScriptCache().removeAll(['stats', 'dash']);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- Return class averages to the page ---------- */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.view === 'dashboard') return dashboard(params.key);

  var cache = CacheService.getScriptCache();
  var cached = cache.get('stats');
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

  var sh = SpreadsheetApp.getActive().getSheetByName(RESPONSES);
  var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 13).getValues() : [];
  var current = schoolYear(new Date());

  var years = {};
  rows.forEach(function (r) { (years[r[1]] = years[r[1]] || []).push(r); });

  var out = {
    ok: true,
    currentYear: current,
    thisYear: summarize(years[current] || []),
    allTime: summarize(rows),
    byYear: Object.keys(years).sort().map(function (y) {
      var s = summarize(years[y]);
      s.year = y;
      return s;
    })
  };
  var text = JSON.stringify(out);
  cache.put('stats', text, 60);   // refresh at most once a minute
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Instructor dashboard ---------- */
// Run once from the editor. Creates (or replaces) the key the dashboard asks for.
// Running it again makes a new key and the old one stops working.
function setDashboardKey() {
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32);
  PropertiesService.getScriptProperties().setProperty(KEY_PROP, key);
  CacheService.getScriptCache().remove('dash');
  var msg = 'Your dashboard key:\n\n' + key + '\n\nCopy it now and paste it into dashboard.html when it asks. ' +
    'Anyone with this key can see class averages (never individual rows). Run setDashboardKey again to replace it.';
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (x) { /* run from a trigger or API: the log has it */ }
}

function dashboard(key) {
  var stored = PropertiesService.getScriptProperties().getProperty(KEY_PROP);
  if (!stored) return json({ ok: false, error: 'no-key', message: 'Run setDashboardKey() in the Apps Script editor first.' });
  if (!safeEqual(String(key || ''), stored)) {
    Utilities.sleep(800);   // slow down guessing
    return json({ ok: false, error: 'bad-key', message: 'That key is not right.' });
  }

  var cache = CacheService.getScriptCache();
  var cached = cache.get('dash');
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

  var sh = SpreadsheetApp.getActive().getSheetByName(RESPONSES);
  var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 13).getValues() : [];
  rows = rows.filter(function (r) { return r[0] instanceof Date && !isNaN(r[0]); });

  var out = {
    ok: true,
    minN: MIN_N,
    lowCutoff: LOW_CUTOFF,
    highCutoff: HIGH_CUTOFF,
    factorIds: FACTOR_IDS,
    total: rows.length,
    semesters: groupFor(rows, semesterOf),
    years: groupFor(rows, function (r) { var y = String(r[1] || schoolYear(r[0])); return { key: y, label: y }; })
  };
  var text = JSON.stringify(out);
  if (text.length < 90000) cache.put('dash', text, 60);
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

// Group rows by term, then by section within each term. Aggregates only.
function groupFor(rows, keyFn) {
  var groups = {}, labels = {};
  rows.forEach(function (r) {
    var k = keyFn(r);
    labels[k.key] = k.label;
    (groups[k.key] = groups[k.key] || []).push(r);
  });
  return Object.keys(groups).sort().map(function (k) {
    var g = groups[k];
    var bySection = {};
    g.forEach(function (r) {
      var s = String(r[2] || '').trim() || '(no section)';
      (bySection[s] = bySection[s] || []).push(r);
    });
    var out = detail(g);
    out.key = k;
    out.label = labels[k];
    out.sections = Object.keys(bySection).sort().map(function (s) {
      var d = detail(bySection[s]);
      d.section = s;
      return d;
    });
    return out;
  });
}

function detail(rows) {
  var n = rows.length;
  if (n < MIN_N) return { n: n };

  var factors = {};
  FACTOR_IDS.forEach(function (id, i) {
    var vals = rows.map(function (r) { return Number(r[3 + i]); }).filter(function (v) { return !isNaN(v); });
    var m = mean(vals);
    var sd = vals.length > 1
      ? Math.sqrt(vals.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (vals.length - 1))
      : 0;
    factors[id] = {
      mean: round2(m),
      sd: round2(sd),
      low: pct(vals.filter(function (v) { return v < LOW_CUTOFF; }).length, vals.length),
      high: pct(vals.filter(function (v) { return v >= HIGH_CUTOFF; }).length, vals.length),
      lowest: 0
    };
  });

  // Each student's lowest factor (ties count for every tied factor): the class's most common growth areas
  rows.forEach(function (r) {
    var vals = FACTOR_IDS.map(function (_, i) { return Number(r[3 + i]); });
    var min = Math.min.apply(null, vals);
    FACTOR_IDS.forEach(function (id, i) { if (vals[i] === min) factors[id].lowest++; });
  });
  FACTOR_IDS.forEach(function (id) { factors[id].lowest = pct(factors[id].lowest, n); });

  return {
    n: n,
    factors: factors,
    peers: {
      close:   pctWhere(rows, 9,  function (v) { return v === 1; }),
      active5: pctWhere(rows, 10, function (v) { return v >= 5; }),
      sleep8:  pctWhere(rows, 11, function (v) { return v >= 8; }),
      lonely:  pctWhere(rows, 12, function (v) { return v === 1; })
    }
  };
}

// Fall = YEAR_STARTS_MONTH to December; Spring = January to the month before.
function semesterOf(r) {
  var tz = Session.getScriptTimeZone();
  var y = Number(Utilities.formatDate(r[0], tz, 'yyyy'));
  var m = Number(Utilities.formatDate(r[0], tz, 'M'));
  return m >= YEAR_STARTS_MONTH
    ? { key: y + '-2', label: 'Fall ' + y }
    : { key: y + '-1', label: 'Spring ' + y };
}

function pct(hits, total) { return total ? Math.round(hits / total * 1000) / 10 : null; }

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------- Helpers ---------- */
function summarize(rows) {
  var n = rows.length;
  if (n < MIN_N) return { n: n };      // too few to share without risking identification

  var factors = {};
  FACTOR_IDS.forEach(function (id, i) {
    factors[id] = round2(mean(rows.map(function (r) { return r[3 + i]; })));
  });
  return {
    n: n,
    factors: factors,
    peers: {
      close:   pctWhere(rows, 9,  function (v) { return v === 1; }),
      active5: pctWhere(rows, 10, function (v) { return v >= 5; }),
      sleep8:  pctWhere(rows, 11, function (v) { return v >= 8; }),
      lonely:  pctWhere(rows, 12, function (v) { return v === 1; })
    }
  };
}

function pctWhere(rows, col, test) {
  var vals = rows.map(function (r) { return r[col]; }).filter(function (v) { return v !== '' && v !== null; });
  if (vals.length < MIN_N) return { n: vals.length };
  var hits = vals.filter(function (v) { return test(Number(v)); }).length;
  return { n: vals.length, pct: Math.round(hits / vals.length * 1000) / 10 };
}

function mean(arr) {
  var nums = arr.map(Number).filter(function (v) { return !isNaN(v); });
  return nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : null;
}
function round2(v) { return v === null ? null : Math.round(v * 100) / 100; }

function optionalInt(v, min, max) {
  if (v === null || v === undefined || v === '') return '';
  var n = Number(v);
  if (!(n === Math.floor(n) && n >= min && n <= max)) throw new Error('bad value');
  return n;
}

function schoolYear(date) {
  var tz = Session.getScriptTimeZone();
  var y = Number(Utilities.formatDate(date, tz, 'yyyy'));
  var m = Number(Utilities.formatDate(date, tz, 'M'));
  var start = m >= YEAR_STARTS_MONTH ? y : y - 1;
  return start + '-' + String(start + 1).slice(2);
}

function dateOnly(date) {
  var tz = Session.getScriptTimeZone();
  return Utilities.parseDate(Utilities.formatDate(date, tz, 'yyyy-MM-dd'), tz, 'yyyy-MM-dd');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
