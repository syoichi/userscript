// ==UserScript==
// @name           LDR Shortcut Key Customizer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.5
// @description    customize shortcut key in Live Dwango Reader.
// @include        http://reader.livedoor.com/reader/
// @run-at         document-end
// @grant          GM_openInTab
// ==/UserScript==

/* User Script info
license: CC0 1.0 Universal
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 43.0.4(Greasemonkey 3.6)
*/

/* global GM_openInTab */

(function executeCustomizeKey(win, doc) {
  'use strict';

  let gmOpenInTab = typeof GM_openInTab === 'function' ? GM_openInTab : null;

  function openInTab(url, isBackground) {
    if (!url) {
      return;
    }

    if (!win.chrome && gmOpenInTab) {
      gmOpenInTab(url, Boolean(isBackground));

      return;
    }

    let link = Object.assign(doc.createElement('a'), {
      href: url
    });

    if (isBackground) {
      link.dispatchEvent(new MouseEvent('click', {
        button: 1
      }));

      return;
    }

    Object.assign(link, {
      target: '_blank'
    }).dispatchEvent(new MouseEvent('click'));
  }

  function getEntryURL() {
    let url;
    let hilight = doc.querySelector('.hilight');

    if (hilight) {
      url = hilight.querySelector('.item_info > a:first-child').href;
    }

    return url || '';
  }

  function getHatenaBookmarkURL() {
    let url;
    let hilight = doc.querySelector('.hilight');

    if (hilight) {
      let link = hilight.querySelector(
        '.item_body > .body > blockquote > p:last-child > ' +
          'a[href^="http://b.hatena.ne.jp/entry/"]'
      );

      if (link) {
        url = link.href;
      }
    }

    return url || '';
  }

  function reloadImg(img) {
    if (img.complete && img.naturalHeight !== 0 && img.naturalWidth !== 0) {
      return;
    }

    let {src} = img;

    img.src = 'about:blank';

    img.src = src;
  }

  let infoList = [{
    shortcutKeys: [['h']],
    transact: function openLinkInBackgroundTab() {
      openInTab(getEntryURL(), true);
    }
  }, {
    shortcutKeys: [['b']],
    transact: function openHatenaBookmarkLink() {
      openInTab(getHatenaBookmarkURL());
    }
  }, {
    shortcutKeys: [['l']],
    transact: function openHatenaBookmarkLinkInBackgroundTab() {
      openInTab(getHatenaBookmarkURL(), true);
    }
  }, {
    shortcutKeys: [['i']],
    transact: function reloadFeedItemImage() {
      for (let img of doc.querySelectorAll('.item_body img')) {
        reloadImg(img);
      }
    }
  }, {
    shortcutKeys: [
      ['Shift', 'Control', 'Shift'], ['Control', 'Shift', 'Control']
    ],
    transact: function noOperation() {
      return null;
    }
  }];

  let Utils = {
    checkModifierKeys(evt, modifierKeys) {
      for (let modifierKey of modifierKeys) {
        if (!evt.getModifierState(modifierKey)) {
          return false;
        }
      }

      return true;
    },
    isMatchedModifierState(evt, modifierKey, modifierKeys) {
      let state = evt.getModifierState(modifierKey);

      return state && modifierKeys.indexOf(modifierKey) !== -1 ||
        !state && modifierKeys.indexOf(modifierKey) === -1;
    },
    isMatchedModifierStates(evt, modifierKeys) {
      for (let modifierKey of ['Control', 'Shift', 'Alt']) {
        if (!Utils.isMatchedModifierState(evt, modifierKey, modifierKeys)) {
          return false;
        }
      }

      return true;
    },
    checkModifierStates(evt, modifierKeys) {
      return modifierKeys[0] === 'Accel' ?
        evt.getModifierState('Accel') && Utils.checkModifierKeys(
          evt,
          modifierKeys.splice(1, modifierKeys.length)
        ) :
        Utils.isMatchedModifierStates(evt, modifierKeys);
    },
    checkShortcutKeys(evt, shortcutKeys) {
      for (let shortcutKey of shortcutKeys) {
        let arr = shortcutKey.slice();

        if (arr.pop() === evt.key && Utils.checkModifierStates(evt, arr)) {
          return true;
        }
      }

      return false;
    },
    handleShortcutKeys(evt, shortcutKeyInfoList, context) {
      for (let {shortcutKeys, transact} of shortcutKeyInfoList) {
        if (Utils.checkShortcutKeys(evt, shortcutKeys)) {
          transact.call(context, evt);

          return true;
        }
      }

      return false;
    }
  };

  win.addEventListener('keydown', evt => {
    if (
      evt.target.tagName !== 'BODY' ||
        !Utils.handleShortcutKeys(evt, infoList, null)
    ) {
      return;
    }

    evt.stopImmediatePropagation();

    if (evt.defaultPrevented) {
      return;
    }

    evt.preventDefault();
  }, true);
}(window, document));
