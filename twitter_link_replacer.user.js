// ==UserScript==
// @name           Twitter Link Replacer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.3
// @description    replace various link by any link in Twitter.
// @include        http://twitter.com/*
// @include        https://twitter.com/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 18.0.1(Scriptish 0.1.8)
        Google Chrome 24.0.1312.57
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2013-02-02

(function executeReplaceLink(each, doc, lc) {
    'use strict';

    var pageContainer, sites, replacer, eachLinks;

    pageContainer = doc.getElementById('page-container');

    // via https://gist.github.com/3366491
    function nodeObserver(callback, options) {
        var MO, hasOnly, each, nodesType;

        MO = window.MutationObserver || window.WebKitMutationObserver;
        hasOnly = options.addOnly || options.removeOnly;
        each = Array.prototype.forEach;
        nodesType = (options.addOnly ? 'add' : 'remov') + 'edNodes';
        options.callback = callback;

        function eachNodes(mutation) {
            function callWithInfo(node) {
                callback({node: node, mutation: mutation, options: options});
            }

            if (mutation.type === 'childList' && hasOnly) {
                each.call(mutation[nodesType], callWithInfo);
            } else {
                callWithInfo(null);
            }
        }

        (options.observer = new MO(function eachMutations(mutations) {
            mutations.forEach(eachNodes);
        })).observe(options.target, options);
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
                '^https?://pbs\\.twimg\\.com/media/[-\\w]+\\.(?:png|jpg)$'
            ),
            replaceLink: function forPbsTwimg(link, url) {
                if (!this.urlRE.test(url)) {
                    return true;
                }

                link.href = url + ':large';
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
            urlRE: /^(http:\/\/)(gyazo\.com\/[\da-f]{32})(?:\.png)?(?:\?\d+)?$/,
            replaceLink: function forGyazo(link, url) {
                var frag;

                frag = this.urlRE.exec(url);

                if (!frag) {
                    return true;
                }

                link.href = frag[1] + 'cache.' + frag[2] + '.png';
            }
        },
        'yfrog.com': {
            urlRE: /^(https?:\/\/)(yfrog\.com\/)([\da-zA-Z]+)$/,
            replaceLink: function forYfrog(link, url) {
                var frag;

                frag = this.urlRE.exec(url);

                if (!frag) {
                    return true;
                }

                link.href = frag[1] + 'twitter.' + frag[2] + 'z/' + frag[3];
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
            url = linkData.ultimateUrl || linkData.expandedUrl || link.title;

            if (!url) {
                if (link.childElementCount === 1 && !link.target) {
                    img = link.querySelector('img');

                    if (img) {
                        url = img.src;
                    }
                } else {
                    return;
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
        each.call(
            node.querySelectorAll('.twitter-timeline-link, .link'),
            replacer
        );
    };

    eachLinks(pageContainer);

    nodeObserver(function checkNodeData(info) {
        var node = info.node,
            nodeData = node.dataset;

        if (
            nodeData && (
                /^(?:tweet|activity)$/.test(nodeData.itemType) ||
                    nodeData.cardType === 'photo' ||
                    nodeData.componentContext === 'conversation' ||
                    node.classList.contains('tweet-embed') ||
                    node.classList.contains('replies') ||
                    node.classList.contains('permalink') ||
                    node.id === 'timeline'
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
