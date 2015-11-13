// ==UserScript==
// @name           Feedly Cloud Colorful List View
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.3
// @description    colorize item headers in Feedly Cloud Title Only View.
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

(function executeColorfulListView(doc, forEach) {
  'use strict';

  let body = doc.body;
  let sheet = doc.head.appendChild(doc.createElement('style')).sheet;
  let cssRules = sheet.cssRules;
  let colors = {};
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

  function setColor(info) {
    let node = info.node;

    if (!(
      node.nodeType === Node.ELEMENT_NODE && node.classList.contains('u0Entry')
    )) {
      return;
    }

    let feedID = node.dataset.feedId = node.id.split(':')[0];

    if (typeof colors[feedID] !== 'undefined') {
      return;
    }

    let title = node.querySelector('.sourceTitle > a') ||
      doc.querySelector('#floatingTitleBar > a');

    if (!title) {
      return;
    }

    let str = title.textContent.trim().replace(/\W/g, '-');
    let hue = colors[feedID] = [...str].reduce(
      (num, char) => num + char.charCodeAt(),
      0
    );

    sheet.insertRule([
      `body.stretched #section0_column0 > [id^="${feedID}"] {`,
      `  background-color: hsl(${hue}, 70%, 80%) !important;`,
      '}'
    ].join(''), cssRules.length);
    sheet.insertRule([
      `body.stretched #section0_column0 > [id^="${feedID}"]:hover {`,
      `  background-color: hsl(${hue}, 90%, 85%) !important;`,
      '}'
    ].join(''), cssRules.length);
    sheet.insertRule([
      `body.stretched #section0_column0 > [id^="${feedID}"]` +
        '[style*="opacity"] {',
      `  background-color: hsl(${hue}, 50%, 90%) !important;`,
      '}'
    ].join(''), cssRules.length);
    sheet.insertRule([
      `body.stretched #section0_column0 > [id^="${feedID}"]` +
        '[style*="opacity"]:hover {',
      `  background-color: hsl(${hue}, 70%, 95%) !important;`,
      '}'
    ].join(''), cssRules.length);
  }

  function wrap(entry) {
    setColor({node: entry});
  }

  function getEntries(info) {
    let node = info.node;

    if (node.id !== 'section0_column0') {
      return;
    }

    forEach.call(node.children, wrap);

    if (sectionOptions) {
      sectionOptions.observer.disconnect();
    }

    sectionOptions = nodeObserver(setColor, {
      target: node,
      addOnly: true,
      childList: true
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
}(document, Array.prototype.forEach));
