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
        Mozilla Firefox 29.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80 */

(function executeMcShortlogReader(win, doc, each) {
    'use strict';

    var shortlog, prefix, commits, colons, category, update, merge, fix, misc,
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
    function request(url, callback) {
        var client = new XMLHttpRequest();

        function listener(evt) {
            if (/^(?:200|304)$/.test(client.status)) {
                callback(client.response, evt);
            } else {
                window.alert(client.status + ' ' + client.statusText);
            }
        }

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
        '(?:\\()?(?:Part|Patch)[ .]?[\\da-z]+(?:/\\d+)?(?:\\))?|' +
        '(?:\\[)?\\d+/\\d+(?:\\])?' +
        ')' +
        '(?: ?[\\-:,])? ' +
        ')?' +
        '(?:';

    colons = [
        'GTK(?:\\d+)?',
        '(?:IonMonkey )?MIPS(?: port)?',
        'ARM(?: simulator)?',
        'B2G(?: (?:[SM]MS|RIL|Multi-SIM|CDMA|Telephony|3G|DSDS|SMS & MMS|' +
            'BT|Bluetooth|NFC))?',
        'NFC',
        'Browser API',
        'WebTelephony',
        'SimplePush',
        'Rtsp',
        'Test',
        'Fix ASSERTION',
        'Assertion failure',
        'follow[\\- ]?up',
        'Win8',
        'Refactor',
        'Bustage fix'
    ].join('|');
    category = [
        'Metro',
        'Mac',
        'OSX',
        'Linux',
        'GTK(?:\\d+)?',
        'Qt',
        'B2G(?:[\\- ](?:desktop|ril))?',
        'mobile',
        'Flame',
        'NFC',
        'gonk-jb',
        '[SM]MS',
        'MMI',
        'CDMA',
        'Bluetooth(?:\\d+)?',
        'blue?droid(?: OPP)?',
        '(?:OPP )?cleanup',
        'Buri',
        'Tarako',
        'ACC',
        'WIFI(?:-hotspot)?',
        '(?:Contacts|NetworkStats|Download) API',
        'User Story',
        'Suplementary Services',
        'wasabi',
        'fig',
        'Marionette(?: Client)?',
        'Messag(?:ing|es)',
        'HFP',
        'Dialer',
        'Flatfish',
        'RTSP',
        'keyboard',
        'mozrunner',
        'mozcrash',
        'mozversion',
        'mozlog',
        'mozdevice',
        'mozprofile',
        'Camera',
        'Roku',
        'dolphin',
        'TPS',
        'MTP',
        'MobileID',
        'MobileMessage'
    ].join('|');
    update = [
        '(?:(?:bundled|in-tree) )?' +
            'lib(?:png|cubeb|vorbis|opus|vpx|jpeg-turbo|nestegg|ffi)',
        '(?:pdf|vtt)\\.js',
        'moz(?:device|version|log|test|process|profile)',
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
        'Skia',
        'ASan Clang',
        'virtualenv',
        'sccache',
        'marionette(?:-transport)?',
        'OTS',
        'PSL',
        'Hunspell',
        'tern',
        'OpenTok library'
    ].join('|');
    merge = [
        '(?:(?:latest|last) )?(?:PGO-)?green',
        'backout',
        '(?:mozilla-)?central',
        '(?:(?:mozilla|b2g)-)?inbound',
        'm-[ci]',
        '(?:b|b2g)-i',
        'b2g',
        '[fm]x-?team',
        'birch',
        'f-t',
        'the CLOBBER touch from inbound'
    ].join('|');
    fix = [
        '(?:(?:Minor|merge|tentative|test|(?:(?:windows|Mac) )?build|Mac) )?' +
            'bustage(?: (?:in the wake of|on|for))?',
        '(?:follow[\\- ]?up )?(?:(?:(?:Windows|ASAN) )?bustage|leaks|build)' +
            ' on (?:a )?CLOSED TREE',
        '(?:a )?typos?',
        'indentation',
        '#include ordering',
        'minor leak',
        'leaks? in',
        '(?:Metro )?build',
        'intermittent',
        'tests?',
        'small bugs',
        'mach build --jobs',
        'Attempted',
        'bug \\d+[.,]',
        'GCC warnings? about',
        'backout of bugs',
        'dangerous public destructors'
    ].join('|');
    misc = [
        'Revert',
        '(?:Speculatively )?Back(?:ed|ing)? ?out',
        'Clean ?ups?',
        'No bug, Automated',
        'Bumping (?:gaia\\.json for|manifests)',
        'Test cleanup for plugin enabledState usage,',
        'Switch from NULL to nullptr in .*?[.;]',
        'Don\'t use NS_MEMORY_REPORTER_IMPLEMENT (?:for|in)',
        'RIL implementation\\.',
        'Delete unused resources\\.',
        'upload a new talos\\.zip (?:to|file\\.)',
        'Suppress clang and gcc warnings in third-party',
        'IPDL serialization for',
        'Use a typed enum for',
        '(?:\\(no bug\\) )?Remove whitespace at end of line in',
        'AutoPushJSContext in',
        'Remove DataContainerEvent dependency from',
        'Add(?:s|ed|ing)? assertions? in',
        'Mark test as failing',
        'Use JS::CallArgs instead of',
        'Add a comment to',
        'Trial fix for',
        'Run the reftests in',
        'Followup bustage fix\\.',
        'Use JS::SourceBufferHolder in',
        'implement test coverage for',
        'Replace MOZ_ASSUME_UNREACHABLE in',
        'Pass .*?(?: and .*?)? by value instead of const-ref\\.',
        'Add OMTA tests for',
        'Add (?:inner|outer) window assertions to',
        '(?:Replace|Remove) AutoPushJSContext in',
        'Update Mozilla to use NSS',
        'Add non-minified version of',
        'Touch CLOBBER for',
        'Fix or whitelist dangerous public destructors in',
        'Fix (?:some|more) bad implicit constructors in',
        'Remove irrelevant & problematic extensions from',
        'Convert XPathExpression to WebIDL bindings,',
        'Return value rooting for',
        'Remove code for handling Thebes backed gfxContext ' +
            '(?:in|from various files under)',
        'Remove some unused code\\.',
        'Use an nsRefPtr for',
        'remove API 8 code from',
        'eliminat(?:e|ing) enclosing instance member access (?:in|of)',
        'Flatten intl/.*? director(?:y|ies)\\.',
        'More gfx::Matrix cleanup in',
        'Use \\|.+?\\| for Bluetooth sockets(?:,)?',
        'Update Maybe users in',
        'Flatten .+? into parent directory\\.',
        'Move .+? into dom/\\.'
    ].join('|');

    filterRE = new RegExp(prefix + [
        '(?:(?:' + colons + ') ?(?::| -)|' + misc + ') ',
        '(?:(?:\\[|\\()(?:' + category + ')(?:\\]|\\))| )+:?',
        '(?:Update|Upgrade|Uplift|Bump|Release)' +
            '(?: (?:to|version of))? (?:' + update + ')' +
            '(?: source)?(?: to (?:version|Firefox[. ])?)?',
        'Merge (?:' + merge + ')(?: (?:(?:in)?to|and) )?',
        '(?:(?:follow[\\- ]?up)+,? (?:to )?)?' +
            'Fix(?:e[ds]|ing|up)? (?:for )?(?:' + fix + ')' +
            '(?: in)?(?:\\.)?(?: |$)',
        '(?:' + fix + ')? fix(?: for)?(?:\\.)?(?: |$)',
        '(?:(?:Add(?:s|ed|ing)?|Create|Fix(?:e[ds]|ing)?|' +
            'Updat(?:e[sd]?|ing)) )?' +
            '(?:(?:a|new|some) )?' +
            '(?:mochi|ref|crash ?|(?:marionette|unit|xpcshell|more) )?' +
            'test(?:ing|s)?' +
            '(?: (?:case|fixe?)s?)?(?: (?:for|to) |[.,]|(?:\\.)?(?: |$))?',
        '(?:crash)?tests? for Bug \\d+(?:\\.)?(?: |$)?',
        '(?:build )?Bustage (?:follow[\\- ]?up)?\\.$',
        'Build .*? in unified mode(?:[.; ]|$)',
        '(?:Add|Use?)(?:ed|s|ing)? NS_DECL_THREADSAFE_ISUPPORTS(?: in )?',
        'No bug: Make some whitespace changes on a CLOSED TREE\\.',
        'Touch CLOBBER to reopen the CLOSED TREE\\.$',
        'merge(?: again)?$',
        '(?:Touch )?CLOBBER\\.(?: |$)',
        'Remove unused variables[., ]?',
        'Remove unnecessary whitespace[., ]?',
        'Intermittent browser_',
        'Double the test timeout$'/*,
        'Disable test_'*/
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

    request(firstNextLink.href, function nextPageLoader(nextDoc) {
        var nextShortlog, hashLink, commit, nextLink;

        nextShortlog = nextDoc.querySelector('body > table > tbody');

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

        nextLink = nextDoc.querySelector('table + .page_nav > a:nth-child(9)');

        if (!nextLink) {
            return;
        }

        request(nextLink.href, nextPageLoader);
    });
}(window, document, Array.prototype.forEach));
