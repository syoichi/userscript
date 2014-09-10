// ==UserScript==
// @name           WebKit Changesets Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    change style and filter any commit message in WebKit Changesets.
// @include        https://trac.webkit.org/timeline
// @include        https://trac.webkit.org/timeline?*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 32.0(Greasemonkey 2.2)
*/

/* jshint maxlen: 80 */

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
        'dd.changeset > :not(:nth-child(2)) {',
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
        'dl dd.changeset > .changes:first-child + *'
    );

    if (!commitMessages.length) {
        return;
    }

    prefix = '^(?:<​https?://webkit\\.org/b/\\d+> )?' +
        '(?:Source/WebCore: )?(?:.: )?(?:Unreviewed[.,;]? )?(?:';

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
        'Layout ?Tests?',
        'TestWebKitAPI',
        'Gardening',
        'Clean up',
        'ASSERTION FAILED',
        'NRWT',
        'GTest',
        'OwnPtr',
        'CStack(?: Branch)?',
        'WebKit Bot Watcher\'s Dashboard',
        'WebKitPerfMonitor',
        'bmalloc',
        'WK2 iOS',
        'WebKit2/iOS',
        'REGRESSION ?\\((?:WK2 )?iOS(?: WebKit2)?\\)',
        'iOS WebKit2',
        'Revert'/*,
        'WK[12]?'*/
    ].join('|');
    category = [
        // '(?:WK|WebKit)[12]?',
        'iOS(?: (?:(?:WK|WebKit)[12]?|WebGL|Media))?',
        'WebKit2 iOS',
        // 'Mac',
        'Cocoa',
        // 'Qt',
        // 'BlackBerry',
        'Win',
        'EFL',
        'EGL',
        'Coordinated ?Graphics',
        'GTK(?: L10N)?',
        'mips',
        'Nix',
        'Jhbuild',
        '(?:Win)?Cairo',
        'GSt(?:reamer)?',
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
        'GDB',
        'ARM(?:64|v7)?',
        'ftlopt'
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
        'iOS(?: Debug)?',
        'Qt(?:/MountainLion)?',
        'BlackBerry debug',
        'EFL',
        'GTK(?:\\+)?(?: port)?',
        '(?:x86 )?32-?bits?',
        'ARM(?:v7|64)?',
        'FTL',
        'GCC',
        'buil?d(?: break)?',
        'the',
        'clean engineering',
        'bindings tests',
        'compile error in',
        '(?:a )?typos?',
        'indention of',
        'blind attempt at a',
        'one more',
        'Speculative',
        '(?:\\.)?$',
        'layout test$',
        '(?:Another )?follow-up',
        'test'
    ].join('|');
    misc = [
        '(?:Re-)?Merged?',
        'Revert(?:ed)?',
        'Back out',
        '(?:(?:Tagging the|Branch) )?WebKitGTK\\+(?: for)?',
        'Add (?:a )?tests?(?: references?)? for',
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
        'Move to using std::unique_ptr for',
        'Update test expectations after',
        'Update the build fix for',
        'ARM64 buildfix after',
        'Bump version to',
        'REGRESSION\\(r\\d+\\):? \\[GTK\\]'
    ].join('|');

    filterRE = new RegExp(prefix + [
        '(?:(?:' + colons + ') ?:|' + misc + ') ',
        '(?:\\[(?:' + category + ')\\]| )+:?',
        '(?:(?:(?:One )?(?:more )?|Maybe the last )?' +
            '(?:(?:Attempt(?:ed)?|Tr(?:y|ied))(?: to)?' +
            '|Build|Compile|Clumsily|Another) )?' +
            'Fix(?:e[ds]|ing)?(?: for)?(?: the)? ' +
            '(?:' + fix + ')(?: (?:for|(?:builds? )?after)|builds?\\.)?',
        '(?:(?:extended )?(?:(?:Yet )?Another|Attempt(?:ed)?(?: at)?) )?' +
            '(?:(?:Speculative|Additional) )?(?:the )?(?:' + fix + ')' +
            '(?: (?:minimum|Speculative))? (?:builds? ?)?Fix(?:e[ds])?' +
            '(?: (?:following|(?:attempt )?after)|\\.)?',
        '(?:New|Remove|Delete) (?:Tag|Branch)(?:\\.)?$',
        'Versioning(?:\\.)?$',
        '“Versioning.”$',
        'Version bump\\.$',
        '(?:(?:Fix|Bump) )versioning(?:\\.)?$',
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
        'test expectation update\\.$',
        'test gardening\\.$',
        'Tagging(?:\\.)?$',
        'Tagging Safari-[\\d.]+$',
        'Create the Safari-[\\d.]+ tag\\.$'
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
