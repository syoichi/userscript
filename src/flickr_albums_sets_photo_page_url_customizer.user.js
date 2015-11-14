// ==UserScript==
// @name           Flickr Albums/Sets Photo Page URL Customizer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    customize photo page URL in Flickr Albums/Sets.
// @include        https://www.flickr.com/*
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

(function executeCustomizePhotoPageURL(doc, lc) {
  'use strict';

  let content = doc.querySelector('#content');

  // via https://gist.github.com/syoichi/3366491
  function nodeObserver(callback, options) {
    let hasOnly = options.addOnly || options.removeOnly;
    let each = Array.prototype.forEach;
    let nodesType = options.addOnly ? 'addedNodes' : 'removedNodes';

    function eachNodes(record) {
      function callWithInfo(node) {
        callback({
          node: node,
          record: record,
          options: options
        });
      }

      if (record.type === 'childList' && hasOnly) {
        each.call(record[nodesType], callWithInfo);
      } else {
        callWithInfo(null);
      }
    }

    let observer = new MutationObserver(mutations => {
      mutations.forEach(eachNodes);
    });

    observer.observe(options.target, options);

    return Object.assign(options, {
      observer: observer,
      callback: callback
    });
  }

  if (!content) {
    return;
  }

  nodeObserver(info => {
    let node = info.node;

    if (!(
      node.nodeType === Node.ELEMENT_NODE &&
        node.classList.contains('photo-list-photo-interaction') &&
        /^(?:album|set)s\/\d+(?:\/|$)/.test(
          lc.pathname.replace('/photos/', '').split('/').slice(1).join('/')
        )
    )) {
      return;
    }

    let link = node.querySelector('a.overlay');

    if (!link) {
      return;
    }

    let match = /^\/photos\/[^\/]+\/\d+/.exec(link.pathname);

    if (!match) {
      return;
    }

    link.pathname = match[0];
  }, {
    target: content,
    addOnly: true,
    childList: true,
    subtree: true
  });
}(document, location));
