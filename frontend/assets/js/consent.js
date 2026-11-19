/*
 * Cookie consent for vimpl.com.
 * Google Analytics loads only after the visitor clicks "Accept".
 * The choice is kept in localStorage ("vimpl_consent": "granted" | "denied").
 * Any element with [data-cookie-settings] reopens the banner; a
 * "Cookie settings" link is added to .footer-links on pages that have one.
 */
(function () {
  var GA_ID = 'G-G8B3MTE4X7';
  var KEY = 'vimpl_consent';
  var VERSION = '1'; // bump to ask everyone again after a change to the notice

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && v.version === VERSION ? v.choice : null;
    } catch (e) { return null; }
  }

  function write(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice: choice, version: VERSION, at: new Date().toISOString() }));
    } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  var gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function clearAnalyticsCookies() {
    var host = location.hostname;
    var domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        domains.forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  var CSS =
    '#vimpl-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;' +
    'background:#fff;color:#1f2937;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.15);' +
    'padding:18px 20px;font:14px/1.5 Inter,-apple-system,BlinkMacSystemFont,sans-serif}' +
    '#vimpl-consent p{margin:0 0 14px}' +
    '#vimpl-consent a{color:inherit;text-decoration:underline}' +
    '#vimpl-consent .vc-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
    '#vimpl-consent button{font:inherit;font-weight:600;border-radius:8px;padding:8px 16px;cursor:pointer;border:1px solid #1f2937}' +
    '#vimpl-consent .vc-decline{background:#fff;color:#1f2937}' +
    '#vimpl-consent .vc-accept{background:#1f2937;color:#fff}' +
    '#vimpl-consent button:focus-visible{outline:2px solid #2563eb;outline-offset:2px}';

  function showBanner() {
    if (document.getElementById('vimpl-consent')) return;
    if (!document.getElementById('vimpl-consent-css')) {
      var st = document.createElement('style');
      st.id = 'vimpl-consent-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.id = 'vimpl-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Cookie consent');
    box.innerHTML =
      '<p>We use one cookie to keep you signed in. With your consent we also use Google Analytics ' +
      'to count visits. <a href="privacy.html">Privacy notice</a></p>' +
      '<div class="vc-actions">' +
      '<button type="button" class="vc-decline">Decline</button>' +
      '<button type="button" class="vc-accept">Accept</button>' +
      '</div>';
    box.querySelector('.vc-accept').addEventListener('click', function () {
      write('granted');
      box.remove();
      loadAnalytics();
    });
    box.querySelector('.vc-decline').addEventListener('click', function () {
      var wasLoaded = gaLoaded || read() === 'granted';
      write('denied');
      box.remove();
      clearAnalyticsCookies();
      if (wasLoaded && gaLoaded) location.reload(); // stop the running tag
    });
    document.body.appendChild(box);
    box.querySelector('.vc-accept').focus({ preventScroll: true });
  }

  function addFooterLink() {
    var links = document.querySelector('.footer-links');
    if (!links || links.querySelector('[data-cookie-settings]')) return;
    var a = document.createElement('a');
    a.href = '#';
    a.className = 'footer-link';
    a.setAttribute('data-cookie-settings', '');
    a.textContent = 'Cookie settings';
    links.appendChild(a);
  }

  function init() {
    addFooterLink();
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); showBanner(); }
    });
    var choice = read();
    if (choice === 'granted') loadAnalytics();
    else if (choice !== 'denied') showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
