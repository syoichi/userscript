// ==UserScript==
// @name           Hatena Bookmark hide same title comment
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    hide same title comment in Hatena Bookmark.
// @include        http://b.hatena.ne.jp/entry/*
// @include        http://b.hatena.ne.jp/entry?eid=*
// @include        http://b.hatena.ne.jp/entry?url=*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 22.0(Scriptish 0.1.11)
    Google Chrome 28.0.1500.72
*/

// inspired by http://let.hatelabo.jp/pacochi/let/gYC-xNPqhbauPQ
//             https://gist.github.com/teramako/4554515

(function executeHideComment(doc) {
  'use strict';

  var publicBookmarks, title;

  publicBookmarks = doc.getElementById('public-bookmarks');

  if (!publicBookmarks) {
    return;
  }

  title = doc.getElementById('head-entry-link').textContent.trim();

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

  function hideComment(comment) {
    var commentText = comment.textContent.trim();

    if (
      commentText.indexOf(title) === 0 ||
        title.indexOf(commentText) !== -1 ||
        '“' + title + '”' === commentText ||
        '"' + title + '"' === commentText ||
        '\'' + title + '\'' === commentText ||
        '「' + title + '」' === commentText
    ) {
      doc.evaluate('./ancestor::li[@data-user]', comment, null, 9, null)
        .singleNodeValue.hidden = true;
    }
  }

  Array.prototype.forEach.call(
    doc.querySelectorAll(
      '.bookmark-list > :not(.nocomment) .comment'
    ),
    hideComment
  );

  if (publicBookmarks) {
    nodeObserver(function getComment(info) {
      var bookmark = info.node,
        comment;

      if (
        bookmark.tagName === 'LI' &&
          !bookmark.classList.contains('nocomment')
      ) {
        comment = bookmark.querySelector('.comment');

        if (comment) {
          hideComment(comment);
        }
      }
    }, {
      target: publicBookmarks,
      addOnly: true,
      childList: true,
      subtree: true
    });
  }
}(document));
