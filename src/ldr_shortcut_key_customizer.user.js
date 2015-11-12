// ==UserScript==
// @name           LDR Shortcut Key Customizer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.4
// @description    customize shortcut key in Live Dwango Reader.
// @include        http://reader.livedoor.com/reader/
// @run-at         document-end
// @grant          GM_openInTab
// ==/UserScript==

/* User Script info
license: CC0 1.0 Universal
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 42.0(Greasemonkey 3.5)
*/

/* global GM_openInTab */

(function executeCustomizeKey(win, doc) {
  'use strict';

  const KEY = 'h';
  const KEY_CODE = KEY.toUpperCase().charCodeAt();

  let openInTab = typeof GM_openInTab === 'function' ? GM_openInTab : null;
  let modifiers = {};

  function isTarget(evt) {
    return evt.keyCode === KEY_CODE &&
      !(evt.altKey || evt.ctrlKey || evt.shiftKey || evt.metaKey) &&
      evt.target.tagName === 'BODY';
  }

  function getEntryURL(evt) {
    let fsReading = doc.querySelector('.fs-reading');

    if (!fsReading) {
      return '';
    }

    evt.stopImmediatePropagation();

    let hilight = doc.querySelector('.hilight');

    if (!hilight) {
      return '';
    }

    let feedTitle = fsReading.textContent.trim().split(/ \(\d+\)/)[0];
    let modifier = modifiers[feedTitle];
    let url;

    if (modifier) {
      url = modifier.getURL(hilight);
    }

    if (!url) {
      url = hilight.querySelector('.item_info > a:first-child').href;
    }

    return url;
  }

  function openInBackgroundTab(url) {
    if (!win.chrome && openInTab) {
      openInTab(url, true);

      return;
    }

    let link = Object.assign(doc.createElement('a'), {
      href: url
    });

    link.dispatchEvent(new MouseEvent('click', {
      button: 1
    }));
  }

  win.addEventListener('keydown', evt => {
    if (!isTarget(evt)) {
      return;
    }

    let url = getEntryURL(evt);

    if (!url) {
      return;
    }

    openInBackgroundTab(url);
  }, true);
}(window, document));
