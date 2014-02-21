// ==UserScript==
// @name           LDR Shortcut Key Customizer
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    customize shortcut key in livedoor Reader.
// @include        http://reader.livedoor.com/reader/
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80, camelcase: false */
/* global GM_openInTab, MouseEvent */

(function executeCustomizeKey(win, doc) {
    'use strict';

    var KEY, KEY_CODE, openInTab, modifiers;

    KEY = 'h';
    KEY_CODE = KEY.toUpperCase().charCodeAt();
    openInTab = typeof GM_openInTab === 'function' ? GM_openInTab : null;

    modifiers = {
        'git.chromium.org Git - chromium.git/rss log': {
            RE: new RegExp(
                'svn://svn\\.chromium\\.org/chrome/trunk/src@(\\d+)'
            ),
            url: 'https://src.chromium.org/viewvc/chrome?view=rev&revision=',
            getURL: function forChromium(hilight) {
                var match = this.RE.exec(
                    hilight.querySelector('pre').textContent
                );

                if (!match) {
                    return null;
                }

                return this.url + match[1];
            }
        },
        'Recent Commits to v8:master': {
            RE: new RegExp(
                'https://v8\\.googlecode\\.com/svn/branches/bleeding_edge@' +
                    '(\\d+)'
            ),
            url: 'https://code.google.com/p/v8/source/detail?r=',
            getURL: function forV8(hilight) {
                var match = this.RE.exec(
                    hilight.querySelector('pre:last-child').textContent
                );

                if (!match) {
                    return null;
                }

                return this.url + match[1];
            }
        }
    };

    function openInBackgroundTab(url) {
        var link;

        if (!win.chrome && openInTab) {
            openInTab(url, true);
            return;
        }

        link = doc.createElement('a');
        link.href = url;
        link.dispatchEvent(new MouseEvent('click', {button: 1}));
    }

    win.addEventListener('keydown', function openCustomizeLink(evt) {
        var fsReading, hilight, feedTitle, modifier, url;

        if (
            evt.keyCode !== KEY_CODE ||
                (evt.altKey || evt.ctrlKey || evt.shiftKey || evt.metaKey) ||
                (evt.target.tagName !== 'BODY')
        ) {
            return;
        }

        fsReading = doc.querySelector('.fs-reading');

        if (!fsReading) {
            return;
        }

        evt.stopImmediatePropagation();

        hilight = doc.querySelector('.hilight');

        if (!hilight) {
            return;
        }

        feedTitle = fsReading.textContent.trim().split(/ \(\d+\)/)[0];
        modifier = modifiers[feedTitle];

        if (modifier) {
            url = modifier.getURL(hilight);
        }

        if (!url) {
            url = hilight.querySelector('.item_info > a').href;
        }

        openInBackgroundTab(url);
    }, true);
}(window, document));
