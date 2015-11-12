// ==UserScript==
// @name           Gyazo Image Redirector
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    redirect Gyazo image.
// @include        http://gyazo.com/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

// via http://let.hatelabo.jp/taizooo/let/hLHUr72VjPlW
//     https://gist.github.com/syoichi/1033628
(function executeGyazoImageRedirector(doc, lc) {
  'use strict';

  var gyazoImg = doc.getElementById('gyazo_img');

  if (gyazoImg && /^\/[0-9a-f]{32}$/.test(lc.pathname)) {
    lc.href = gyazoImg.src;
  }
}(document, location));
