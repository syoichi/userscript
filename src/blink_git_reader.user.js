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
        Mozilla Firefox 29.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80 */

(function executeBlinkGitReader(win, doc, each) {
    'use strict';

    var re, shortlog, commitMessages, authors,
        colons, category, fix, remove, misc, filterRE,
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

    re = new RegExp(
        '^https://chromium\\.googlesource\\.com/chromium/blink/\\+log/HEAD/$'
    );

    if (!re.test(location.href)) {
        return;
    }

    shortlog = doc.querySelector('.shortlog, .log');

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
        'sigbjornf@opera.com',
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
        'andersr@opera.com',
        'mkwst@chromium.org',
        'morrita@chromium.org',
        'jchaffraix@chromium.org',
        'adamk@chromium.org',
        'rafaelw@chromium.org',
        'yhirano@chromium.org',
        'hayato@chromium.org',
        'keishi@chromium.org',
        'tasak@google.com',
        'tyoshino@chromium.org',
        'toyoshim@chromium.org',
        'yutak@chromium.org',
        'pfeldman@chromium.org',
        'vsevik@chromium.org',
        'yurys@chromium.org',
        'apavlov@chromium.org',
        'lushnikov@chromium.org',
        'loislo@chromium.org',
        'caseq@chromium.org',
        'eustas@chromium.org',
        'kaznacheev@chromium.org',
        'alph@chromium.org',
        'prybin@chromium.org',
        'serya@chromium.org',
        'aandrey@chromium.org',
        'dgozman@chromium.org',
        'cevans@chromium.org',
        'inferno@chromium.org',
        'tsepez@chromium.org',
        'mlamouri@chromium.org',
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
        'mikhail.pozdnyakov@intel.com',
        'tonyg@chromium.org',
        'tony@chromium.org',
        'ksakamoto@chromium.org',
        'alecflett@chromium.org',
        'dstockwell@chromium.org',
        'acolwell@chromium.org',
        'shawnsingh@chromium.org',
        'wangxianzhu@chromium.org',
        'steveblock@chromium.org',
        'peter@chromium.org',
        'dw.im@samsung.com',
        'l.gombos@samsung.com',
        'seokju.kwon@gmail.com',
        'eroman@chromium.org',
        'dcheng@chromium.org',
        'rbyers@chromium.org',
        'hclam@chromium.org',
        'mvanouwerkerk@chromium.org',
        'jsbell@chromium.org',
        'dmazzoni@chromium.org',
        'pkasting@chromium.org',
        'kbr@chromium.org',
        'kochi@chromium.org',
        'bajones@chromium.org',
        'timloh@chromium.org',
        'vollick@chromium.org',
        'alancutter@chromium.org',
        'dmazzoni@google.com',
        'yosin@chromium.org',
        'bashi@chromium.org',
        'horo@chromium.org',
        'tzik@chromium.org',
        'yukishiino@chromium.org',
        'jbroman@chromium.org',
        'stavila@adobe.com',
        'jww@chromium.org',
        'scheib@chromium.org',
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
        'jkarlin@chromium.org',
        'jianli@chromium.org',
        'fsamuel@chromium.org',
        'rjkroege@chromium.org',
        'podivilov@chromium.org',
        'mnaganov@google.com',
        'junov@chromium.org',
        'noel@chromium.org',
        'wjmaclean@chromium.org',
        'wolenetz@chromium.org',
        'raymes@chromium.org',
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
        'davidben@chromium.org',
        'kristianm@chromium.org',
        'simonhatch@chromium.org',
        'skobes@chromium.org',
        'ericwilligers@chromium.org',
        'zerny@chromium.org',
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
        'ricea@chromium.org',
        'scottmg@chromium.org',
        'wibling@chromium.org',
        'aelias@chromium.org',
        'vrk@chromium.org',
        'pgervais@chromium.org',
        'teravest@chromium.org',
        'hajimehoshi@chromium.org',
        'hartmanng@chromium.org',
        'trchen@chromium.org',
        'vogelheim@chromium.org',
        'ykyyip@chromium.org',
        'erikchen@chromium.org',
        'mek@chromium.org',
        'qinmin@chromium.org',
        'sergeyv@chromium.org',
        'estade@chromium.org',
        'pmeenan@chromium.org',
        'feng@chromium.org',
        'weiliangc@chromium.org',
        'mkosiba@chromium.org',
        'pmarch@chromium.org',
        'changwan@chromium.org',
        'igsolla@chromium.org',
        'fdegans@chromium.org',
        'ppi@chromium.org',
        'zeeshanq@chromium.org',
        'mustaq@chromium.org',
        'jackhou@chromium.org',
        'scherkus@chromium.org',
        'groby@chromium.org',
        'ccameron@chromium.org',
        'bartekn@chromium.org',
        'hpayer@chromium.org',
        'hshi@chromium.org',
        'sergiyb@chromium.org',
        'stip@chromium.org',
        'machenbach@chromium.org',
        'alexclarke@chromium.org',
        'timvolodine@chromium.org',
        'vapier@chromium.org',
        'urvang@google.com',
        'antonm@google.com',
        'vrk@google.com',
        'amikhaylova@google.com',
        'rmacnak@google.com',
        'jabdelmalek@google.com',
        'crogers@google.com',
        'yoav@yoav.ws',
        'pstanek@opera.com',
        'jl@opera.com',
        'dongseong.hwang@intel.com',
        'alexis.menard@intel.com',
        'qiankun.miao@intel.com',
        'joone.hur@intel.com',
        'bruno.d@partner.samsung.com',
        'vivek.vg@samsung.com',
        'rob.buis@samsung.com',
        'r.kasibhatla@samsung.com',
        'g.czajkowski@samsung.com',
        'adam.treat@samsung.com',
        'vani.hegde@samsung.com',
        'mario.prada@samsung.com',
        'sl.ostapenko@samsung.com',
        'mahesh.kk@samsung.com',
        'sunil.ratnu@samsung.com',
        'sudarshan.p@samsung.com',
        'mohan.reddy@samsung.com',
        'krish.botta@samsung.com',
        'vartul.k@samsung.com',
        'anujk.sharma@samsung.com',
        'je_julie.kim@samsung.com',
        'r.nagaraj@samsung.com',
        'rhodovan.u-szeged@partner.samsung.com',
        'pgal.u-szeged@partner.samsung.com',
        'a1.gomes@sisa.samsung.com',
        'rego@igalia.com',
        'efidler@blackberry.com',
        'petarj@mips.com',
        'Gordana.Cmiljanovic@imgtec.com',
        'erik.corry@gmail.com',
        'robhogan@gmail.com',
        'myid.o.shin@gmail.com'
    ];

    colons = [
        'ASSERT',
        'ASSERTION FAILED',
        '(?:(?:Blink|Unreviewed) )?Gardening',
        '(?:updated? )?Test ?Expe?ca?t?ations?',
        'add(?:ed)? (?:test )?suppression',
        '(?:Flaky )?LayoutTests?',
        'Garden-o-matic',
        '(?:(?:Small|Header) )?Clean ?ups?',
        'Refactor(?:ing)?',
        'wtf(?: include cleanup)?',
        'bindings',
        'IDL compiler',
        'webkitpy',
        'HarfBuzzShaper',
        '(?:Temporary )?Revert',
        'Fix test flakiness',
        'PartitionAlloc',
        'perf test',
        'Test(?:Fix)?',
        'LeakExpectations',
        'Fixes for re-enabling more MSVC level 4 warnings',
        'Use tighter typing in editing'
    ].join('|');
    category = [
        'MIPS(?:64)?',
        'Sheriff',
        'Gardening',
        'Refactor(?:ing)?',
        'GOM',
        'Android',
        'Linux',
        'mac(?: asan)?',
        'Sheriff-o-Matic',
        'webkitpy'
    ].join('|');
    fix = [
        '(?:Windows Debug|the Windows component|Mac|Android|oilpan)' +
            '(?: build)?(?: failure)?(?: broken by)?',
        '(?:(?:clobbered|the) )?' +
            'build(?: (?:warning|issue|breakage caused by))?',
        '(?:build|ASSERTs?) on',
        '(?:python|webkitpy) tests',
        'crashes',
        'compilation(?: issue)?',
        'expectations after autorebaseline',
        '.*? flakiness',
        'flaky test',
        'race in',
        '(?:a )?typo',
        'after Blink rev',
        'flaky Win compile',
        'LayoutTest .*?',
        'regression introduced with',
        '(?:a few|(?:even )?more) warnings(?: on linux)?'
    ].join('|');
    remove = [
        'unused (?:file|variable|function|include)s?',
        'empty director(?:y|ies)',
        '(?:no-longer-flaky|unnecessary) expectations?',
        'custom expectation for .*?',
        'flakiness for .*?',
        'implied Skip',
        'dead code',
        '(?:calls to|usage of) deprecated V8 APIs(?::| (?:in|from))',
        '\\[LegacyImplementedInBaseClass\\] from .+? IDL interface',
        'carriage returns from LayoutTests'
    ].join('|');
    misc = [
        '(?:Add(?:ed|ing|s)?|Remove|Skip|Layout) ' +
            '(?:(?:a|super-flaky) )?(?:(?:perf(?:ormance)?) )?' +
            '(?:(unit|layout) ?)?test(?:s|ing)?(?: for)?',
        '(?:also )?Adding an expected failure for .*? on',
        'Make .*? (?:not |non-)flaky',
        'Refactoring',
        '(?:(?:Partial(?:ly)?|Speculative|Psuedo) )?Revert(?:ed|ing)?',
        '(?:Fix )?Heap-use-after-free in',
        'CSS Animations: add interpolation test for',
        'Remove dead code from',
        'Compile fix(?:es)? for',
        'Expand flakiness of',
        'Clean ?ups?',
        'Remove TreatNullAs=NullString for',
        'Make calls to AtomicString\\(const String&\\) explicit in',
        'Widen timeout (?:expectation|suppression)s? for',
        'Use new is\\*Element\\(\\) helper functions',
        '(?:Oilpan:? )?Build fix (?:after|followup to)',
        'DevTools: Remove orphaned CSS rules',
        'Replace FINAL and OVERRIDE with their C\\+\\+11 counterparts in',
        'Replace OVERRIDE and FINAL with override and final in',
        'Replacing the OVERRIDE with override in',
        'Replace OVERRIDE with override in',
        'Move the v8::Isolate\\* parameter to the first parameter of ' +
            'various binding methods in'
    ].join('|');

    filterRE = new RegExp([
        '^(?:' +
            '(?:' + colons + '):|' +
            '\\[(?:' + category + ')\\]|' +
            misc + ') ',
        '(?:(?:Attempt to|Build) )?Fix(?:e[ds])?(?: for)? (?:' + fix + ')' +
            '(?: after)?(?:\\.)?(?: |$)',
        '^(?:(?:Remove|Delete|Eliminate)d?|Drop) ' +
            '(?:' + remove + ')(?:\\.)?(?: |$)',
        '(?:(?:Unreviewed|Add|Remove|Fix|Updat(?:e[sd]?|ing)|Cleanup|' +
            'Widen|Broaden|Tighten NeedsRebaseline) )?' +
            '(?:some )?(?:Layout ?)?(?:(?:flaky|text|Android|Mac SVG) )?' +
            '(?:test ?)?expectations? ?' +
            '(?:update[sd]? ?)?(?:(?:for|on|to|after) |(?:\\.)?$)',
        'Mark(?:ed)? (?:test )?.*? (?:as )?(?:a )?' +
            '(?:(?:non-)?flak(?:(?:il)?y|ing)|' +
            'fail(?:ing)?|Slow|broken|Timeout|timing out|' +
            'ImageOnlyFailure|NeedsRebaseline|crashing|crashy)(?:[ .]|$)',
        '^Suppress(?:ed|ions)?(?: for)?(?:' +
            '(?: (?:more|a))? flaky (?:and failing )?(?:layout )?tests?|' +
            'flaky .*?|more .*? flakiness' +
            ')(?:\\.)?$',
        '(?:(?:Update|Unreviewed) )?(?:(?:Manual|More|Final) )?' +
            '(?:(?:windows|Mac|Snowleopard|SVG(?: (?:text|W3C))?) )?' +
            '(?:(?:Auto|Re)-?)?(?:Re)?base(?:lin(?:e[ds]?|ing))?' +
            '(?:results)?(?: (?:for|after))?(?: |(?:\\.)?$)',
        '^(?:(?:Unreviewed|Unofficial) )?gardening(?:\\.)?(?: |$)',
        '^Layout ?Test .*? is (?:no longer )?(?:flaky|failing)$',
        '^Add suppressions for flaky .*? tests\\.$',
        '^Skia suppressions rebaseline\\.$',
        '^Some more suppressions\\.$',
        '^Unskip .*?(?:\\.$)?',
        '^Adding expectations for .*?$',
        '^De-?flake (?:LayoutTest )?.*?$',
        '^Another attemped win component build fix$',
        '^Add flaky tests\\.$',
        '^(?:Remove|Drop|Fix) (?:(?:all|more) )?deprecated (?:V8 )?APIs? ' +
            '(?:(?:usaged?|calls) )?(?:in|from) ',
        '^Update .+? classes to use OVERRIDE / FINAL when needed$',
        '^(?:Have|Make) (?:Document|Element|Node)' +
            '::[a-zA-Z]+\\(\\) return a reference$',
        '^whitespace change$',
        '^Replacing the OVERRIDE with override and FINAL with final$',
        '^Tune performance test parameters\\.$'
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

    request(firstNextLink.href, function nextPageLoader(nextDoc) {
        var nextShortlog, hashLink, commit, nextLink;

        nextShortlog = nextDoc.querySelector('.shortlog, .log');

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
