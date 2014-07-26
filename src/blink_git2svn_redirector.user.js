// ==UserScript==
// @name           Blink Git2SVN Redirector
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    redirect from chromium.googlesource.com to src.chromium.org about Blink.
// @include        https://chromium.googlesource.com/chromium/blink/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 31.0(Scriptish 0.1.12)
*/

/* jshint maxlen: 80 */

(function executeBlinkGit2SVNRedirector(doc, lc) {
    'use strict';

    var commitMessage, text, revRE, rev, origin;

    if (!/^\/chromium\/blink\/\+\/[\da-z]{40}$/.test(lc.pathname)) {
        return;
    }

    commitMessage = doc.querySelector('.commit-message');

    if (!commitMessage) {
        return;
    }

    text = commitMessage.textContent;
    revRE = /^git-svn-id:\s+svn:\/\/svn\.chromium\.org\/blink\/trunk@(\d+)/m;
    rev = revRE.exec(text);

    if (!rev) {
        return;
    }

    origin = 'https://src.chromium.org';

    lc.assign(
        origin + '/viewvc/blink?revision=' + rev[1] + '&view=revision'
    );
}(document, location));
