// ==UserScript==
// @name           GitHub Dashboard Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.3
// @description    record alert's datetime and load next page on GitHub Dashboard.
// @include        https://github.com/
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 31.0(Scriptish 0.1.12)
*/

/* global Range */

(function executeGitHubDashboardReader(win, doc) {
  'use strict';

  var news, buttons, markings, githubDatetime, opt;

  // via https://gist.github.com/syoichi/3366491
  function nodeObserver(callback, options) {
    var hasOnly, each, nodesType, observer;

    hasOnly = options.addOnly || options.removeOnly;
    each = Array.prototype.forEach;
    nodesType = options.addOnly ? 'addedNodes' : 'removedNodes';

    function eachNodes(record) {
      function callWithInfo(node) {
        callback({node: node, record: record, options: options});
      }

      if (record.type === 'childList' && hasOnly) {
        each.call(record[nodesType], callWithInfo);
      } else {
        callWithInfo(null);
      }
    }
    function eachMutations(mutations) {
      mutations.forEach(eachNodes);
    }

    observer = new window.MutationObserver(eachMutations);
    observer.observe(options.target, options);

    options.observer = observer;
    options.callback = callback;
    return options;
  }

  function $X(exp, context) {
    var root, result, len, idx, nodes;

    root = context ? context.ownerDocument : doc;
    result = root.evaluate(exp, (context || doc), null, 7, null);
    len = result.snapshotLength;

    for (idx = 0, nodes = []; idx < len; idx += 1) {
      nodes.push(result.snapshotItem(idx));
    }

    return nodes;
  }
  function getAlert(target) {
    return $X([
      './ancestor-or-self::',
      'div[contains(concat(" ", @class, " "), " alert ")]'
    ].join(''), target)[0];
  }
  function toggleMarking() {
    var time = news.querySelector([
      'div.time > time[datetime="' + githubDatetime + '"]',
      'div.time > local-time[datetime="' + githubDatetime + '"]'
    ].join(', '));

    if (time) {
      getAlert(time).classList.toggle('marking');

      return true;
    }
  }
  function deleteContents(first, end) {
    var range = new Range();

    range.setStartBefore(first);
    range.setEndAfter(end);

    return range.deleteContents();
  }

  news = doc.querySelector('.news');

  if (!news) {
    return;
  }

  doc.head.appendChild(doc.createElement('style')).textContent = [
    '.marking {',
    '  background-color: red !important;',
    '}'
  ].join('\n');

  markings = news.getElementsByClassName('marking');

  news.addEventListener('dblclick', function recordTime(evt) {
    var target, marking, alert, time, datetime;

    target = evt.target;

    if (target === news) {
      return;
    }

    win.getSelection().removeAllRanges();

    if (markings.length) {
      marking = markings[0];

      if (!marking.contains(target)) {
        marking.classList.remove('marking');
      }
    }

    alert = getAlert(target);

    if (!alert) {
      return;
    }

    alert.classList.toggle('marking');

    time = alert.querySelector('time, local-time');

    if (!time) {
      return;
    }

    datetime = time.getAttribute('datetime');

    localStorage.githubDatetime =
      localStorage.githubDatetime === datetime ? '' : datetime;
  });

  githubDatetime = localStorage.githubDatetime;

  if (!githubDatetime || toggleMarking()) {
    return;
  }

  buttons = news.getElementsByClassName('js-events-pagination');

  if (!buttons.length) {
    return;
  }

  opt = nodeObserver(function nextPageLoader(info) {
    var classes, first, end;

    classes = info.record.target.classList;

    if (classes.contains('loading') || !classes.contains('ajax_paginate')) {
      return;
    }

    if (!toggleMarking()) {
      buttons[0].click();

      return;
    }

    opt.observer.disconnect();

    first = markings[0].nextElementSibling;

    if (!first || first.classList.contains('pagination')) {
      return;
    }

    end = news.lastElementChild;

    if (end.classList.contains('pagination')) {
      end = end.previousElementSibling;
    }

    deleteContents(first, end);
  }, {
    target: news,
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });

  win.addEventListener('load', function delayClick() {
    buttons[0].click();
  });
}(window, document));
