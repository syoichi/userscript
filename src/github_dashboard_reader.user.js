// ==UserScript==
// @name           GitHub Dashboard Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.4
// @description    record alert's datetime and load next page on GitHub Dashboard.
// @include        https://github.com/
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

(function executeGitHubDashboardReader(win, doc) {
  'use strict';

  let news = doc.querySelector('.news');
  let markings;
  let githubDatetime;

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

  function removeMarking(target) {
    if (markings.length) {
      let marking = markings[0];

      if (!marking.contains(target)) {
        marking.classList.remove('marking');
      }
    }
  }

  function toggleMarking(target) {
    if (!target) {
      return null;
    }

    let alertElm = target.closest('.alert');

    if (!alertElm) {
      return null;
    }

    alertElm.classList.toggle('marking');

    return alertElm;
  }

  function getTime(target) {
    return target ?
      target.querySelector('time, local-time') :
      news.querySelector([
        `div.time > time[datetime="${githubDatetime}"]`,
        `div.time > local-time[datetime="${githubDatetime}"]`
      ].join(', '));
  }

  function deleteContents(first, end) {
    let range = new Range();

    range.setStartBefore(first);
    range.setEndAfter(end);

    return range.deleteContents();
  }

  if (!news) {
    return;
  }

  function removeUnneededAlerts() {
    let first = markings[0].nextElementSibling;

    if (!first || first.classList.contains('pagination')) {
      return;
    }

    let end = news.lastElementChild;

    deleteContents(
      first,
      end.classList.contains('pagination') ? end.previousElementSibling : end
    );
  }

  doc.head.appendChild(doc.createElement('style')).textContent = [
    '.marking {',
    '  background-color: red !important;',
    '}'
  ].join('\n');

  markings = news.getElementsByClassName('marking');

  news.addEventListener('dblclick', evt => {
    let target = evt.target;

    if (target === news) {
      return;
    }

    win.getSelection().removeAllRanges();

    removeMarking(target);

    let alertElm = toggleMarking(target);

    if (!alertElm) {
      return;
    }

    let time = getTime(alertElm);

    if (!time) {
      return;
    }

    let datetime = time.getAttribute('datetime');

    localStorage.githubDatetime =
      localStorage.githubDatetime === datetime ? '' : datetime;
  });

  githubDatetime = localStorage.githubDatetime;

  if (!githubDatetime || toggleMarking(getTime())) {
    return;
  }

  let buttons = news.getElementsByClassName('js-events-pagination');

  if (!buttons.length) {
    return;
  }

  nodeObserver(info => {
    let classes = info.record.target.classList;

    if (classes.contains('loading') || !classes.contains('ajax_paginate')) {
      return;
    }

    if (!toggleMarking(getTime())) {
      buttons[0].click();

      return;
    }

    info.options.observer.disconnect();

    removeUnneededAlerts();
  }, {
    target: news,
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });

  win.addEventListener('load', () => {
    buttons[0].click();
  });
}(window, document));
