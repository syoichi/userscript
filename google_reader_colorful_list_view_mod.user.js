// ==UserScript==
// @name           Google Reader Colorful List View Mod
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    colorize item headers in Google Reader List view.
// @include        http://www.google.com/reader/view/*
// @include        https://www.google.com/reader/view/*
// @include        http://www.google.co.jp/reader/view/*
// @include        https://www.google.co.jp/reader/view/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
via http://userscripts.org/scripts/show/35041
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 14.0.1(Scriptish 0.1.7)
        Google Chrome 21.0.1180.79
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2012-08-11

(function executeColorfulListView(doc) {
    'use strict';

    var entries, style, colors;

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

    entries = doc.getElementById('entries');

    if (!entries) {
        return;
    }

    style = doc.head.appendChild(doc.createElement('style'));
    colors = {};

    style.textContent = [
        '.collapsed {',
        '  border-color: transparent !important;',
        '}',
        '#current-entry.expanded > .collapsed {',
        '  border-bottom-width: 2px !important;',
        '}',
        ''
    ].join('\n');

    nodeObserver(function setColor(info) {
        var node, nodeClassList, title, titleLength, hue;

        node = info.node;
        nodeClassList = node.classList;

        if (!(nodeClassList && nodeClassList.contains('entry'))) {
            return;
        }

        title = node.querySelector('.entry-source-title');

        if (!title) {
            return;
        }

        title = title.textContent.replace(/\W/g, '-');
        node.setAttribute('colored', title);

        if (colors[title] !== void 0) {
            return;
        }

        titleLength = title.length;
        hue = 0;

        while (titleLength) {
            hue += title[titleLength -= 1].charCodeAt();
        }

        colors[title] = hue %= 360;

        style.textContent += [
            '',
            '[colored="' + title + '"],',
            '[colored="' + title + '"] > .collapsed {',
            '  background-color: hsl(' + hue + ', 70%, 80%) !important;',
            '}',
            '[colored="' + title + '"]:hover,',
            '[colored="' + title + '"]:hover > .collapsed {',
            '  background-color: hsl(' + hue + ', 90%, 85%) !important;',
            '}',
            '.read[colored="' + title + '"],',
            '.read[colored="' + title + '"] > .collapsed {',
            '  background-color: hsl(' + hue + ', 50%, 90%) !important;',
            '}',
            '.read[colored="' + title + '"]:hover,',
            '.read[colored="' + title + '"]:hover > .collapsed {',
            '  background-color: hsl(' + hue + ', 70%, 95%) !important;',
            '}',
            ''
        ].join('\n');
    }, {
        target: entries,
        addOnly: true,
        childList: true
    });
}(document));
