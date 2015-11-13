// ==UserScript==
// @name           Twitter Link Replacer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.14
// @description    replace various link by any link in Twitter.
// @include        https://twitter.com/*
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

(function executeReplaceLink(doc, forEach) {
  'use strict';

  let pageContainer = doc.getElementById('page-container');
  let sites;

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

  function getURLFromLink(link) {
    let linkData = link.dataset;

    for (let dataName of [
      'ultimateUrl', 'expandedUrl', 'resolvedUrlLarge', 'url'
    ]) {
      let data = linkData[dataName];

      if (data) {
        return data;
      }
    }

    return link.title;
  }

  function replacer(link) {
    let url = getURLFromLink(link);

    if (!url) {
      return;
    }

    let site = sites[(new URL(url)).hostname];

    if (site && site.replaceLink(link, url)) {
      return;
    }

    link.href = url;
  }

  function eachLinks(node) {
    forEach.call(
      node.querySelectorAll('.twitter-timeline-link'),
      replacer
    );
  }

  if (!pageContainer) {
    return;
  }

  sites = {
    'twitter.com': {
      urlRE: /^https?:\/\/twitter\.com\/\w+\/status(?:es)?\/\d+\/photo\/\d+$/,
      replaceLink: function forTwitter(link, url) {
        if (!this.urlRE.test(url)) {
          return false;
        }

        link.href = `${url}/large`;

        return true;
      }
    },
    'pbs.twimg.com': {
      urlRE: new RegExp(
        '^https?://pbs\\.twimg\\.com/media/[-\\w]+\\.(?:png|jpg)(?::large)?$'
      ),
      replaceLink: function forPbsTwimg(link, url) {
        if (!this.urlRE.test(url)) {
          return false;
        }

        link.href = url.replace(/(?::large)?$/, ':orig');

        return true;
      }
    },
    'gyazo.com': {
      urlRE: /^(https?:\/\/)(gyazo\.com\/[\da-f]{32}\.png)(?:\?\d+)?$/,
      replaceLink: function forGyazo(link, url) {
        let frag = this.urlRE.exec(url);

        if (!frag) {
          return false;
        }

        link.href = `${frag[1]}cache.${frag[2]}`;

        return true;
      }
    },
    'www.amazon.co.jp': {
      urlRE: new RegExp(
        '^(?:https?://(?:www\\.)?amazon\\.(?:co\\.)?jp/)' +
          '(?:(?:.+?|o|gp|exec/obidos)/)?' +
          '(?:dp|ASIN|product|aw(?:/d)?)' +
          '(/(?:\\d{10}|\\d{9}X|B0[\\dA-Z]{8}))(?:[/?]|%3F)?'
      ),
      replaceLink: function forAmazon(link, url) {
        let frag = this.urlRE.exec(url);

        if (!frag) {
          return false;
        }

        link.href = `http://www.amazon.co.jp/dp${frag[1]}`;

        return true;
      }
    },
    'www.flickr.com': {
      urlRE: /^https?:\/\/www\.flickr\.com\/photos\/[^\/]+\/\d+/,
      replaceLink: function forFlickr(link, url) {
        let frag = this.urlRE.exec(url);

        if (!frag) {
          return false;
        }

        link.href = `${frag[0]}/sizes/o`;

        return true;
      }
    },
    'flic.kr': {
      urlRE: /^https?:\/\/flic\.kr\/p\/[\da-zA-Z]+$/,
      replaceLink: function forFlickr(link, url) {
        if (!this.urlRE.test(url)) {
          return false;
        }

        link.href = `${url}/sizes/o`;

        return true;
      }
    }
  };

  sites['amazon.co.jp'] = sites['amazon.jp'] = sites['www.amazon.co.jp'];

  eachLinks(pageContainer);

  nodeObserver(info => {
    let node = info.node;

    if (node.nodeType !== Node.ELEMENT_NODE || !node.matches([
      '#timeline', '.permalink-container', '.ThreadedConversation-tweet',
      '.AppContainer', '[data-item-type="tweet"]', '[data-item-type="activity"]'
    ].join(', '))) {
      return;
    }

    eachLinks(node);
  }, {
    target: pageContainer,
    addOnly: true,
    childList: true,
    subtree: true
  });
}(document, Array.prototype.forEach));
