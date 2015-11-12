// ==UserScript==
// @name           Gyazo Image Redirector
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    redirect Gyazo image.
// @include        https://gyazo.com/*
// @run-at         document-end
// @grant          none
// ==/UserScript==

/* User Script info
license: CC0 1.0 Universal
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 42.0(Greasemonkey 3.5)
    Google Chrome 46.0.2490.86
*/

// via http://let.hatelabo.jp/taizooo/let/hLHUr72VjPlW
//     https://gist.github.com/syoichi/1033628
(function executeGyazoImageRedirector(doc, lc) {
  'use strict';

  if (!/^\/[0-9a-f]{32}$/.test(lc.pathname)) {
    return;
  }

  let image = doc.querySelector('.image');

  if (!image) {
    return;
  }

  lc.href = image.src;
}(document, location));
