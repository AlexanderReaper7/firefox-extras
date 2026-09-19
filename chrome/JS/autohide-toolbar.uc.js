// ==UserScript==
// @name           Auto-hide Toolbar
// @description    Toolbar widget that toggles auto-hiding the browser chrome
// @author         AlexanderReaper7
// @version        1.0.0
// @homepageURL    https://github.com/AlexanderReaper7/firefox-extras
// @onlyonce
// ==/UserScript==

(function () {
  const WIDGET_ID = 'autohide-toolbar-widget';
  const PREF_NAME = 'userchrome.autohide-toolbar.enabled';
  const log = (...args) => console.log('[autohide-toolbar]', ...args);

  log('script executing');

  let enabled = Services.prefs.getBoolPref(PREF_NAME, false);

  function applyState(doc, state) {
    if (state) {
      doc.documentElement.setAttribute('data-autohide', '');
    } else {
      doc.documentElement.removeAttribute('data-autohide');
    }
  }

  function syncAllWindows(state) {
    for (const win of Services.wm.getEnumerator('navigator:browser')) {
      applyState(win.document, state);
      const node = win.document.getElementById(WIDGET_ID);
      if (node) {
        node.checked = state;
      }
    }
  }

  // Apply persisted state immediately on startup
  applyState(document, enabled);

  try {
    CustomizableUI.createWidget({
      id: WIDGET_ID,
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: 'Auto-hide Toolbar',
      tooltiptext: 'Toggle auto-hide toolbar',

      onBuild(doc) {
        log('onBuild called for', doc.location.href);
        const node = doc.createXULElement('toolbarbutton');
        node.id = WIDGET_ID;
        node.setAttribute('label', 'Auto-hide Toolbar');
        node.setAttribute('tooltiptext', 'Toggle auto-hide toolbar');
        node.setAttribute('type', 'checkbox');
        node.setAttribute('class', 'toolbarbutton-1 chromeclass-toolbar-additional');
        node.checked = enabled;

        // Ensure the state is applied to this window when the widget is built
        applyState(doc, enabled);

        node.addEventListener('command', () => {
          enabled = !enabled;
          Services.prefs.setBoolPref(PREF_NAME, enabled);
          syncAllWindows(enabled);
          log('toggled to', enabled);
        });

        log('onBuild complete, returning node');
        return node;
      },
    });
    log('createWidget succeeded');
  } catch (e) {
    log('createWidget error:', e.message);
  }
})();
