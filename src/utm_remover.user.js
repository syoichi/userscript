// ==UserScript==
// @name           UTM Remover
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    remove UTM Tags Parameter.
// @include        http://*
// @include        https://*
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

// via https://twitter.com/edvakf/status/55164349974708224
(function executeUTMRemover(lc) {
  'use strict';

  let search = lc.search;

  if (!search) {
    return;
  }

  let cleanedSearch = search.slice(1).split('&').filter(
    param => !/^utm[-_]/.test(param)
  ).join('&');

  if (search.slice(1) === cleanedSearch) {
    return;
  }

  history.replaceState(null, '', Object.assign(new URL(lc.href), {
    search: cleanedSearch
  }).href.replace(lc.origin, ''));
}(location));
