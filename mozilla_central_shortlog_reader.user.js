// ==UserScript==
// @name           mozilla-central shortlog Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    record hash and load next page and filter any commit message on mozilla-central shortlog.
// @include        https://hg.mozilla.org/mozilla-central/shortlog
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80 */

(function executeMcShortlogReader(win, doc, each) {
    'use strict';

    var shortlog, prefix, commits, colons, category, update, merge, misc,
        filterRE, markings, mozillaCentralHash, firstHashLink, firstNextLink;

    function hideCommit(commit) {
        var commitLog = commit.querySelector(
            'td:last-child > strong'
        ).textContent.trim().split(' - ').slice(1);

        if (/^Bug \d+$/i.test(commitLog[0]) && commitLog.length > 1) {
            commitLog = commitLog.slice(1);
        }

        if (filterRE.test(commitLog.join(' - '))) {
            commit.hidden = true;
        }
    }
    function $X(exp, context) {
        var root, result, len, idx, nodes;

        root = context ? context.ownerDocument : doc;
        result = root.evaluate(exp, (context || doc), null, 7, null);
        len = result.snapshotLength;

        for (idx = 0, nodes = []; idx < len; idx += 1) {
            nodes.push(result.snapshotItem(idx));
        }

        return nodes;
    }
    function request(url, listener) {
        var client = new XMLHttpRequest();

        client.addEventListener('load', listener);
        client.addEventListener('error', listener);

        client.open('GET', url);
        client.responseType = 'document';
        client.send();
    }
    function getTargetContents(first, target) {
        var range = doc.createRange();

        range.setStartBefore(first);
        range.setEndAfter(target);

        return range.extractContents();
    }

    shortlog = doc.querySelector('body > table > tbody');

    if (!shortlog) {
        return;
    }

    commits = shortlog.getElementsByTagName('tr');

    if (!commits.length) {
        return;
    }

    prefix = '^(?:(?:(?:Bug |b=)\\d+[,.:]? )+|No bug:?)?' +
        '(?:' +
        '(?:' +
        '(?:\\()?(?:Part|Patch)[ .]?\\d+(?:[a-z]+|/\\d+)?(?:\\))?|' +
        '(?:\\[)?\\d+/\\d+(?:\\])?' +
        ')' +
        '(?::| -)? ' +
        ')?' +
        '(?:';

    colons = [
        'ARM',
        'B2G(?: (?:[SM]MS|RIL|Multi-SIM|CDMA|Telephony|3G|DSDS|SMS & MMS|' +
            'BT|Bluetooth|NFC))?',
        'follow[\\- ]up',
        'Browser API',
        'WebTelephony',
        'SimplePush',
        'Rtsp',
        'Test',
        'ARM simulator',
        'MIPS port',
        'GTK'
    ].join('|');
    category = [
        'B2G(?: desktop)?',
        'b2g-ril',
        'gonk-jb',
        '[SM]MS',
        'MMI',
        'CDMA',
        'Bluetooth',
        'blue?droid(?: OPP)?',
        '(?:OPP )?cleanup',
        'Buri',
        'ACC',
        'WIFI(?:-hotspot)?',
        'Contacts API',
        'NetworkStats API',
        'Download API',
        'User Story',
        'Suplementary Services',
        'wasabi',
        'fig',
        'Marionette(?: Client)?',
        'Metro',
        'Linux',
        'Qt',
        'Messaging',
        'Messages',
        'HFP',
        'Dialer',
        'Flatfish',
        'RTSP',
        'keyboard'
    ].join('|');
    update = [
        '(?:bundled )?libpng',
        'libcubeb',
        'libvorbis',
        'libopus',
        'libvpx',
        'pdf\\.js',
        'vtt\\.js',
        'NS(?:S|PR)',
        'psutil',
        'talos(?:\\.json)?',
        'Add-?on[\\- ]SDK',
        'ANGLE',
        'base tests',
        'opus',
        'SQLite',
        'harfbuzz',
        'Shumway',
        'html5lib-tests',
        'nestegg',
        'CodeMirror',
        'Robotium',
        'freetype',
        'acorn',
        'Skia'
    ].join('|');
    merge = [
        '(?:(?:latest|last) )?(?:PGO-)?green',
        'backout',
        '(?:mozilla-)?central',
        '(?:(?:mozilla|b2g)-)?inbound',
        'm-[ci]',
        'b-i',
        'birch',
        '[fm]x-?team',
        'f-t',
        'b2g-i'
    ].join('|');
    misc = [
        'Revert',
        '(?:Speculatively )?Back(?:ed|ing)? ?out',
        'Clean ?ups?',
        'No bug, Automated',
        'Bumping gaia\\.json for',
        'Bumping manifests',
        'Test fix',
        'Tests? for',
        'Follow-up to fix build bustage on',
        'Fix (?:Mac )?bustage for',
        'Fix indentation in',
        'Fix #include ordering in',
        'Fix build',
        'Minor bustage fix',
        'Switch from NULL to nullptr in .*?[.;]',
        'Don\'t use NS_MEMORY_REPORTER_IMPLEMENT (?:for|in)',
        'Test(?:ing|s)?\\.',
        'followup, fix bustage in the wake of',
        '(?:Create )?(?:Mochi|Ref)tests? for',
        'Test case for',
        'Followup bustage fix for',
        'Bustage fix for',
        'Fix for intermittent',
        'Fix bustage',
        'Follow-up fix for bug \\d+',
        'Fix small bugs\\.',
        'Follow-up to fix bustage on a CLOSED TREE\\.',
        'Followup to fix bustage\\.',
        'tentative bustage fix',
        'Follow-up to fix bustage\\.',
        'Fix merge bustage\\.',
        'Attempted fix\\.',
        'Fix mach build --jobs\\.',
        'RIL implementation\\.',
        'Delete unused resources\\.',
        'fix windows build bustage\\.',
        'upload a new talos\\.zip file\\.'
    ].join('|');

    filterRE = new RegExp(prefix + [
        '(?:(?:' + colons + ') ?(?::| -)|' + misc + ') ',
        '(?:(?:\\[|\\()(?:' + category + ')(?:\\]|\\))| )+:?',
        '(?:Update|Upgrade|Uplift)(?: to)? (?:' + update + ')(?: source)?' +
            '(?: to (?:version|Firefox[. ])?)?',
        'Merge (?:' + merge + ')(?: (?:(?:in)?to|and) )?',
        '(?:Add(?:s|ed|ing)?|Fix(?:e[ds]|ing)?|Updat(?:e[sd]?|ing)) ' +
            '(?:(?:a|new|some) )?(?:mochi|(?:unit|xpcshell|more|crash) )?' +
            'tests?(?: (?:case|fixe?)s?)?(?: (?:for|to) |\\.|,)?',
        '(?:Add|Use?)(?:ed|s|ing)? NS_DECL_THREADSAFE_ISUPPORTS(?: in )?',
        'fix (?:leaks|bustage) on (?:a )?CLOSED TREE$',
        'Bustage follow-up\\.$',
        'Follow-?up fix(?:es) for bug \\d+[.,]',
        'Followup to fix build on a CLOSED TREE$',
        'Fix (?:Windows|ASAN) bustage on a CLOSED TREE$',
        'test for bug \\d+$',
        'Add reftest\\.',
        'Fix typo(?:\\.$|in test | )',
        'No bug: Make some whitespace changes on a CLOSED TREE\\.',
        'followup followup, fix followup bustage on a CLOSED TREE$',
        'crashtests for Bug \\d+',
        'Fixup tests\\.',
        'Update test case\\.',
        'Fixup for Bug \\d+\\.',
        'Crashtest for Bug \\d+(?:\\.)?$',
        'Followup to fix test bustage',
        '(?:Crash ?)?Tests?\\.$',
        'Bustage fix\\.$',
        'Added test case\\.$',
        'Build .*? in unified mode(?:[.; ]|$)',
        'merge(?: again)?$',
        '(?:Touch )?CLOBBER\\.(?: |$)',
        'build bustage$'
    ].join('|') + ')', 'i');

    each.call(commits, hideCommit);

    doc.head.appendChild(doc.createElement('style')).textContent = [
        '.marking {',
        '  background-color: red !important;',
        '}'
    ].join('\n');

    markings = doc.getElementsByClassName('marking');

    shortlog.addEventListener('dblclick', function recordHash(evt) {
        var target, marking, commit, hashLink, hash;

        target = evt.target;

        if (target === shortlog) {
            return;
        }

        win.getSelection().removeAllRanges();

        if (markings.length) {
            marking = markings[0];

            if (!marking.contains(target)) {
                marking.classList.remove('marking');
            }
        }

        commit = $X('./ancestor-or-self::tr', target)[0];

        if (!commit) {
            return;
        }

        commit.classList.toggle('marking');

        hashLink = commit.querySelector('.link > a');

        if (!hashLink) {
            return;
        }

        hash = hashLink.pathname.slice(21);

        if (localStorage.mozillaCentralHash === hash) {
            localStorage.mozillaCentralHash = '';
        } else {
            localStorage.mozillaCentralHash = hash;
        }
    });

    mozillaCentralHash = localStorage.mozillaCentralHash;

    if (!mozillaCentralHash) {
        return;
    }

    firstHashLink = shortlog.querySelector(
        'tr > .link > a[href$="/' + mozillaCentralHash + '"]'
    );

    if (firstHashLink) {
        firstHashLink.parentNode.parentNode.classList.toggle('marking');
        return;
    }

    firstNextLink = doc.querySelector('table + .page_nav > a:nth-child(9)');

    if (!firstNextLink) {
        return;
    }

    request(firstNextLink.href, function nextPageLoader(evt) {
        var client, response, nextShortlog, hashLink, commit, nextLink;

        client = evt.target;

        if (!/^(?:200|304)$/.test(client.status)) {
            win.alert(client.status + ' ' + client.statusText);

            return;
        }

        response = client.response;
        nextShortlog = response.querySelector('body > table > tbody');

        if (!nextShortlog) {
            return;
        }

        each.call(nextShortlog.getElementsByTagName('tr'), hideCommit);

        hashLink = nextShortlog.querySelector(
            'tr > .link > a[href$="/' + mozillaCentralHash + '"]'
        );

        if (hashLink) {
            commit = hashLink.parentNode.parentNode;
            commit.classList.toggle('marking');
            shortlog.appendChild(
                getTargetContents(nextShortlog.firstElementChild, commit)
            );

            return;
        }

        shortlog.insertAdjacentHTML('BeforeEnd', nextShortlog.innerHTML);

        nextLink = response.querySelector('table + .page_nav > a:nth-child(9)');

        if (!nextLink) {
            return;
        }

        request(nextLink.href, nextPageLoader);
    });
}(window, document, Array.prototype.forEach));
