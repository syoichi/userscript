// ==UserScript==
// @name           Hatena Bookmark Counter for Feedly Cloud
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    show Hatena Bookmark Counter Image of Hatena Bookmark Hot Entry Items in Feedly Cloud Title Only View.
// @include        http://feedly.com/*
// @include        https://feedly.com/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Feedly Cloud 17.12:
        Windows 7 Home Premium SP1 64bit:
            Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2014-02-06

(function executeShowHatenaBookmarkCounter(doc) {
    'use strict';

    var body, feedlyPageOptions, sectionOptions;

    body = doc.body;

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

    function addCounter(info) {
        var node = info.node;

        if (/^http:\/\/b\.hatena\.ne\.jp\/entry\/image\//.test(node.src)) {
            info.record.target.appendChild(node);
        }
    }

    nodeObserver(function getFeedlyPage(info) {
        var feedlyCenter = info.node;

        if (
            feedlyCenter.id === 'feedlyCenter' && (
                !body.classList.contains('notlogged') ||
                    body.getAttribute('_pageid') === 'null'
            )
        ) {
            if (feedlyPageOptions) {
                feedlyPageOptions.observer.disconnect();
            }

            feedlyPageOptions = nodeObserver(function getEntries(info) {
                var node = info.node;

                if (node.id === 'section0_column0') {
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
            }, {
                target: doc.getElementById('feedlyPage'),
                addOnly: true,
                childList: true,
                subtree: true
            });
        }
    }, {
        target: body,
        addOnly: true,
        childList: true
    });
}(document));
