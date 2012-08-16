// ==UserScript==
// @name           Google Reader Loaded Item Counter
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    show the number of loded itmes in Google Reader's Search.
// @include        http://www.google.com/reader/view/*
// @include        https://www.google.com/reader/view/*
// @include        http://www.google.co.jp/reader/view/*
// @include        https://www.google.co.jp/reader/view/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 14.0.1(Scriptish 0.1.7)
        Google Chrome 21.0.1180.79
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2012-08-11

(function executeLoadedItemCounter(doc) {
    'use strict';

    var searchInput, newItems, entries, items;

    // via https://gist.github.com/3366491
    function nodeObserver(callback, options) {
        var MO, hasOnly, each, nodesType;

        MO = window.MutationObserver || window.WebKitMutationObserver;
        hasOnly = options.addOnly || options.removeOnly;
        each = Array.prototype.forEach;
        nodesType = (options.addOnly ? 'add' : 'remov') + 'edNodes';

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
    }

    searchInput = doc.querySelector('#gbqfq, #search-input');
    newItems = doc.querySelector('#viewer-view-options > :first-child');
    entries = doc.getElementById('entries');

    if (!(searchInput && newItems && entries)) {
        return;
    }

    items = doc.getElementsByClassName('entry');

    nodeObserver(function itemsCounter() {
        var len;

        len = items.length;

        if (!len || len === Number(newItems.textContent.replace(/\D/g, ''))) {
            if (searchInput.placeholder) {
                searchInput.placeholder = '';
            }
        } else {
            searchInput.placeholder = len + ' items loaded.';
        }
    }, {
        target: entries,
        childList: true
    });
}(document));
