/* ============================================================================
 * Violentmonkey API shim for running "Bypass All Shortlinks (Debloated)"
 * inside the LinkBypass Pro bot's Playwright browser (Layer 5).
 *
 * This file MUST be injected BEFORE bypass_all_shortlinks.js in the same
 * page context (e.g. via page.add_init_script(shim + userscript)).
 * ========================================================================== */
'use strict';

/* userscript managers expose the real window as `unsafeWindow`.
 * In Playwright's main world, `window` IS the real window. */
var unsafeWindow = window;

/* ---- Settings store (the userscript's MonkeyConfig UI is not needed in
 * a bot; we just return sane defaults for every setting it reads). ---- */
function MonkeyConfig(opts) { this.opts = opts || {}; }
MonkeyConfig.prototype.get = function (key) {
  var defaults = {
    AutoDL: false,      // never auto-download files in the bot; we want URLs
    YTDown: false,
    Flickr: false,
    SameTab: true,      // open bypassed links in the same tab
    BlogDelay: false,
    SetDelay: 5,
    TDelay: 1000,
    TimerFC: false,
    RightFC: false,
    BlockFC: false,
    BlockPop: false,
    AntiDebug: false,
    Audio: false,
    YTShort: false,
    Adblock: false,
    Prompt: false,
    Anima: false,
    hCaptcha: false
  };
  if (Object.prototype.hasOwnProperty.call(defaults, key)) return defaults[key];
  return false;
};
MonkeyConfig.prototype.getValue = MonkeyConfig.prototype.get;
MonkeyConfig.prototype.set = function () {};
MonkeyConfig.prototype.setup = function () {};

var __gm_store = {};
function GM_getValue(key, def) {
  return Object.prototype.hasOwnProperty.call(__gm_store, key) ? __gm_store[key] : def;
}
function GM_setValue(key, val) { __gm_store[key] = val; }
function GM_registerMenuCommand() { /* no settings UI in the bot */ }
function GM_addStyle(css) {
  try {
    var s = document.createElement('style');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { /* ignore */ }
}
function GM_setClipboard() { /* clipboard not needed in the bot */ }

/* In the bot we always want same-tab navigation so the final URL can be
 * read from page.url. */
function GM_openInTab(url) {
  try { window.location.href = url; } catch (e) { /* ignore */ }
}

/* GM_xmlhttpRequest -> fetch. The userscript only ever reads
 * response.responseText / response.response / response.status. */
function GM_xmlhttpRequest(details) {
  details = details || {};
  var method = (details.method || 'GET').toUpperCase();
  var headers = details.headers || {};
  var body = null;
  if (details.data !== undefined && details.data !== null) {
    if (typeof details.data === 'string') {
      body = details.data;
    } else {
      try {
        body = JSON.stringify(details.data);
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      } catch (e) { body = String(details.data); }
    }
  }
  fetch(details.url, {
    method: method,
    headers: headers,
    body: body,
    credentials: 'include'
  }).then(function (resp) {
    return resp.text().then(function (text) {
      var data = text;
      try { data = JSON.parse(text); } catch (e) { /* keep raw text */ }
      var headerStr = '';
      try {
        resp.headers.forEach(function (v, k) { headerStr += k + ': ' + v + '\r\n'; });
      } catch (e) { /* ignore */ }
      if (details.onload) {
        try {
          details.onload({
            status: resp.status,
            responseText: text,
            response: data,
            responseHeaders: headerStr,
            finalUrl: resp.url
          });
        } catch (e) { /* ignore handler errors */ }
      }
    });
  }).catch(function (err) {
    if (details.onerror) { try { details.onerror(err); } catch (e) { /* ignore */ } }
  });
}
