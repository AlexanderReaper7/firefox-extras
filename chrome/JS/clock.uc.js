// ==UserScript==
// @name           Toolbar Clock
// @description    Shows current date and time in the Firefox toolbar (right of address bar)
// @author         AlexanderReaper7
// @version        1.0.0
// @homepageURL    https://github.com/AlexanderReaper7/firefox-extras
// ==/UserScript==

(function () {
  const navbar = document.getElementById('nav-bar');
  if (!navbar) return;

  const clock = document.createXULElement('label');
  clock.id = 'toolbar-clock';
  clock.setAttribute('flex', '0');

  // Insert to the right of the address bar
  navbar.appendChild(clock);

  function update() {
    const now = new Date();
    clock.textContent = now.toLocaleString(undefined, {
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
  setInterval(update, 1000);
})();
