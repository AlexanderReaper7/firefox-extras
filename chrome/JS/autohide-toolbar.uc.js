// ==UserScript==
// @name           Auto-hide Toolbar
// @description    Toolbar widget and Shift+F11 shortcut that toggle auto-hiding the browser chrome
// @author         AlexanderReaper7
// @version        1.3.0
// @homepageURL    https://github.com/AlexanderReaper7/firefox-extras
// ==/UserScript==

// Runs once per browser window: the root attribute, the menu tracking and the
// shortcut are per window. The widget is created by whichever window runs
// first, and CustomizableUI builds it into every window after that.
(function () {
  const WIDGET_ID = 'autohide-toolbar-widget';
  const PREF_NAME = 'userchrome.autohide-toolbar.enabled';
  const HELD_ATTR = 'data-autohide-held';
  const log = (...args) => console.log('[autohide-toolbar]', ...args);

  // On until the user turns it off: a profile without the pref, such as a new
  // deploy, starts with the chrome hidden. The user's choice of 2026-11-02.
  const isEnabled = () => Services.prefs.getBoolPref(PREF_NAME, true);
  const toggle = () => Services.prefs.setBoolPref(PREF_NAME, !isEnabled());

  function applyState() {
    const enabled = isEnabled();
    document.documentElement.toggleAttribute('data-autohide', enabled);
    const node = document.getElementById(WIDGET_ID);
    if (node) {
      node.checked = enabled;
    }
  }

  applyState();
  const observer = { observe: applyState };
  Services.prefs.addObserver(PREF_NAME, observer);
  window.addEventListener('unload', () => Services.prefs.removeObserver(PREF_NAME, observer), { once: true });

  // Menus and panels opened from the chrome mostly live in #mainPopupSet,
  // outside #navigator-toolbox, so moving the cursor onto one ends the
  // toolbox's :hover. While the chrome is revealed and any menu is open, mark
  // the toolbox as held so the CSS keeps it revealed until every menu closes.
  // A menu opened while the chrome is hidden, such as the page context menu,
  // does not reveal it.
  const toolbox = document.getElementById('navigator-toolbox');
  const openMenus = new Set();
  const isMenu = (popup) => popup.localName === 'menupopup' || popup.localName === 'panel';

  // Walks out of shadow trees too: a toolbar button's anchor is inside its
  // shadow root.
  function inToolbox(node) {
    for (; node; node = node.parentNode ?? node.host) {
      if (node === toolbox) {
        return true;
      }
    }
    return false;
  }

  window.addEventListener('popupshown', (e) => {
    const popup = e.originalTarget;
    if (!isMenu(popup)) {
      return;
    }
    openMenus.add(popup);
    // A context menu has already taken :hover from the toolbox by the time
    // popupshown fires, so a menu that was opened from the toolbox is
    // recognised by its anchor or trigger instead.
    if (inToolbox(popup.anchorNode) || inToolbox(popup.triggerNode) || toolbox.matches(':hover, :focus-within')) {
      toolbox.setAttribute(HELD_ATTR, '');
    }
  }, true);

  window.addEventListener('popuphidden', (e) => {
    openMenus.delete(e.originalTarget);
    // A popup removed from the document never fires popuphidden.
    for (const popup of openMenus) {
      if (!popup.isConnected || popup.state === 'closed') {
        openMenus.delete(popup);
      }
    }
    if (openMenus.size === 0) {
      toolbox.removeAttribute(HELD_ATTR);
    }
  }, true);

  // On Windows the top few pixels of a window that is not maximized, a snapped
  // one included, are its resize border, and resizing wins there over the page
  // (nsWindow::ClientMarginHitTestPoint). A pointer pushed against the top of
  // the screen sits in that border, so the handle under it never gets :hover.
  // Firefox does report the pointer leaving the window there, but the event
  // carries the last position inside the window, not the one in the border, so
  // the pointer's position is asked of Windows. A leave with the pointer in the
  // window's top hot zone marks the toolbox revealed until the pointer moves
  // inside the window again. A pointer that reaches the top edge from another
  // window, without crossing Firefox, sends Firefox nothing and does not
  // reveal it.
  const EDGE_ATTR = 'data-autohide-edge';
  if (AppConstants.platform === 'win') {
    let user32;
    const pointerInTopEdge = () => {
      if (!user32) {
        const { ctypes } = ChromeUtils.importESModule('resource://gre/modules/ctypes.sys.mjs');
        const lib = ctypes.open('user32.dll');
        const POINT = new ctypes.StructType('POINT', [{ x: ctypes.int32_t }, { y: ctypes.int32_t }]);
        const RECT = new ctypes.StructType('RECT', [
          { left: ctypes.int32_t },
          { top: ctypes.int32_t },
          { right: ctypes.int32_t },
          { bottom: ctypes.int32_t },
        ]);
        user32 = {
          POINT,
          RECT,
          hwnd: () => ctypes.voidptr_t(ctypes.UInt64(window.docShell.treeOwner.QueryInterface(Ci.nsIBaseWindow).nativeHandle)),
          GetCursorPos: lib.declare('GetCursorPos', ctypes.winapi_abi, ctypes.bool, POINT.ptr),
          GetWindowRect: lib.declare('GetWindowRect', ctypes.winapi_abi, ctypes.bool, ctypes.voidptr_t, RECT.ptr),
        };
      }
      const point = new user32.POINT();
      const rect = new user32.RECT();
      if (!user32.GetCursorPos(point.address()) || !user32.GetWindowRect(user32.hwnd(), rect.address())) {
        return false;
      }
      // Both in physical pixels; the hot zone is in CSS pixels.
      const hotZone =
        (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--autohide-hot-zone')) || 16) *
        window.devicePixelRatio;
      return (
        point.x >= rect.left && point.x < rect.right && point.y >= rect.top && point.y < rect.top + hotZone
      );
    };
    window.addEventListener('mouseout', (e) => {
      if (e.relatedTarget !== null) {
        return;
      }
      // When the leave is dispatched, GetCursorPos still returns the position
      // before the move that left the window (measured on Firefox 159), so the
      // cursor is read a moment later.
      setTimeout(() => {
        try {
          if (pointerInTopEdge()) {
            toolbox.setAttribute(EDGE_ATTR, '');
          }
        } catch (error) {
          log('top edge check failed:', error.message);
        }
      }, 50);
    }, true);
    window.addEventListener('mousemove', () => toolbox.removeAttribute(EDGE_ATTR), true);
  }

  // Give the toolbox the COSMIC panel's background: the theme's background
  // colour at the panel's opacity, read from the same config files the panel
  // reads. Read again whenever the window is focused, so a change made in
  // COSMIC Settings shows on the way back to Firefox. Anywhere these files
  // are missing, such as outside COSMIC, data-cosmic-panel stays unset and
  // the toolbox keeps Firefox's opaque background.
  const configDir =
    Services.env.get('XDG_CONFIG_HOME') || PathUtils.join(Services.dirsvc.get('Home', Ci.nsIFile).path, '.config');
  const readConfig = (component, version, key) =>
    IOUtils.readUTF8(PathUtils.join(configDir, 'cosmic', component, version, key)).then((text) => text.trim());

  async function readCosmicPanel() {
    // The panels COSMIC runs, in order. The first one is followed.
    const name = (await readConfig('com.system76.CosmicPanel', 'v1', 'entries')).match(/"([^"]+)"/)[1];
    const panel = `com.system76.CosmicPanel.${name}`;
    const opacity = parseFloat(await readConfig(panel, 'v1', 'opacity'));
    // A panel over a maximized window turns opaque unless this is set
    // (cosmic-panel space_container/toplevel.rs).
    const keepStyle = (await readConfig(panel, 'v1', 'keep_style_on_maximize')) === 'true';
    const background = await readConfig(panel, 'v1', 'background');

    // Color((r, g, b)) with channels from 0 to 1, or a theme.
    const custom = background.match(/^Color\(\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
    let color;
    if (custom) {
      const channels = custom.slice(1, 4).map((c) => parseFloat(c) * 100 + '%');
      color = `rgb(${channels.join(' ')})`;
    } else {
      const dark =
        background === 'Dark' ||
        (background !== 'Light' && (await readConfig('com.system76.CosmicTheme.Mode', 'v1', 'is_dark')) === 'true');
      // The theme's bg_color() is background.base, the first `base:` in the
      // file. Theme config version 2 is the one libcosmic reads.
      const themeId = dark ? 'com.system76.CosmicTheme.Dark' : 'com.system76.CosmicTheme.Light';
      const theme = await readConfig(themeId, 'v2', 'background');
      color = `#${theme.match(/base:\s*"#([0-9A-Fa-f]{6})/)[1]}`;
    }
    if (!(opacity >= 0 && opacity <= 1)) {
      throw new Error(`unreadable opacity ${opacity}`);
    }
    return { color, opacity, maximizedOpacity: keepStyle ? opacity : 1 };
  }

  async function applyCosmicPanel() {
    const root = document.documentElement;
    try {
      const { color, opacity, maximizedOpacity } = await readCosmicPanel();
      root.style.setProperty('--cosmic-panel-color', color);
      root.style.setProperty('--cosmic-panel-opacity', opacity);
      root.style.setProperty('--cosmic-panel-opacity-maximized', maximizedOpacity);
      root.setAttribute('data-cosmic-panel', '');
    } catch (e) {
      if (root.hasAttribute('data-cosmic-panel')) {
        log('COSMIC panel config unreadable, keeping Firefox background:', e.message);
      }
      root.removeAttribute('data-cosmic-panel');
    }
  }

  applyCosmicPanel();
  window.addEventListener('activate', applyCosmicPanel);

  // Reachable while the chrome is hidden, which the widget is not.
  UC_API.Hotkeys.define({
    id: 'key_autohideToolbarToggle',
    modifiers: 'shift',
    key: 'F11',
    command: toggle,
  }).attachToWindow(window);

  if (CustomizableUI.getWidget(WIDGET_ID)?.provider === CustomizableUI.PROVIDER_API) {
    return;
  }

  try {
    CustomizableUI.createWidget({
      id: WIDGET_ID,
      type: 'custom',
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: 'Auto-hide Toolbar',
      tooltiptext: 'Toggle auto-hide toolbar (Shift+F11)',

      onBuild(doc) {
        const node = doc.createXULElement('toolbarbutton');
        node.id = WIDGET_ID;
        node.setAttribute('label', 'Auto-hide Toolbar');
        node.setAttribute('tooltiptext', 'Toggle auto-hide toolbar (Shift+F11)');
        node.setAttribute('type', 'checkbox');
        node.setAttribute('class', 'toolbarbutton-1 chromeclass-toolbar-additional');
        node.checked = isEnabled();
        node.addEventListener('command', toggle);
        return node;
      },
    });
  } catch (e) {
    log('createWidget error:', e.message);
  }
})();
