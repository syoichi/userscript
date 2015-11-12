// ==UserScript==
// @name           Twitter Link Replacer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.13
// @description    replace various link by any link in Twitter.
// @include        https://twitter.com/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 34.0(Greasemonkey 2.3)
*/

(function executeReplaceLink(forEach, doc) {
  'use strict';

  var pageContainer, sites;

  pageContainer = doc.getElementById('page-container');

  // via https://gist.github.com/syoichi/3366491
  function nodeObserver(callback, options) {
    var hasOnly, each, nodesType, observer;

    hasOnly = options.addOnly || options.removeOnly;
    each = Array.prototype.forEach;
    nodesType = options.addOnly ? 'addedNodes' : 'removedNodes';

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

    function eachMutations(mutations) {
      mutations.forEach(eachNodes);
    }

    observer = new window.MutationObserver(eachMutations);
    observer.observe(options.target, options);

    options.observer = observer;
    options.callback = callback;

    return options;
  }

  function eachLinks(node) {
    forEach.call(
      node.querySelectorAll('.twitter-timeline-link, .link, .media'),
      replacer
    );
  }

  function replacer(link) {
    var linkData, url, img, site;

    linkData = link.dataset;
    url = linkData.ultimateUrl || linkData.expandedUrl ||
      linkData.resolvedUrlLarge || linkData.url || link.title;

    if (!url) {
      if (link.childElementCount !== 1 || link.target) {
        return;
      }

      img = link.querySelector('img');

      if (img) {
        url = img.src;
      }
    }

    site = sites[(new URL(url)).hostname];

    if (!site || site.replaceLink(link, url)) {
      link.href = url;
    }
  }

  if (!pageContainer) {
    return;
  }

  sites = {
    'twitter.com': {
      urlRE: new RegExp(
        '^https?://twitter\\.com/\\w+/status(?:es)?/\\d+/photo/\\d+$'
      ),
      replaceLink: function forTwitter(link, url) {
        if (!this.urlRE.test(url)) {
          return true;
        }

        link.href = url + '/large';
      }
    },
    'pbs.twimg.com': {
      urlRE: new RegExp(
        '^https?://pbs\\.twimg\\.com/media/[-\\w]+\\.(?:png|jpg)' +
          '(?::large)?$'
      ),
      replaceLink: function forPbsTwimg(link, url) {
        var img, range, anchor;

        if (!this.urlRE.test(url)) {
          return true;
        }

        if (link.tagName === 'A') {
          link.href = url.replace(/(?::large)?$/, ':orig');
        } else {
          img = link.querySelector('img:only-child');

          if (!img) {
            return false;
          }

          range = doc.createRange();
          anchor = doc.createElement('a');

          anchor.href = url.replace(/(?::large)?$/, ':orig');

          range.selectNode(img);
          range.surroundContents(anchor);
        }
      }
    },
    'twitpic.com': {
      urlRE: /^https?:\/\/twitpic\.com\/[\da-zA-Z]+$/,
      replaceLink: function forTwitpic(link, url) {
        if (!this.urlRE.test(url)) {
          return true;
        }

        link.href = url + '/full';
      }
    },
    'gyazo.com': {
      urlRE: /^(http:\/\/)(gyazo\.com\/[\da-f]{32}\.png)(?:\?\d+)?$/,
      replaceLink: function forGyazo(link, url) {
        var frag = this.urlRE.exec(url);

        if (!frag) {
          return true;
        }

        link.href = frag[1] + 'cache.' + frag[2];
      }
    },
    'yfrog.com': {
      urlRE: /^(https?:\/\/)(yfrog\.com\/)([\da-zA-Z]+)$/,
      replaceLink: function forYfrog(link, url) {
        var frag = this.urlRE.exec(url);

        if (!frag) {
          return true;
        }

        link.href = frag[1] + 'twitter.' + frag[2] + 'z/' + frag[3];
      }
    },
    'www.amazon.co.jp': {
      urlRE: new RegExp(
        '^(https?://www.amazon.co.jp/)' +
          '(?:(?:.+?|o|gp|exec/obidos)/)?' +
          '(?:dp|ASIN|product|aw(?:/d)?)' +
          '(/(?:\\d{10}|\\d{9}X|B00[\\dA-Z]{7}))(?:[/?]|%3F)?'
      ),
      replaceLink: function forAmazon(link, url) {
        var frag = this.urlRE.exec(url);

        if (!frag) {
          return true;
        }

        link.href = frag[1] + 'dp' + frag[2];
      }
    },
    'www.flickr.com': {
      urlRE: /^https?:\/\/www\.flickr\.com\/photos\/.+\/\d+(?:\/)?$/,
      replaceLink: function forFlickr(link, url) {
        if (!this.urlRE.test(url)) {
          return true;
        }

        link.href = url.replace(/(?:\/)?$/, '/sizes/o');
      }
    },
    'flic.kr': {
      urlRE: /^https?:\/\/flic\.kr\/p\/[\da-zA-Z]+$/,
      replaceLink: function forFlickr(link, url) {
        if (!this.urlRE.test(url)) {
          return true;
        }

        link.href = url + '/sizes/o';
      }
    }
  };

  eachLinks(pageContainer);

  nodeObserver(function checkNodeData(info) {
    var node = info.node,
      first = node.firstElementChild;

    if (
      node.nodeType === Node.ELEMENT_NODE && (
        node.matches([
          '#timeline',
          '.tweet-embed', '.replies', '.permalink', '.AppContainer',
          '[data-item-type="tweet"]',
          '[data-item-type="activity"]',
          '[data-card-type="photo"]',
          '[data-component-context="conversation"]',
          '[data-component-term="tweet"]'
        ].join(', ')) || (
          node.matches([
            '.expanded-conversation > li',
            'ol.stream-items > li[class]'
          ].join(', ')) && first && first.matches([
            '[data-component-context="in_reply_to"]',
            '[data-component-context="replies"]'
          ].join(', '))
        )
      )
    ) {
      eachLinks(node);
    }
  }, {
    target: pageContainer,
    addOnly: true,
    childList: true,
    subtree: true
  });
}(Array.prototype.forEach, document));
