// ==UserScript==
// @name           Toolbar Clock
// @description    Shows current date and time as a customizable toolbar widget
// @author         AlexanderReaper7
// @version        2.8.0
// @homepageURL    https://github.com/AlexanderReaper7/firefox-extras
// @onlyonce
// ==/UserScript==

(function () {
  const WIDGET_ID = 'toolbar-clock-widget';
  const log = (...args) => console.log('[toolbar-clock]', ...args);

  log('script executing, calling createWidget');

  try {
    CustomizableUI.createWidget({
      id: WIDGET_ID,
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: 'Clock',
      tooltiptext: 'Current date and time',

      onBuild(doc) {
        log('onBuild called for', doc.location.href);
        const node = doc.createXULElement('toolbaritem');
        node.id = WIDGET_ID;
        node.setAttribute('label', 'Clock');
        node.setAttribute('align', 'center');

        const label = doc.createXULElement('label');
        label.id = 'toolbar-clock-label';
        label.setAttribute('flex', '1');
        label.style.cssText = 'pointer-events: none; min-width: max-content; color: inherit;';
        node.appendChild(label);

        function update() {
          const d = new Date();
          const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const seconds = String(d.getSeconds()).padStart(2, '0');
          label.textContent = `${weekday}, ${year}-${month}-${day}, ${hours}:${minutes}:${seconds}`;
        }

        update();
        const intervalId = setInterval(update, 1000);
        doc.defaultView.addEventListener(
          'unload',
          () => {
            log('window unloading, clearing interval');
            clearInterval(intervalId);
          },
          { once: true }
        );
        log('onBuild complete, returning node');
        return node;
      },
    });
    log('createWidget succeeded');
  } catch (e) {
    log('createWidget error:', e.message);
  }
})();
