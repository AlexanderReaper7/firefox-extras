// ==UserScript==
// @name           Toolbar Clock
// @description    Shows current date and time as a customizable toolbar widget
// @author         AlexanderReaper7
// @version        2.1.0
// @homepageURL    https://github.com/AlexanderReaper7/firefox-extras
// @onlyonce
// ==/UserScript==

(function () {
  const { CustomizableUI } = ChromeUtils.importESModule(
    'resource:///modules/CustomizableUI.sys.mjs'
  );

  const WIDGET_ID = 'toolbar-clock-widget';

  // Avoid re-registering on script reload
  if (CustomizableUI.getWidget(WIDGET_ID)?.type !== 'custom') {
    CustomizableUI.createWidget({
      id: WIDGET_ID,
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: 'Clock',
      tooltiptext: 'Current date and time',

      onBuild(doc) {
        const node = doc.createXULElement('toolbaritem');
        node.id = WIDGET_ID;
        node.setAttribute('label', 'Clock');

        const label = doc.createXULElement('label');
        label.id = 'toolbar-clock-label';
        label.setAttribute('flex', '1');
        label.style.cssText = 'pointer-events: none; min-width: max-content;';
        node.appendChild(label);

        function update() {
          label.textContent = new Date().toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        }

        update();
        const intervalId = setInterval(update, 1000);
        doc.defaultView.addEventListener('unload', () => clearInterval(intervalId), { once: true });
        return node;
      },
    });
  }
})();
