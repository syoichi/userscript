// ==UserScript==
// @name           Chromium Git2SVN Redirector
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    redirect from chromium.googlesource.com to src.chromium.org about Chromium.
// @include        https://chromium.googlesource.com/chromium/src/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 31.0(Scriptish 0.1.12)
*/

(function executeChromiumGit2SVNRedirector(doc, lc) {
    'use strict';

    var commitMessage, text, revRE, rev, origin;

    if (!/^\/chromium\/src\/\+\/[\da-z]{40}$/.test(lc.pathname)) {
        return;
    }

    commitMessage = doc.querySelector('.commit-message');

    if (!commitMessage) {
        return;
    }

    text = commitMessage.textContent;
    revRE = new RegExp(
        '^git-svn-id:\\s+svn://svn\\.chromium\\.org/chrome/trunk/src@(\\d+)',
        'm'
    );
    rev = revRE.exec(text);

    if (!rev) {
        return;
    }

    origin = 'https://src.chromium.org';

    lc.assign(
        origin + '/viewvc/chrome?revision=' + rev[1] + '&view=revision'
    );
}(document, location));
