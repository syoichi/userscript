// ==UserScript==
// @name           Google Reader add kept unread and read link in Navigation
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    add kept unread and read link in Google Reader's Navigation.
// @include        http://www.google.com/reader/view/*
// @include        https://www.google.com/reader/view/*
// @include        http://www.google.co.jp/reader/view/*
// @include        https://www.google.co.jp/reader/view/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 14.0.1(Scriptish 0.1.7)
        Google Chrome 21.0.1180.79
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2012-08-11

(function executeAddLink(doc) {
    'use strict';

    var directorySelector;

    directorySelector = doc.getElementById('directory-selector');

    if (!directorySelector) {
        return;
    }

    directorySelector.insertAdjacentHTML('AfterEnd', [
        '<div class="selector no-icon">',
        '  <a',
        '    href="#stream/user/-/state/com.google/kept-unread"',
        '    class="link"',
        '  >',
        '    <span class="text">kept unread</span>',
        '  </a>',
        '</div>',
        '<div class="selector no-icon">',
        '  <a href="#stream/user/-/state/com.google/read" class="link">',
        '    <span class="text">read</span>',
        '  </a>',
        '</div>'
    ].join('\n'));
}(document));
