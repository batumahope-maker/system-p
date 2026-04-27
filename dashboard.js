/* ================================================================
   KEZA ADMIN — dashboard.js
   Full dashboard logic: Auth, Navigation, Charts, Tables, Toasts
   ================================================================ */

'use strict';

/* ── Demo credentials (in real app would hit an API) ── */
var USERS = [
  { username: 'admin',   password: 'admin123', name: 'James Kwizera',    role: 'Super Admin',  emoji: '👨‍💼' },
  { username: 'manager', password: 'pass456',  name: 'Amara Diallo',     role: 'Manager',      emoji: '👩‍💻' },
  { username: 'staff',   password: 'staff789', name: 'Sophie Mugenzi',   role: 'Staff',        emoji: '👩‍🎨' },
];

/* ── App State ── */
var state = {
  loggedIn:    false,
  currentUser: null,
  page:        'overview',
  loginAttempts: 0,
};

/* ── Sample Data ── */
var DATA = {
  revenue: {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    values: [3200, 4100, 3800, 5200, 4700, 6100, 5800, 7200, 6500, 8100, 7400, 9200],
  },
  categories: [
    { label:'Electronics',     pct:42, color:'var(--terra)',  sw:'var(--terra)'  },
    { label:'Furniture',       pct:18, color:'var(--teal)',   sw:'var(--teal)'   },
    { label:'Office Supplies', pct:24, color:'var(--gold)',   sw:'var(--gold)'   },
    { label:'Health & Beauty', pct:16, color:'var(--rose)',   sw:'var(--rose)'   },
  ],
  orders: [
    { id:'KZ-1042', customer:'Alice Mukamana',   product:'Laptop HP EliteBook',  qty:2,  total:1700000, status:'completed', date:'2026-04-22' },
    { id:'KZ-1041', customer:'Bob Niyonzima',    product:'Ergonomic Chair',       qty:5,  total: 475000, status:'pending',   date:'2026-04-21' },
    { id:'KZ-1040', customer:'Clara Ingabire',   product:'Wireless Mouse',        qty:10, total: 180000, status:'completed', date:'2026-04-20' },
    { id:'KZ-1039', customer:'David Habimana',   product:'USB-C Hub',             qty:3,  total:  96000, status:'cancelled', date:'2026-04-19' },
    { id:'KZ-1038', customer:'Eve Uwimana',      product:'A4 Printing Paper',     qty:20, total: 110000, status:'completed', date:'2026-04-18' },
    { id:'KZ-1037', customer:'Frank Mugisha',    product:'Hand Sanitiser 500ml',  qty:50, total: 175000, status:'pending',   date:'2026-04-17' },
    { id:'KZ-1036', customer:'Grace Iradukunda', product:'Office Desk (180cm)',   qty:1,  total: 120000, status:'completed', date:'2026-04-16' },
  ],
  users: [
    { id:'KU-001', name:'James Kwizera',    email:'james@keza.rw',  role:'Admin',   status:'active',   joined:'2024-01-10', emoji:'👨‍💼', bg:'var(--terra-dim)' },
    { id:'KU-002', name:'Amara Diallo',     email:'amara@keza.rw',  role:'Manager', status:'active',   joined:'2024-02-15', emoji:'👩‍💻', bg:'var(--teal-dim)'  },
    { id:'KU-003', name:'Sophie Mugenzi',   email:'sophie@keza.rw', role:'Staff',   status:'active',   joined:'2024-03-01', emoji:'👩‍🎨', bg:'var(--gold-dim)'  },
    { id:'KU-004', name:'David Nkurunziza', email:'david@keza.rw',  role:'Staff',   status:'inactive', joined:'2024-03-20', emoji:'👨‍📊', bg:'var(--rose-dim)'  },
    { id:'KU-005', name:'Eve Uwimana',      email:'eve@keza.rw',    role:'Viewer',  status:'active',   joined:'2024-05-11', emoji:'👩‍🔬', bg:'var(--terra-dim)' },
  ],
  activity: [
    { icon:'📦', cls:'act-terra', text:'<strong>New order</strong> KZ-1042 received from Alice Mukamana',   time:'2 min ago'  },
    { icon:'✅', cls:'act-teal',  text:'Order <strong>KZ-1040</strong> marked as completed',                 time:'18 min ago' },
    { icon:'⚠️', cls:'act-gold',  text:'<strong>USB-C Hub</strong> stock dropped below threshold (3 left)',  time:'1 hr ago'   },
    { icon:'👤', cls:'act-rose',  text:'New user <strong>Eve Uwimana</strong> joined the system',             time:'3 hr ago'   },
    { icon:'❌', cls:'act-rose',  text:'Order <strong>KZ-1039</strong> was cancelled by customer',            time:'5 hr ago'   },
  ],
};

/* ================================================================
   UTILITY
   ================================================================ */

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtCurrency(n) {
  return 'RWF ' + Number(n).toLocaleString();
}

function statusPill(s) {
  var map = {
    completed: ['green',  '✓ Completed'],
    pending:   ['orange', '⏳ Pending'],
    cancelled: ['red',    '✕ Cancelled'],
    active:    ['green',  '● Active'],
    inactive:  ['red',    '○ Inactive'],
  };
  var b = map[s] || ['blue', s];
  return '<span class="pill ' + b[0] + '"><span class="pill-dot"></span>' + b[1] + '</span>';
}

/* ================================================================
   AUTH — LOGIN / LOGOUT
   ================================================================ */

/**
 * Attempt login with username and password.
 * Validates against USERS array, shows error on failure,
 * transitions to the app shell on success.
 */
function attemptLogin() {
  var username = document.getElementById('loginUser').value.trim().toLowerCase();
  var password = document.getElementById('loginPass').value;
  var errEl    = document.getElementById('loginError');
  var btn      = document.getElementById('loginBtn');

  /* Max 5 attempts guard */
  if (state.loginAttempts >= 5) {
    errEl.textContent = 'Too many failed attempts. Please refresh the page.';
    errEl.classList.add('show');
    btn.disabled = true;
    return;
  }

  if (!username || !password) {
    errEl.textContent = 'Please enter your username and password.';
    errEl.classList.add('show');
    return;
  }

  /* Find matching user */
  var match = USERS.find(function(u) {
    return u.username === username && u.password === password;
  });

  if (!match) {
    state.loginAttempts++;
    errEl.textContent = 'Invalid credentials. Please try again. (' +
      (5 - state.loginAttempts) + ' attempts left)';
    errEl.classList.add('show');

    /* Shake animation on form */
    var panel = document.querySelector('.login-form-panel');
    panel.style.animation = 'none';
    void panel.offsetWidth;
    panel.style.animation = 'shake 0.4s ease';
    return;
  }

  /* ── Login success ── */
  state.loggedIn    = true;
  state.currentUser = match;
  state.loginAttempts = 0;
  errEl.classList.remove('show');

  /* Animate login page out */
  var loginPage = document.getElementById('loginPage');
  loginPage.style.animation = 'loginOut 0.4s ease forwards';

  setTimeout(function() {
    loginPage.classList.add('hidden');
    bootApp();
  }, 380);
}

/**
 * Allow Enter key to submit the login form
 */
function loginKeydown(e) {
  if (e.key === 'Enter') attemptLogin();
}

/**
 * Show logout confirmation modal
 */
function confirmLogout() {
  document.getElementById('logoutModal').classList.add('open');
}

/**
 * Cancel logout — close modal
 */
function cancelLogout() {
  document.getElementById('logoutModal').classList.remove('open');
}

/**
 * Execute logout — clear state, return to login screen
 */
function doLogout() {
  document.getElementById('logoutModal').classList.remove('open');
  state.loggedIn    = false;
  state.currentUser = null;

  /* Clear login fields */
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').classList.remove('show');

  /* Animate app out / login in */
  var app   = document.getElementById('appShell');
  var login = document.getElementById('loginPage');

  app.style.opacity   = '0';
  app.style.transform = 'translateY(-16px)';
  app.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  setTimeout(function() {
    app.style.opacity   = '';
    app.style.transform = '';
    app.style.transition = '';
    app.classList.add('hidden');
    login.classList.remove('hidden');
    login.style.animation = 'loginIn 0.5s cubic-bezier(.22,1,.36,1) both';
  }, 300);

  toast('You have been logged out.', 'inf');
}

/* ================================================================
   BOOT — run after successful login
   ================================================================ */

function bootApp() {
  var app = document.getElementById('appShell');
  app.classList.remove('hidden');
  app.style.animation = 'pgIn 0.5s ease both';

  /* Fill user info in sidebar */
  var u = state.currentUser;
  document.getElementById('sbUserName').textContent  = u.name;
  document.getElementById('sbUserRole').textContent  = u.role;
  document.getElementById('sbUserEmoji').textContent = u.emoji;

  /* Render all pages */
  renderOverview();
  renderAnalytics();
  renderOrdersPage();
  renderUsersPage();

  /* Start live clock */
  updateClock();
  setInterval(updateClock, 1000);

  /* Default page */
  navigate('overview', true);
}

/* ================================================================
   NAVIGATION
   ================================================================ */

function navigate(page, skipClose) {
  state.page = page;

  /* Switch page sections */
  document.querySelectorAll('.pg').forEach(function(el) {
    el.classList.remove('active');
  });
  var target = document.getElementById('pg-' + page);
  if (target) target.classList.add('active');

  /* Sidebar active button */
  document.querySelectorAll('.sb-btn').forEach(function(b) {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  var active = document.querySelector('.sb-btn[data-p="' + page + '"]');
  if (active) { active.classList.add('active'); active.setAttribute('aria-current','page'); }

  /* Topbar title */
  var titles = {
    overview:  'Overview',
    analytics: 'Analytics',
    orders:    'Orders',
    users:     'Users',
    settings:  'Settings',
  };
  var titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = titles[page] || page;

  if (!skipClose) closeMobile();
}

/* ================================================================
   LIVE CLOCK
   ================================================================ */

function updateClock() {
  var el = document.getElementById('liveClk');
  if (!el) return;
  var now = new Date();
  el.textContent = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

/* ================================================================
   RENDER — OVERVIEW
   ================================================================ */

function renderOverview() {
  renderBarChart('revChart', DATA.revenue.values.slice(-7), DATA.revenue.labels.slice(-7));
  renderDonut('donutRing', 'donutLegend');
  renderActivity('actFeed');
  renderOrdersTable('recentTbody', 5);
  renderTopProducts('topProds');
}

/* ── Bar chart ── */
function renderBarChart(id, values, labels) {
  var el = document.getElementById(id);
  if (!el) return;
  var maxV = Math.max.apply(null, values);
  var cls  = ['terra','teal','gold','terra','teal','gold','terra'];

  el.innerHTML = values.map(function(v, i) {
    var pct = Math.round((v / maxV) * 100);
    return (
      '<div class="bc-group">' +
        '<div class="bc-bar ' + cls[i % cls.length] + '" ' +
          'style="height:' + pct + '%;" ' +
          'data-tip="' + fmtCurrency(v * 1000) + '"></div>' +
        '<span class="bc-label">' + (labels[i] || '') + '</span>' +
      '</div>'
    );
  }).join('');
}

/* ── Donut chart ── */
function renderDonut(ringId, legendId) {
  var ring   = document.getElementById(ringId);
  var legend = document.getElementById(legendId);
  if (!ring && !legend) return;

  /* conic-gradient */
  var angle = 0;
  var stops = DATA.categories.map(function(c) {
    var deg = (c.pct / 100) * 360;
    var stop = c.color + ' ' + angle + 'deg ' + (angle + deg) + 'deg';
    angle += deg;
    return stop;
  });

  if (ring) ring.style.background = 'conic-gradient(' + stops.join(',') + ')';

  if (legend) {
    legend.innerHTML = DATA.categories.map(function(c) {
      return (
        '<div class="dl-item">' +
          '<span class="dl-swatch" style="background:' + c.sw + '"></span>' +
          '<span>' + esc(c.label) + '</span>' +
          '<span class="dl-pct">' + c.pct + '%</span>' +
        '</div>'
      );
    }).join('');
  }
}

/* ── Activity feed ── */
function renderActivity(id) {
  var el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = DATA.activity.map(function(a) {
    return (
      '<div class="act-item">' +
        '<div class="act-icon ' + a.cls + '">' + a.icon + '</div>' +
        '<div class="act-text">' +
          '<div>' + a.text + '</div>' +
          '<div class="act-time">' + a.time + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* ── Orders table ── */
function renderOrdersTable(tbodyId, limit) {
  var el = document.getElementById(tbodyId);
  if (!el) return;
  var rows = limit ? DATA.orders.slice(0, limit) : DATA.orders;

  el.innerHTML = rows.map(function(o) {
    return (
      '<tr>' +
        '<td>' + esc(o.id) + '</td>' +
        '<td style="color:var(--cream);font-weight:500">' + esc(o.customer) + '</td>' +
        '<td>' + esc(o.product) + '</td>' +
        '<td style="text-align:center">' + o.qty + '</td>' +
        '<td style="color:var(--cream);font-weight:600;font-family:var(--font-mono)">' + fmtCurrency(o.total) + '</td>' +
        '<td>' + statusPill(o.status) + '</td>' +
        '<td style="color:var(--sand-2);font-family:var(--font-mono)">' + o.date + '</td>' +
      '</tr>'
    );
  }).join('');
}

/* ── Top products ── */
function renderTopProducts(id) {
  var el = document.getElementById(id);
  if (!el) return;

  var items = [
    { name:'Laptop HP EliteBook',  units:840, pct:92, fill:'var(--terra)'  },
    { name:'Wireless Mouse',       units:620, pct:68, fill:'var(--teal)'   },
    { name:'Hand Sanitiser 500ml', units:480, pct:53, fill:'var(--gold)'   },
    { name:'USB-C Hub (7-in-1)',   units:310, pct:34, fill:'var(--rose)'   },
    { name:'Office Desk (180cm)',  units:190, pct:21, fill:'var(--terra)'  },
  ];

  el.innerHTML = '<div class="prog-list">' +
    items.map(function(item) {
      return (
        '<div>' +
          '<div class="prog-row-lbl">' +
            '<span>' + esc(item.name) + '</span>' +
            '<span>' + item.units + ' units</span>' +
          '</div>' +
          '<div class="prog-track">' +
            '<div class="prog-fill" style="width:' + item.pct + '%;background:' + item.fill + '"></div>' +
          '</div>' +
        '</div>'
      );
    }).join('') +
  '</div>';
}

/* ================================================================
   RENDER — ANALYTICS
   ================================================================ */

function renderAnalytics() {
  renderBarChart('revChartFull', DATA.revenue.values, DATA.revenue.labels);
}

/* ================================================================
   RENDER — ORDERS PAGE
   ================================================================ */

function renderOrdersPage() {
  renderOrdersTable('allOrdersTbody', null);
}

/* ================================================================
   RENDER — USERS PAGE
   ================================================================ */

function renderUsersPage() {
  var el = document.getElementById('usersTbody');
  if (!el) return;

  el.innerHTML = DATA.users.map(function(u) {
    return (
      '<tr>' +
        '<td>' + esc(u.id) + '</td>' +
        '<td>' +
          '<div class="u-row">' +
            '<div class="u-av" style="background:' + u.bg + '">' + u.emoji + '</div>' +
            '<div>' +
              '<div class="u-name">' + esc(u.name) + '</div>' +
              '<div class="u-email">' + esc(u.email) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="pill blue">' + esc(u.role) + '</span></td>' +
        '<td>' + statusPill(u.status) + '</td>' +
        '<td style="color:var(--sand-2);font-family:var(--font-mono)">' + u.joined + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-ghost btn-sm" onclick="toast(\'Editing \'+\'' + esc(u.name) + '\',\'inf\')">✏️ Edit</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="toast(\'Feature coming soon\',\'inf\')">🔒 Reset PW</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */

/**
 * Show a toast notification
 * @param {string} msg   - message text
 * @param {string} type  - 'ok' | 'err' | 'inf'
 */
function toast(msg, type) {
  type = type || 'inf';
  var icons = { ok:'✅', err:'❌', inf:'💡' };
  var area  = document.getElementById('toastArea');
  var el    = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + (icons[type] || '💡') + '</span><span>' + esc(msg) + '</span>';
  area.appendChild(el);

  setTimeout(function() {
    el.style.animation = 'tOut 0.3s ease forwards';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  }, 3200);
}

/* ================================================================
   MOBILE SIDEBAR
   ================================================================ */

function toggleMobile() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeMobile() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

/* ================================================================
   SETTINGS
   ================================================================ */

function saveSettings() {
  toast('Settings saved successfully!', 'ok');
}

/* ================================================================
   INJECT SHAKE ANIMATION
   ================================================================ */

(function injectKeyframes() {
  var style = document.createElement('style');
  style.textContent =
    '@keyframes loginOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-20px) scale(0.97)} }' +
    '@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }';
  document.head.appendChild(style);
})();

/* ================================================================
   INIT — runs on DOMContentLoaded
   ================================================================ */

document.addEventListener('DOMContentLoaded', function() {
  /* Ensure only login page is visible at start */
  document.getElementById('appShell').classList.add('hidden');

  /* Allow Enter on login inputs */
  ['loginUser','loginPass'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('keydown', loginKeydown);
  });
});