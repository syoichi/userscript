// ==UserScript==
// @name           Feedly Cloud Colorful List View
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    colorize item headers in Feedly Cloud Title Only View.
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

(function executeColorfulListView(doc, forEach) {
    'use strict';

    var body = doc.body,
        style = doc.head.appendChild(doc.createElement('style')),
        sheet = style.sheet,
        cssRules = sheet.cssRules,
        colors = {},
        feedlyPageOptions,
        sectionOptions;

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

    function getHueFromFeedTitle(feedTitle) {
        var idx, len, hue = 0;

        for (idx = 0, len = feedTitle.length; idx < len; idx += 1) {
            hue += feedTitle[idx].charCodeAt();
        }

        return hue % 360;
    }
    function setColor(info) {
        var node, nodeClassList, feedID, title, hue;

        node = info.node;
        nodeClassList = node.classList;

        if (!(nodeClassList && nodeClassList.contains('u0Entry'))) {
            return;
        }

        feedID = node.dataset.feedId = node.id.split(':')[0];

        if (colors[feedID] !== undefined) {
            return;
        }

        title = node.querySelector('.sourceTitle > a') ||
            doc.querySelector('#floatingTitleBar > a');

        if (!title) {
            return;
        }

        hue = colors[feedID] = getHueFromFeedTitle(
            title.textContent.trim().replace(/\W/g, '-')
        );

        sheet.insertRule([
            'body.streched #section0_column0 > [id^="' + feedID + '"] {',
            '  background-color: hsl(' + hue + ', 70%, 80%) !important;',
            '}'
        ].join(''), cssRules.length);
        sheet.insertRule([
            'body.streched #section0_column0 > [id^="' + feedID + '"]:hover {',
            '  background-color: hsl(' + hue + ', 90%, 85%) !important;',
            '}'
        ].join(''), cssRules.length);
        sheet.insertRule([
            'body.streched #section0_column0 > [id^="' + feedID + '"]' +
                '[style*="opacity"] {',
            '  background-color: hsl(' + hue + ', 50%, 90%) !important;',
            '}'
        ].join(''), cssRules.length);
        sheet.insertRule([
            'body.streched #section0_column0 > [id^="' + feedID + '"]' +
                '[style*="opacity"]:hover {',
            '  background-color: hsl(' + hue + ', 70%, 95%) !important;',
            '}'
        ].join(''), cssRules.length);
    }
    function wrap(entry) {
        setColor({node: entry});
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
}(document, Array.prototype.forEach));
