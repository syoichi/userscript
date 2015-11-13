// ==UserScript==
// @name           Hatena Bookmark hide same title comment
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    hide same title comment in Hatena Bookmark.
// @include        http://b.hatena.ne.jp/entry/*
// @include        http://b.hatena.ne.jp/entry?eid=*
// @include        http://b.hatena.ne.jp/entry?url=*
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

// inspired by http://let.hatelabo.jp/pacochi/let/gYC-xNPqhbauPQ
//             https://gist.github.com/teramako/4554515

(function executeHideComment(doc) {
  'use strict';

  let publicBookmarks = doc.getElementById('public-bookmarks');

  if (!publicBookmarks) {
    return;
  }

  let title = doc.getElementById('head-entry-link').textContent.trim();

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

  function wrap(str, prefix, suffix) {
    return prefix == null ?
      str :
      prefix + str + (suffix == null ? prefix : suffix);
  }

  function hideComment(comment) {
    let commentText = comment.textContent.trim();

    if (!(
      commentText.indexOf(title) === 0 || title.includes(commentText) ||
        [['“', '”'], ['"'], ['\''], ['「', '」']].some(brackets =>
          wrap(title, ...brackets) === commentText
        )
    )) {
      return;
    }

    comment.closest('li[data-user]').hidden = true;
  }

  Array.prototype.forEach.call(
    doc.querySelectorAll('.bookmark-list > :not(.nocomment) .comment'),
    hideComment
  );

  if (!publicBookmarks) {
    return;
  }

  nodeObserver(info => {
    let bookmark = info.node;

    if (bookmark.tagName !== 'LI' || bookmark.classList.contains('nocomment')) {
      return;
    }

    let comment = bookmark.querySelector('.comment');

    if (!comment) {
      return;
    }

    hideComment(comment);
  }, {
    target: publicBookmarks,
    addOnly: true,
    childList: true,
    subtree: true
  });
}(document));
