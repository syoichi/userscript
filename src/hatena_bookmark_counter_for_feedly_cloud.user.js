// ==UserScript==
// @name           Hatena Bookmark Counter for Feedly Cloud
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    show Hatena Bookmark Counter Image of Hatena Bookmark Hot Entry Items in Feedly Cloud Title Only View.
// @include        http://feedly.com/*
// @include        https://feedly.com/*
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

(function executeShowHatenaBookmarkCounter(doc) {
  'use strict';

  let body = doc.body;
  let feedlyPageOptions;
  let sectionOptions;

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

  function addCounter(info) {
    let node = info.node;

    if (!/^http:\/\/b\.hatena\.ne\.jp\/entry\/image\//.test(node.src)) {
      return;
    }

    info.record.target.appendChild(node);
  }

  function getEntries(info) {
    let node = info.node;

    if (node.id !== 'section0_column0') {
      return;
    }

    if (sectionOptions) {
      sectionOptions.observer.disconnect();
    }

    sectionOptions = nodeObserver(addCounter, {
      target: node,
      removeOnly: true,
      childList: true,
      subtree: true
    });
  }

  nodeObserver(info => {
    let feedlyCenter = info.node;

    if (
      feedlyCenter.id !== 'feedlyCenter' ||
        body.classList.contains('notlogged') &&
        body.getAttribute('_pageid') !== 'null'
    ) {
      return;
    }

    if (feedlyPageOptions) {
      feedlyPageOptions.observer.disconnect();
    }

    feedlyPageOptions = nodeObserver(getEntries, {
      target: doc.getElementById('feedlyPage'),
      addOnly: true,
      childList: true,
      subtree: true
    });
  }, {
    target: body,
    addOnly: true,
    childList: true
  });
}(document));
