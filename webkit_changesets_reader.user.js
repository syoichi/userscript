// ==UserScript==
// @name           WebKit Changesets Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    change style and filter any commit message in WebKit Changesets.
// @include        https://trac.webkit.org/timeline
// @include        https://trac.webkit.org/timeline?*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2014-02-06

(function executeWebKitChangesetsReader(win, doc) {
    'use strict';

    var timeline, markings, webkitRev, firstRevLink, commitMessages,
        prefix, colons, category, fix, misc, filterRE;

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

    timeline = doc.querySelector('.timeline');

    if (!timeline) {
        return;
    }

    doc.head.appendChild(doc.createElement('style')).textContent = [
        'dd.changeset p {',
        '  color: black !important;',
        '  font-size: 1.3em !important;',
        '}',
        'dd.wiki, dt.wiki,',
        'dd.changeset > :not(:first-child) {',
        '  display: none !important;',
        '}',
        '.marking {',
        '  background-color: red !important;',
        '}'
    ].join('\n');

    markings = timeline.getElementsByClassName('marking');

    timeline.addEventListener('dblclick', function recordRev(evt) {
        var target, marking, changeset, revLink, rev;

        target = evt.target;

        if (target.tagName !== 'DT') {
            return;
        }

        win.getSelection().removeAllRanges();

        if (markings.length) {
            marking = markings[0];

            if (!marking.contains(target)) {
                marking.classList.remove('marking');
            }
        }

        changeset = $X('./ancestor-or-self::dt', target)[0];

        if (!changeset) {
            return;
        }

        changeset.classList.toggle('marking');

        revLink = changeset.querySelector('a[href]:only-child');

        if (!revLink) {
            return;
        }

        rev = revLink.pathname.replace('/changeset/', '');

        if (localStorage.webkitRev === rev) {
            localStorage.webkitRev = '';
        } else {
            localStorage.webkitRev = rev;
        }
    });

    webkitRev = localStorage.webkitRev;

    if (webkitRev) {
        firstRevLink = timeline.querySelector(
            'dt.changeset > a[href$="/' + webkitRev + '"]:only-child'
        );

        if (firstRevLink) {
            firstRevLink.parentNode.classList.toggle('marking');
        }
    }

    commitMessages = timeline.querySelectorAll(
        'dl dd.changeset > :first-child'
    );

    if (!commitMessages.length) {
        return;
    }

    prefix = '^(?:<​https?://webkit\\.org/b/\\d+> )?' +
        '(?:Source/WebCore: )?(?:.: )?(?:Unreviewed[.,]? )?(?:';

    colons = [
        'CURL',
        'Coordinated ?Graphics',
        'Fixed broken build',
        'gdb',
        'webkitpy',
        'check-webkit-style',
        'Build fix',
        'Crashing Test',
        'Flaky Test',
        'Gardening',
        'Clean up',
        'ASSERTION FAILED',
        'NRWT',
        'GTest',
        'OwnPtr',
        'CStack(?: Branch)?',
        'WebKit Bot Watcher\'s Dashboard',
        'WK[12]?'
    ].join('|');
    category = [
        'WK[12]?',
        'WebKit[12]?',
        'Cocoa',
        'Qt',
        'BlackBerry',
        'EFL',
        'EGL',
        'Coordinated ?Graphics',
        'GTK(?: L10N)?',
        'mips',
        'Nix',
        'Jhbuild',
        '(?:Win)?Cairo',
        'GStreamer',
        'Soup',
        'NRWT',
        'TexMap',
        'Layout Tests',
        'harfbuzz',
        'WTF',
        'DRT',
        'CMAKE',
        'sh4',
        'Curl',
        'webkitpy',
        'Auto(?:conf|make|tools)',
        'buildbot',
        'ASAN',
        'GLIB',
        'GDB'
    ].join('|');
    fix = [
        'release',
        'debug',
        'MSVC',
        'WebKit1',
        'Windows?(?: release)?',
        'Win64(?: compile)?',
        'WinCE',
        'AppleWin(?: VS2010)?',
        'OS X',
        'Mac(?:-Lion)?',
        'Mountain Lion',
        'iOS',
        'Qt(?:/MountainLion)?',
        'BlackBerry debug',
        'EFL',
        'GTK(?:\\+)?(?: port)?',
        '(?:x86 )?32-?bits?',
        'ARM',
        'FTL',
        'GCC',
        'buil?d(?: break)?',
        'the',
        'clean engineering',
        'bindings tests',
        'compile error in',
        'typo',
        'indention of',
        'blind attempt at a',
        'one more',
        'Speculative',
        '(?:\\.)?$',
        'layout test$',
        '(?:Another )?follow-up'
    ].join('|');
    misc = [
        'Merged?',
        'Revert(?:ed)?',
        '(?:(?:Tagging the|Branch) )?WebKitGTK\\+(?: for)?',
        'Add a test for',
        'Mark .*? tests as passing for',
        'Buildfix after',
        '\\[Win\\] (?:Unreviewed )?Build fix (?:after|for)',
        'Build break after',
        'Debug build correction after',
        'More correct build fix after',
        'Attempted build-fix after',
        'build correction after',
        'test update after',
        'test correction after',
        'IDB: TestExpectations batch -',
        'Move to using std::unique_ptr for'
    ].join('|');

    filterRE = new RegExp(prefix + [
        '(?:(?:' + colons + ') ?:|' + misc + ') ',
        '(?:\\[(?:' + category + ')\\]| )+:?',
        '(?:(?:(?:One )?(?:more )?|Maybe the last )?' +
            '(?:(?:Attempt(?:ed)?|Try)(?: to)?' +
            '|Build|Compile|Clumsily|Another) )?' +
            'Fix(?:e[ds]|ing)?(?: for)?(?: the)? ' +
            '(?:' + fix + ')(?: (?:for|(?:builds? )?after)|builds?\\.)?',
        '(?:(?:extended )?(?:(?:Yet )?Another|Attempt(?:ed)?(?: at)?) )?' +
            '(?:the )?(?:' + fix + ')' +
            '(?: (?:minimum|Speculative))? (?:builds? ?)?Fix(?:e[ds])?' +
            '(?: (?:following|(?:attempt )?after)|\\.)?',
        '(?:New|Remove) (?:Tag|Branch)(?:\\.)?$',
        'Versioning(?:\\.)?$',
        '“Versioning.”$',
        'roll(?:ing|ed)? ?out(?: of)?',
        'Rolled back in',
        '(?:(?:EFL|Windows|(?:Mac )?(?:(?:Mountain )Lion|Mavericks)) )?' +
            'rebaselines?(?: (?:of|after) )?',
        '(?:Un)?Skip (?:(?:more|some) )?(?:failing|flaky) (?:WebGL )?' +
            'tests(?: (?:to make|on(?: Mac)))?(?:\\.)?',
        '(?:(?:EFL|GTK|\\[(?:Windows|Mac)\\]|ARM Qt|ATK) )?' +
            '(?:Unreviewed )?gardening[ .]?',
        '\\[(?:Windows|Mac|ARM)\\] (?:(?:Unreviewed|Speculative) )?' +
            '(?:test|(?:Correct )?build|crash|Compile)' +
            '(?: (?:fix|corrects?ion|protection|gardening))?' +
            '[ .,]?(?: after)?',
        '\\[Windows\\] Linking fix for Win64\\.$',
        '\\[Win\\] Unreviewed gardening\\.$',
        '\\[Win\\] Link error\\.',
        'Remove bogus assertion\\.$',
        'Windows build juice\\.$',
        'Update (?:Mac|EFL) test expectations\\.$',
        'Update test expectations for Windows\\.$',
        'Update NEWS and Versions\\.m4 for [.\\d]+ release\\.',
        '(?:build|warning) correction\\.',
        'Layout Test .*? is flaky',
        'buildfix\\.$',
        '"Build fix"\\.$',
        'More build fixing\\.$',
        'Unbreak the release build\\.$',
        'Remove Duplicate Tag\\.$',
        'test correction\\.$',
        'Small build fix for the GTK\\+ CMake port$',
        'test expectation update\\.$'
    ].join('|') + ')', 'i');

    Array.prototype.forEach.call(commitMessages, function hide(commitMessage) {
        var dd;

        if (filterRE.test(commitMessage.textContent.trim())) {
            dd = commitMessage.parentNode;
            dd.hidden = true;
            dd.previousElementSibling.hidden = true;
        }
    });
}(window, document));
