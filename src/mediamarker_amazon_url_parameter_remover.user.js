// ==UserScript==
// @name           MediaMarker Amazon URL Parameter Remover
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    remove Amazon URL's parameter on MediaMarker.
// @include        http://mediamarker.net/*
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

(function executeRemoveAmazonURLParameter(doc) {
  'use strict';

  let re = new RegExp(
    '^(?:https?://(?:www\\.)?amazon\\.(?:co\\.)?jp/)' +
      '(?:(?:.+?|o|gp|exec/obidos)/)?' +
      '(?:dp|ASIN|product|aw(?:/d)?)' +
      '(/(?:\\d{10}|\\d{9}X|B0[\\dA-Z]{8}))(?:[/?]|%3F)?'
  );

  for (let link of Array.from(doc.links)) {
    let frag = re.exec(link.href);

    if (frag) {
      link.href = `http://www.amazon.co.jp/dp${frag[1]}`;
    }
  }
}(document));
