// ==UserScript==
// @name           Twitter Link Replacer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.7
// @description    replace various link by any link in Twitter.
// @include        https://twitter.com/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 29.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80 */

(function executeReplaceLink(forEach, doc, lc) {
    'use strict';

    var pageContainer, sites, replacer, eachLinks;

    pageContainer = doc.getElementById('page-container');

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
                if (!this.urlRE.test(url)) {
                    return true;
                }

                link.href = url.replace(/(?::large)?$/, ':orig');
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
                    '(?:(?:.+?|o|gp|exec/obidos)/)?(?:dp|ASIN|product)' +
                    '(/(?:\\d{10}|B00[\\dA-Z]{7}))/'
            ),
            replaceLink: function forAmazon(link, url) {
                var frag = this.urlRE.exec(url);

                if (!frag) {
                    return true;
                }

                link.href = frag[1] + 'dp' + frag[2];
            }
        },
        'flic.kr': {
            urlRE: /^http:\/\/flic\.kr\/p\/[\da-zA-Z]+$/,
            replaceLink: function forFlickr(link, url) {
                var urlParser, linkData, replaceLinkURL;

                if (
                    !this.urlRE.test(url) ||
                        /^\/\w+\/statu(?:se)?s\/\d+$/.test(lc.pathname)
                ) {
                    return true;
                }

                urlParser = doc.createElement('a');
                linkData = link.dataset;
                replaceLinkURL = function replaceLinkURL() {
                    urlParser.href = linkData.ultimateUrl;

                    link.href = [
                        urlParser.protocol,
                        '//',
                        urlParser.host,
                        urlParser.pathname.replace(/\/?$/, '/sizes/o'),
                        urlParser.search,
                        urlParser.hash
                    ].join('');
                };

                if (linkData.ultimateUrl) {
                    replaceLinkURL();
                } else {
                    nodeObserver(function checkAttrName(info) {
                        info.options.observer.disconnect();

                        replaceLinkURL();
                    }, {
                        target: link,
                        attributes: true,
                        attributeFilter: ['data-ultimate-url']
                    });
                }
            }
        }
    };

    replacer = (function executeReturnFunc() {
        var urlParser;

        urlParser = doc.createElement('a');

        return function replacer(link) {
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

            urlParser.href = url;

            site = sites[urlParser.hostname];
            url = [
                urlParser.protocol,
                '//',
                urlParser.host,
                urlParser.pathname,
                urlParser.search,
                urlParser.hash
            ].join('');

            if (!site || site.replaceLink(link, url)) {
                link.href = url;
            }
        };
    }());
    eachLinks = function eachLinks(node) {
        forEach.call(
            node.querySelectorAll('.twitter-timeline-link, .link, .media'),
            replacer
        );
    };

    eachLinks(pageContainer);

    nodeObserver(function checkNodeData(info) {
        var node = info.node,
            target = info.record.target,
            nodeData = node.dataset,
            first = node.firstElementChild;

        if (
            (
                nodeData && (
                    /^(?:tweet|activity)$/.test(nodeData.itemType) ||
                        nodeData.cardType === 'photo' ||
                        nodeData.componentContext === 'conversation' ||
                        node.classList.contains('tweet-embed') ||
                        node.classList.contains('replies') ||
                        node.classList.contains('permalink') ||
                        node.id === 'timeline'
                )
            ) || (
                target.classList.contains('expanded-conversation') &&
                    node.tagName === 'LI' &&
                    first && (
                        first.dataset.componentContext === 'in_reply_to' ||
                        first.dataset.componentContext === 'replies'
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
    nodeObserver(function retryReplace(info) {
        replacer(info.mutation.target);
    }, {
        target: pageContainer,
        attributes: true,
        attributeFilter: ['data-ultimate-url'],
        subtree: true
    });
}(Array.prototype.forEach, document, location));
