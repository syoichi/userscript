// ==UserScript==
// @name           GitHub Dashboard AutoPager
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    automatically load a next page in GitHub Dashboard.
// @include        https://github.com/
// @include        https://github.com/dashboard/index/*
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

(function executeAutoPager(win, doc) {
    'use strict';

    var BASE_REMAIN_HEIGHT, news, enabledClick, opt;

    BASE_REMAIN_HEIGHT = 450;

    news = doc.querySelector('.news');

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

    if (!news) {
        return;
    }

    enabledClick = true;

    opt = nodeObserver(function enableClick(info) {
        var classList;

        classList = info.mutation.target.classList;

        if (
            classList.contains('ajax_paginate') &&
                !classList.contains('loading') &&
                !enabledClick
        ) {
            enabledClick = true;
        }
    }, {
        target: news,
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });
    win.addEventListener('scroll', function clickButton() {
        var button, remainHeight;

        button = news.querySelector('.ajax_paginate > a');

        if (!button) {
            win.removeEventListener('scroll', clickButton);
            opt.observer.disconnect();
            return;
        }

        remainHeight = button.getBoundingClientRect().top - win.innerHeight;

        if (BASE_REMAIN_HEIGHT > remainHeight && enabledClick) {
            enabledClick = false;
            button.click();
        }
    });
}(window, document));
