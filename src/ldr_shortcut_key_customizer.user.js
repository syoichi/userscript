// ==UserScript==
// @name           LDR Shortcut Key Customizer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.3
// @description    customize shortcut key in livedoor Reader.
// @include        http://reader.livedoor.com/reader/
// @run-at         document-end
// @grant          GM_openInTab
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 33.1.1(Greasemonkey 2.3)
*/

/* global GM_openInTab */

(function executeCustomizeKey(win, doc) {
  'use strict';

  var KEY, KEY_CODE, openInTab, modifiers;

  KEY = 'h';
  KEY_CODE = KEY.toUpperCase().charCodeAt();
  // jscs: disable requireCamelCaseOrUpperCaseIdentifiers
  openInTab = typeof GM_openInTab === 'function' ? GM_openInTab : null;
  // jscs: enable requireCamelCaseOrUpperCaseIdentifiers

  modifiers = {
    'Recent Commits to v8-git-mirror:master': {
      url: 'https://chromium.googlesource.com/v8/v8/+/',
      getURL: function forV8(hilight) {
        var hash = hilight.querySelector(
          '.item_info > a:first-child'
        ).href.split('/').slice(-1)[0];

        return this.url + hash;
      }
    }
  };

  function openInBackgroundTab(url) {
    var link;

    if (!win.chrome && openInTab) {
      openInTab(url, true);

      return;
    }

    link = doc.createElement('a');
    link.href = url;
    link.dispatchEvent(new MouseEvent('click', {button: 1}));
  }

  win.addEventListener('keydown', function openCustomizeLink(evt) {
    var fsReading, hilight, feedTitle, modifier, url;

    if (
      evt.keyCode !== KEY_CODE ||
        (evt.altKey || evt.ctrlKey || evt.shiftKey || evt.metaKey) ||
        (evt.target.tagName !== 'BODY')
    ) {
      return;
    }

    fsReading = doc.querySelector('.fs-reading');

    if (!fsReading) {
      return;
    }

    evt.stopImmediatePropagation();

    hilight = doc.querySelector('.hilight');

    if (!hilight) {
      return;
    }

    feedTitle = fsReading.textContent.trim().split(/ \(\d+\)/)[0];
    modifier = modifiers[feedTitle];

    if (modifier) {
      url = modifier.getURL(hilight);
    }

    if (!url) {
      url = hilight.querySelector('.item_info > a:first-child').href;
    }

    openInBackgroundTab(url);
  }, true);
}(window, document));
