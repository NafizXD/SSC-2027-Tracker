/*!
 * update-loader.js · SSC Tracker dynamic update channel · v1.1
 * ------------------------------------------------------------------
 * v1.0 : fetches updateindex.html and injects HTML/CSS/JS at runtime.
 * v1.1 : + ADMIN TEST-MODE GUARD — when the database is NOT configured
 *        (cloud-config.js missing / empty), the sign-in overlay is
 *        unlocked synchronously (same parse tick, no visible flash)
 *        so you can test the HTML with NO login. When the database IS
 *        configured, this guard does nothing and the public never sees
 *        any admin UI (updateindex.html handles the hidden admin access).
 *
 * ONE-TIME HOOK (paste once in index.html, just before </body>):
 *   <div id="update-slot"></div>
 *   <script src="update-loader.js"></script>
 */

/* ==== PACK 1.1 · ADMIN TEST-MODE GUARD (synchronous, runs before first paint) ==== */
(function () {
  'use strict';
  var cfg = window.ORBIT_CLOUD_CONFIG;
  var configured = !!(cfg && cfg.supabaseUrl && cfg.supabaseAnonKey);

  window.SSC_DB_CONFIGURED  = configured;
  window.SSC_ADMIN_TEST_MODE = !configured;   // refined later by the updateindex.html reachability probe

  /* Unlock the app UI without any login (direct DOM, never depends on app internals). */
  window.SSC_ADMIN_UNLOCK = function () {
    var overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('auth-locked');
    var sidebar = document.getElementById('sidebar');
    var main    = document.getElementById('main');
    if (sidebar) sidebar.inert = false;
    if (main)    main.inert    = false;
  };

  if (window.SSC_ADMIN_TEST_MODE) {
    window.SSC_ADMIN_UNLOCK();                                   // initCloud() already ran → hide it now
    document.addEventListener('DOMContentLoaded', window.SSC_ADMIN_UNLOCK);
    window.addEventListener('load', window.SSC_ADMIN_UNLOCK);   // belt & braces
  }
})();

/* ==== UPDATE CHANNEL LOADER (v1.0 logic, unchanged) ==== */
(function () {
  'use strict';

  var CONFIG = {
    url: 'updateindex.html',   // file that holds ALL update sections
    slotId: 'update-slot',     // container div inside index.html
    cacheBust: true            // always ask the server for the newest pack
  };

  var selfTag = document.currentScript;
  if (selfTag && selfTag.dataset) {
    if (selfTag.dataset.updateUrl)  CONFIG.url    = selfTag.dataset.updateUrl;
    if (selfTag.dataset.updateSlot) CONFIG.slotId = selfTag.dataset.updateSlot;
  }

  if (typeof fetch !== 'function') {
    console.warn('[update-loader] fetch() not supported – update channel disabled.');
    return;
  }

  function getSlot() {
    var slot = document.getElementById(CONFIG.slotId);
    if (!slot) {
      slot = document.createElement('div');
      slot.id = CONFIG.slotId;
      document.body.appendChild(slot);
    }
    return slot;
  }

  /* Move <style> and stylesheet <link> tags into <head> so CSS applies. */
  function hoistAssets(updateDoc) {
    updateDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(function (node) {
      document.head.appendChild(node);
    });
  }

  /* Cloned <script> tags never execute – recreate them so they run. */
  function runScripts(scope) {
    scope.querySelectorAll('script').forEach(function (deadScript) {
      var live = document.createElement('script');
      Array.prototype.forEach.call(deadScript.attributes, function (attr) {
        live.setAttribute(attr.name, attr.value);
      });
      live.text = deadScript.textContent || '';
      deadScript.parentNode.replaceChild(live, deadScript);
    });
  }

  function load() {
    var sep = CONFIG.url.indexOf('?') > -1 ? '&' : '?';
    var url = CONFIG.url + (CONFIG.cacheBust ? sep + 'v=' + Date.now() : '');

    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
        return res.text();
      })
      .then(function (html) {
        var updateDoc = new DOMParser().parseFromString(html, 'text/html');
        var slot = getSlot();

        hoistAssets(updateDoc);
        var frag = document.createDocumentFragment();
        Array.prototype.forEach.call(updateDoc.body.children, function (el) {
          frag.appendChild(document.importNode(el, true));
        });
        slot.appendChild(frag);
        runScripts(slot);

        document.dispatchEvent(new CustomEvent('updates:loaded', {
          detail: { url: CONFIG.url }
        }));
        console.info('[update-loader] loaded ' + CONFIG.url);
      })
      .catch(function (err) {
        console.warn('[update-loader] update channel skipped (' + err.message + ')');
        document.dispatchEvent(new CustomEvent('updates:error', {
          detail: { error: String(err) }
        }));
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
