// ==UserScript==
// @name           Blink Git Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    record hash and load next page and filter any commit message on Blink Git.
// @include        https://chromium.googlesource.com/chromium/blink/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80 */

(function executeBlinkGitReader(win, doc, each) {
    'use strict';

    var re, shortlog, commitMessages, authors,
        colons, category, fix, misc, filterRE,
        markings, blinkHash, firstHashLink, firstNextLink;

    function hideCommit(commitMessage) {
        var commit;

        if (filterRE.test(commitMessage.textContent)) {
            commit = commitMessage.parentNode.parentNode;

            if (
                authors.indexOf(
                    commit.querySelector('.author').textContent.slice(3)
                ) !== -1
            ) {
                commit.hidden = true;
            }
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

    re = new RegExp(
        '^https://chromium\\.googlesource\\.com/chromium/blink/\\+log/HEAD/$'
    );

    if (!re.test(location.href)) {
        return;
    }

    shortlog = doc.querySelector('.shortlog');

    if (!shortlog) {
        return;
    }

    commitMessages = doc.getElementsByClassName('commit-message');

    if (!commitMessages.length) {
        return;
    }

    authors = [
        'abarth@chromium.org',
        'eseidel@chromium.org',
        'jochen@chromium.org',
        'ojan@chromium.org',
        'dpranke@chromium.org',
        'thakis@chromium.org',
        'tfarina@chromium.org',
        'dglazkov@chromium.org',
        'esprehn@chromium.org',
        'haraken@chromium.org',
        'tkent@chromium.org',
        'philipj@opera.com',
        'ch.dumez@samsung.com',
        'ch.dumez@sisa.samsung.com',
        'nbarth@chromium.org',
        'marja@chromium.org',
        'japhet@chromium.org',
        'ager@chromium.org',
        'dominicc@chromium.org',
        'arv@chromium.org',
        'fs@opera.com',
        'mstensho@opera.com',
        'mkwst@chromium.org',
        'morrita@chromium.org',
        'jchaffraix@chromium.org',
        'adamk@chromium.org',
        'rafaelw@chromium.org',
        'yhirano@chromium.org',
        'hayato@chromium.org',
        'tasak@google.com',
        'toyoshim@chromium.org',
        'pfeldman@chromium.org',
        'vsevik@chromium.org',
        'yurys@chromium.org',
        'apavlov@chromium.org',
        'lushnikov@chromium.org',
        'loislo@chromium.org',
        'caseq@chromium.org',
        'eustas@chromium.org',
        'alph@chromium.org',
        'prybin@chromium.org',
        'serya@chromium.org',
        'aandrey@chromium.org',
        'cevans@chromium.org',
        'inferno@chromium.org',
        'tsepez@chromium.org',
        'falken@chromium.org',
        'tommyw@chromium.org',
        'kinuko@chromium.org',
        'pdr@chromium.org',
        'fmalita@chromium.org',
        'schenney@chromium.org',
        'jamesr@chromium.org',
        'senorblanco@chromium.org',
        'eae@chromium.org',
        'cbiesinger@chromium.org',
        'tonyg@chromium.org',
        'tony@chromium.org',
        'ksakamoto@chromium.org',
        'alecflett@chromium.org',
        'dstockwell@chromium.org',
        'acolwell@chromium.org',
        'shawnsingh@chromium.org',
        'wangxianzhu@chromium.org',
        'steveblock@chromium.org',
        'dw.im@samsung.com',
        'l.gombos@samsung.com',
        'seokju.kwon@gmail.com',
        'eroman@chromium.org',
        'dcheng@chromium.org',
        'rbyers@chromium.org',
        'hclam@chromium.org',
        'mvanouwerkerk@chromium.org',
        'jsbell@chromium.org',
        'pkasting@chromium.org',
        'kbr@chromium.org',
        'kochi@chromium.org',
        'timloh@chromium.org',
        'vollick@chromium.org',
        'alancutter@chromium.org',
        'yosin@chromium.org',
        'stavila@adobe.com',
        'jww@chromium.org',
        'gavinp@chromium.org',
        'iannucci@google.com',
        'sadrul@chromium.org',
        'ajuma@chromium.org',
        'miletus@chromium.org',
        'kenrb@chromium.org',
        'dslomov@chromium.org',
        'tdanderson@chromium.org',
        'leviw@chromium.org',
        'zmo@chromium.org',
        'jianli@chromium.org',
        'fsamuel@chromium.org',
        'rjkroege@chromium.org',
        'podivilov@chromium.org',
        'mnaganov@google.com',
        'junov@chromium.org',
        'noel@chromium.org',
        'wjmaclean@chromium.org',
        'wolenetz@chromium.org',
        'aboxhall@chromium.org',
        'epenner@chromium.org',
        'dsinclair@chromium.org',
        'pliard@chromium.org',
        'kouhei@chromium.org',
        'tengs@chromium.org',
        'aberent@chromium.org',
        'atwilson@chromium.org',
        'enne@chromium.org',
        'dcarney@chromium.org',
        'kristianm@chromium.org',
        'simonhatch@chromium.org',
        'skobes@chromium.org',
        'ericwilligers@chromium.org',
        'johnme@chromium.org',
        'jam@chromium.org',
        'chrishtr@chromium.org',
        'oysteine@chromium.org',
        'ulan@chromium.org',
        'mbarbella@chromium.org',
        'jdduke@chromium.org',
        'bungeman@chromium.org',
        'rtenneti@chromium.org',
        'avi@chromium.org',
        'clamy@chromium.org',
        'danakj@chromium.org',
        'urvang@google.com',
        'antonm@google.com',
        'vrk@google.com',
        'amikhaylova@google.com',
        'crogers@google.com',
        'yoav@yoav.ws',
        'pstanek@opera.com',
        'alexis.menard@intel.com',
        'qiankun.miao@intel.com',
        'joone.hur@intel.com',
        'rob.buis@samsung.com',
        'r.kasibhatla@samsung.com',
        'g.czajkowski@samsung.com',
        'adam.treat@samsung.com',
        'vani.hegde@samsung.com',
        'mario.prada@samsung.com',
        'rego@igalia.com',
        'petarj@mips.com',
        'robhogan@gmail.com'
    ];

    colons = [
        'ASSERT',
        '(?:(?:Blink|Unreviewed) )?Gardening',
        'TestExpe?ca?t?ations?',
        'updated? test ?expect?ations?',
        'added test suppression',
        'Flaky LayoutTest',
        '(?:(?:Small|Header) )?Clean ?ups?',
        'Refactoring',
        'wtf(?: include cleanup)?',
        'bindings',
        'IDL compiler',
        'webkitpy',
        'HarfBuzzShaper',
        'Revert',
        'Fix test flakiness',
        'PartitionAlloc'
    ].join('|');
    category = [
        'MIPS',
        'Sheriff',
        'Gardening',
        'Refactoring'
    ].join('|');
    fix = [
        '(?:Windows Debug|the Windows component|Mac) build$',
        '(?:build|ASSERTs?) on ',
        '(?:python|webkitpy) tests after ',
        'crashes after ',
        'Android build (?:failure )?(?:after|broken by) ',
        'oilpan build after ',
        'compilation(?: issue)?(?: after |$)',
        '(?:mac|Android)(?:\\.)?$',
        'clobbered build issue\\.$',
        'build warning$',
        'expectations after autorebaseline\\.$',
        '.*? flakiness$',
        'flaky test ',
        'race in ',
        '(?:a )?typo ',
        'build breakage caused by ',
        'after Blink rev ',
        'flaky Win compile$',
        'LayoutTest .*?$',
        'regression introduced with ',
        '(?:a few|(?:even )?more) warnings(?: on linux)?(?:\\.)?$'
    ].join('|');
    misc = [
        '(?:Add|Remove|Skip|Layout) ' +
            '(?:(?:a|super-flaky) )?test(?:s|ing)?(?: for)?',
        '(?:also )?Adding an expected failure for .*? on',
        'Make .*? (?:not |non-)flaky',
        'Refactoring',
        '(?:Partial(?:ly) )?Revert(?:ed)?',
        '(?:Fix )?Heap-use-after-free in',
        'CSS Animations: add interpolation test for',
        'Remove dead code from',
        'Compile fix(?:es)? for',
        'Expand flakiness of',
        'Clean ?ups?',
        'Remove TreatNullAs=NullString for',
        'Make calls to AtomicString\\(const String&\\) explicit in',
        'Widen timeout (?:expectation|suppression)s? for'
    ].join('|');

    filterRE = new RegExp([
        '^(?:' +
            '(?:' + colons + '):|' +
            '\\[(?:' + category + ')\\]|' +
            misc + ') ',
        '(?:(?:Attempt to|Build) )?Fix(?:e[ds])?(?: for)? (?:' + fix + ')' +
            '(?:)?',
        '(?:(?:Unreviewed|Add|Remove|Fix|Updat(?:e[sd]?|ing)|Cleanup|' +
            'Widen|Broaden|Tighten NeedsRebaseline) )?' +
            '(?:some )?(?:Layout ?)?(?:(?:flaky|text|Android|Mac SVG) )?' +
            '(?:test ?)?expectations? ?' +
            '(?:update[sd]? ?)?(?:(?:for|on|to|after) |(?:\\.)?$)',
        'Mark (?:test )?.*? (?:as )?(?:a )?' +
            '(?:flak(?:il)?y|fail(?:ing)?|Slow|broken|Timeout|timing out|' +
            'ImageOnlyFailure|NeedsRebaseline|crashing|crashy)(?:[ .]|$)',
        '^Suppress(?:ed|ions)?(?: for)?' +
            '(?: (?:more|a))? flaky (?:layout )?tests?(?:\\.)?$',
        '(?:(?:Update|Unreviewed) )?(?:(?:Manual|More|Final) )?' +
            '(?:(?:windows|Mac|Snowleopard|SVG(?: (?:text|W3C))?) )?' +
            '(?:(?:Auto|Re)-?)?(?:Re)?baselin(?:e[ds]?|ing)' +
            '(?:results)?(?: (?:for|after))?(?: |(?:\\.)?$)',
        '^(?:(?:Unreviewed|Unofficial) )?gardening(?:\\.)?(?: |$)',
        '^Layout Test .*? is (?:no longer )?(?:flaky|failing)$',
        '^Remove no-longer-flaky expectations$',
        '^Delete unnecessary expectation\\.$',
        '^Remove implied Skip\\.$',
        '^(?:Remove|Delete) empty director(?:y|ies)(?:\\.)?$',
        '^Removed? unused (?:file|variable|function)(?:\\.)?$',
        '^Unskip .*?(?:\\.$)?',
        '^Adding expectations for .*?$',
        '^Remove custom expectation for .*?$',
        '^De-?flake (?:LayoutTest )?.*?$',
        '^Eliminate flakiness for .*?$',
        '^Another attemped win component build fix$',
        '^Add flaky tests\\.$',
        '^Skia suppressions rebaseline\\.$',
        '^Suppressed more flaky and failing tests\\.$',
        '^Some more suppressions\\.$',
        '^Suppress(?:ed|ions)? flaky .*?\\.$',
        '^Suppress(?:ed|ions)? more .*? flakiness\\.$',
        '^Add suppressions for flaky .*? tests\\.$',
        '^Remove (?:calls to|usage of) deprecated V8 APIs(?::| (?:in|from)) ',
        '^(?:Remove|Drop|Fix) (?:(?:all|more) )?deprecated (?:V8 )?APIs? ' +
            '(?:(?:usaged?|calls) )?(?:in|from) ',
        '^Update .+? classes to use OVERRIDE / FINAL when needed$',
        '^Drop \\[LegacyImplementedInBaseClass\\] from .+? IDL interface$'
    ].join('|'), 'i');

    each.call(commitMessages, hideCommit);

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

        commit = $X('./ancestor-or-self::li', target)[0];

        if (!commit) {
            return;
        }

        commit.classList.toggle('marking');

        hashLink = commit.querySelector('a[href]:first-child');

        if (!hashLink) {
            return;
        }

        hash = hashLink.pathname.split('/+/')[1];

        if (localStorage.blinkHash === hash) {
            localStorage.blinkHash = '';
        } else {
            localStorage.blinkHash = hash;
        }
    });

    blinkHash = localStorage.blinkHash;

    if (!blinkHash) {
        return;
    }

    firstHashLink = shortlog.querySelector(
        'li > a[href$="/' + blinkHash + '"]:first-child'
    );

    if (firstHashLink) {
        firstHashLink.parentNode.classList.toggle('marking');
        return;
    }

    firstNextLink = shortlog.nextElementSibling.querySelector('a:only-child');

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
        nextShortlog = response.querySelector('.shortlog');

        if (!nextShortlog) {
            return;
        }

        each.call(nextShortlog.querySelectorAll('.commit-message'), hideCommit);

        hashLink = nextShortlog.querySelector(
            'li > a[href$="/' + blinkHash + '"]:first-child'
        );

        if (hashLink) {
            commit = hashLink.parentNode;

            if (commit) {
                commit.classList.toggle('marking');
                shortlog.appendChild(
                    getTargetContents(nextShortlog.firstElementChild, commit)
                );
            }

            return;
        }

        shortlog.insertAdjacentHTML('BeforeEnd', nextShortlog.innerHTML);

        nextLink = nextShortlog.nextElementSibling.querySelector(
            'a:only-child'
        );

        if (!nextLink) {
            return;
        }

        request(nextLink.href, nextPageLoader);
    });
}(window, document, Array.prototype.forEach));
