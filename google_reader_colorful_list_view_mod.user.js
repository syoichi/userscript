// ==UserScript==
// @name           Google Reader Colorful List View Mod
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
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
        Firefox 14.0.1(Scriptish 0.1.7)
        Google Chrome 21.0.1180.75
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2012-08-11

(function executeColorfulListView(each, win, doc) {
    'use strict';

    var entries, style, colors, setColor, eachAddedNodes, recordsReader, MO;

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

    setColor = function setColor(target) {
        var targetClassList, title, titleLength, hue;

        targetClassList = target.classList;

        if (!targetClassList || !targetClassList.contains('entry')) {
            return;
        }

        title = target.querySelector('.entry-source-title');

        if (!title) {
            return;
        }

        title = title.textContent.replace(/\W/g, '-');
        target.setAttribute('colored', title);

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
    };

    eachAddedNodes = function eachAddedNodes(record) {
        each.call(record.addedNodes, setColor);
    };
    recordsReader = function recordsReader(callback) {
        return function eachRecords(records) {
            records.forEach(callback);
        };
    };

    MO = win.MutationObserver || win.WebKitMutationObserver;

    new MO(recordsReader(eachAddedNodes)).observe(
        entries,
        {childList: true}
    );
}(Array.prototype.forEach, window, document));
