// ==UserScript==
// @name           Chromium Git Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    record hash and load next page and filter any commit message on Chromium Git.
// @include        https://chromium.googlesource.com/chromium/chromium/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 27.0.1(Scriptish 0.1.11)
*/

/* jshint maxlen: 80 */

(function executeChromiumGitReader(win, doc, each) {
    'use strict';

    var re, shortlog, commitMessages, colons, category, roll, fix, remove, misc,
        filterRE, markings, chromiumHash, firstHashLink, firstNextLink;

    function hideCommit(commitMessage) {
        if (filterRE.test(commitMessage.textContent)) {
            commitMessage.parentNode.parentNode.hidden = true;
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
        '^https://chromium\\.googlesource\\.com/chromium/chromium/\\+log/HEAD/$'
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

    colons = [
        'cc',
        'tracing_ui\\.cc',
        'gpu',
        'gfx',
        'win8',
        'Windows perf bots',
        'mac',
        'mac notifications',
        'Core Animation',
        'Linux(?: Sandbox)?(?: (?:unit)?tests?)?',
        'sandbox_linux_unittests',
        'linux[- _]aura(?: clang)?',
        'x11(?:/test)?',
        'GTK',
        '(?:linux_aura/)?chrome ?os',
        'CrOS(?: EULA)?',
        'cros_library',
        'cros-asan',
        'Linux/CrOS',
        '(?:(?:DMP|Telemetry) / |ASan/)?Android' +
            '(?: (?:buildbot|bb|WebView(?: build)?|' +
            'perf(?: tests?)?(?: runner)?|envsetup|memreport|Chromoting|' +
            '/ (?:Telemetry|DMP|dmprof|memreport))|Perf|/clang)?',
        'android_webview',
        'aw',
        'FindBugs',
        'drive',
        'Drive API',
        'Files\\.app',
        'file_manager',
        'file_handler_util',
        'File manager drive API',
        'AudioPlayer',
        'kiosk',
        'cryptohome',
        'shill \\(chromeos\\)',
        'P?NaCl(?:[\\- ]?(?:SDK(?: docs)?|IRT|test|Coordinator|' +
            'doc(?:s|umentation)?|security hardening))?',
        'Linux (?:NaCl|Zygote)',
        'NaCl Linux sandbox',
        'POSIX',
        'pepper',
        'PPAPI(?:/NaCl)?',
        'Simple ?Cache(?: Eviction)?',
        'Disk Cache',
        'Test',
        'LayoutTests',
        'Valgrind(?:/Heapcheck| Mac)?',
        'Heapcheck',
        'Chromoting(?: (?:Host|browser_tests|client))?',
        'remoting(?: webapp)?',
        'It2Me native messaging',
        'Telemetry',
        'Telemetry / TabSwitching',
        'UMA(?: histograms)?',
        'metrics',
        'Omnibox UMA Logging',
        'Add a new histogram',
        'VariationsService',
        '(?:More )?(?:win-)?TSAN(?: ?v\\d+)?(?: suppressions?)?',
        'lsan',
        '(?:(?:Style|Code) )?Clean[\\- ]?up',
        'Docserver',
        'Refactoring',
        'Picasa import',
        'Deep Memory Profiler',
        'Magnifier',
        'Compile fix',
        'skia/ext',
        'Disable flaky',
        'memreport\\.py',
        'two_phase_testserver\\.py',
        '(?:Gtk )?content_shell',
        'adb_gdb',
        'Manual revert',
        'tcmalloc',
        'Bisct utility',
        'clang(?: update script)?',
        'yasm',
        'pyauto',
        'build/common.gypi',
        'NSS',
        'Crash fix',
        'Build fix',
        '(?:Update )?Perf expectations',
        'GTTF',
        'test launcher',
        'Semi-Automated Commit',
        'Fixed flaky test',
        'Perf scripts',
        'Revert',
        'checkdeps',
        'GYP',
        'BrowserPlugin',
        'swarming',
        'Build fix attempt',
        'nfc',
        'cr',
        'libaddressinput',
        'python_arch',
        'interactive tests',
        'IPC fuzzer',
        'test-cert generation scripts',
        'device/bluetooth'
    ].join('|');
    category = [
        'CC',
        'cc_perftests',
        'gfx',
        'win8',
        'Linux(?:-Only)?',
        'Gtk',
        'mac',
        'OSX',
        'Cocoa',
        'rAC,? ?OSX',
        'Chrome ?OS',
        'cros(?:,? (?:login|i18n|multi-profile))?',
        '(?:Chromoting )?android(?: |_)?' +
            '(?:webview|webivew|Buildbot|Chromoting|nNTP)?',
        'MIPS',
        'Chromoting',
        'Remoting',
        'chromed?river',
        'Telemetry',
        'UMA',
        'Variations?',
        'NaCl ?(?:SDK)?(?: ?(?:browser_tester|Docs|AppEngine))?',
        'PPAPI',
        'Media ?Galleries',
        'Memory Sheriff',
        'Clean ?up',
        'ASAN',
        'content shell',
        'sql',
        'Build fix',
        'tools',
        'Perf bisector',
        'Bisect',
        'Files.app',
        'AudioPlayer',
        'Mem ?Sherr?iff?',
        'Sheriff',
        'Refactor(?:ing)?',
        'cr tool',
        'Tests?',
        'I-Spy',
        'Valgrind'
    ].join('|');
    roll = [
        'lib(?:jingle|FLAC|vpx|webp|jpeg_turbo|phonenumber|usb|srtp|mtp|' +
            'addressinput|va|yuv|expat)(?: headers?)?',
        '(?:third_party/)?' +
            '(?:android_tools|openssl|libmtp|accessibility-developer-tools|' +
            'protobuf|webpagereplay|freetype)',
        '(?:tools/)?(?:gyp|grit)',
        '(?:OpenSSL|nss)(?:_revision)?',
        'trunk VERSION',
        'Syzygy(?: (?:DEPS(?: latest release build)?|binaries))',
        'the latest CrOS system_api',
        'libs for SDK monitor tool',
        'webdriver py bindings',
        'tools/imagediff/image_diff target',
        'XTBs based on .GRDs',
        'linux-release-64/sizes/chrome-bss/bss expectations(?:\\.$)?',
        'LSan suppressions(?:\\.$)?',
        'the new revision of android_tools',
        '(?:Linux )?reference builds?',
        'sizes',
        'size expectations?',
        '(?:test )?expectations?',
        'the perf expectations',
        'perf_expectations.json',
        'suppression',
        'FFmpeg',
        'Opus',
        'Breakpad',
        'trace[\\- ]viewer',
        'Skia',
        'WebRTC',
        'lighttpd',
        'ANGLE',
        'swarm_client',
        'loading_measurement_analyzer',
        '(?:Windows )?Clang',
        'WebGL conformance tests',
        'deps2git',
        'asan_symbolize.py',
        'openmax(?:[_ ]dl)?',
        'OTS',
        'Web[- ]Page[- ]Replay',
        'SDK tools',
        'net/third_party/nss(?:/ssl)?',
        'cacheinvalidation',
        'harfbuzz-ng',
        '\\.DEPS\\.git',
        'leveldb',
        'ICU',
        'Mesa',
        'Chromite',
        'GTM',
        'mtpd',
        'QO',
        'QuickOffice(?: (?:\\(Beta\\)|manifest files))',
        'histograms.xml',
        'build/ios/grit_whitelist.txt',
        'cros_system_api',
        'valgrind',
        'websocket-client',
        'lcov',
        'snappy',
        'freetype \\(Android-only\\)',
        'Jinja2 \\(Python template library\\)',
        'CLD2',
        'crosh_builtin',
        'genius_app',
        'svn:ignore',
        '\\.gitignore',
        'sfntly',
        'XZ Utils',
        'swarming_client',
        'gtest',
        'polymer',
        '(?:Windows )?GN(?: binary)?',
        'NaCl',
        'smhasher',
        'Brotli',
        'fontconfig',
        'findbugs',
        'KeystoneRegistration.framework',
        'html-office-public'
    ].join('|');
    fix = [
        '(?:(?:(?:non-goma )?Android(?: (?:Webview|Clang))?|' +
            'Chrome(?: for Android| ?OS)?|Linux/Gtk|' +
            '(?:the )?G?TV|non-aura|win(?:64)?|Windows GN|clang) )?' +
            'build(?: error)?(?: (?:after|for) |\\.$)?',
        'checkdeps$',
        '(?:a )?typos?(?:\\.)?$',
        '(?:a )?memory leak(?: in |\\.$)',
        'unused variable assignement\\.$',
        'build breakage on ',
        'compile for ',
        '(?:win64 )?compilation error(?:\\.)?$',
        'a compilation error with ',
        'compile error on ',
        'use after free ',
        'use-after-free$',
        'build break for ',
        'broken build\\.$',
        'bustage$',
        'error in ',
        'unit test for ',
        'a crasher$',
        'Android compile',
        '(?:another )?missing #include build error from '
    ].join('|');
    remove = [
        'empty directory(?:\\.)?$',
        'unreferenced variables\\.$',
        '(?:(?:remaining|unneeded) )?' +
            '(?:obsolete|Skia|LSan) suppressions?(?:\\.)?$',
        'obsolete comment\\.$',
        'stale expectations$',
        '(?:some )?unused (?:variable )?' +
            '(?:declarations?|definitions|dependency|code|property|' +
            'unit tests|field|strings|function|actions|var(?:iable)?)(?:\\.)?$',
        'unnecessary code for ',
        'unnecessary macro\\.$',
        'test suppression\\.$',
        'a spurious space$',
        'dead code(?:\\.)?$'
    ].join('|');
    misc = [
        'Reland',
        '(?:(?:Manual|Partial|Experimental) )?Revert?',
        'Use a direct include of ' +
            '(?:strings|time|the (?:message_loop|shared_memory)) ' +
            'headers? in',
        'Automated Commit: Committing new LKGM version',
        '\\[Mac\\]\\[MC\\]',
        '\\[rAc\\] ?\\[OSX\\]',
        'Disabl(?:ed?|ing) flaky(?: test)?',
        'Add(?:ed|s)? (?:unit ?|a )?test(?:case)?s?(?: for)?',
        'Clean(?:ing|ed)?[- ]?ups?',
        'Add(?:s|ed)? (?:(?:more|a) )?(?:(?:new|UMA) )?' +
            '(?:histogram|metric|UMA(?: (?:entr(?:y|ie)))?|stat)s?' +
            '(?: (?:for|to))?',
        'Suppress (?:an? )?(?:(?:new|quic|intentional|memory) )?' +
            'leaks?(?: (?:in|of|after|from))?',
        'Fix memory leak in',
        'add missing #includes? of <algorithm>, needed on VS2013 for',
        'Build fix after',
        'Remove (?:usages? of )?deprecated V8 APIs? (?:from|in|usage)',
        'Add base:: to (?:straggling )?string16s? in'
    ].join('|');

    filterRE = new RegExp([
        '^(?:(?:' + colons + '):|\\[(?:' + category + ')\\]:?|' + misc + ') ',
        '^(?:DEPS )?' +
            '(?:(?:(?:Ro|Pu)ll|Upgrad|Updat)(?:ing|e?[sd]?)?|Uprev) ' +
            '(?:DEPS )?(?:(?:for|to) )?(?:pick up )?' +
            '(?:' + roll + ')(?: (?:expectations|suppressions))?' +
            '(?: (?:from|after|version))?(?: DEPS)?(?: (?:for|to))?',
        '^(?:' + roll + ') (?:DEPS )?roll(?: to)?(?:\\.)?',
        '^(?:Attempt to )?Fix(?:e[ds]|ing)? (?:' + fix + ')',
        '^(?:Remov|Delet)(?:e[ds]?|ing) (?:' + remove + ')',
        '^White ?space (?:CL|commit|change|fixes|change to ' +
            '(?:(?:kick|force) (?:a )?(?:builds?|bots?)|test CQ))(?:\\.)?$',
        '^Rewrite scoped_ptr<T>\\(NULL\\) ' +
            'to use the default ctor(?: in|\\.$)',
        '(?:Add(?:ed|s)?|Widen(?:ed)?|Remove|Update)(?: an?)? ' +
            '(?:(?:LSan|memory) )?' +
            'suppressions?(?: for)?(?: leak in)?(?: |\\.$)',
        '^(?:More )?Misc\\. (?:(?:tiny|shortcuts) )?cleanups?(?: part .*?)?:$',
        '^Update include paths in .*? for base/process changes\\.$',
        '^Hide knowledge of webkit::ppapi::.*? from chrome\\. ',
        '^cycle bots$',
        '^\\[Memory Sheriff\\]$',
        '^Memory suppressions\\.$',
        '^Suppress a webrtc leak$',
        '^Minor cleanup$',
        '^(?:Build|Compile) fix$',
        '^Force a build$',
        '^Widen(?: a)? Valgrind suppressions?\\.$',
        '^Slightly adjust suppression\\.$',
        '^Mark tests flaky$',
        '^Add newline (?:to|at)(?: the)? end of files?(?:\\.)?$',
        '^Mark tests in .*? as flaky\\.$',
        '^Mark test flaky$',
        '^(?:Another )?fix$',
        '^Webgl conformance test expectations update(?:\\.)?$',
        '^Update (?:some )?uses of (?:Value|UTF conversions|char16) ' +
            '(?:in .*? )?to use the base:: namespace\\.$',
        '^Back out trunk r\\d+(?:\\.)?$'/*,
        '\b(?:Files\\.app|UMA|histogram|DCHECK)\b'*/
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

        if (localStorage.chromiumHash === hash) {
            localStorage.chromiumHash = '';
        } else {
            localStorage.chromiumHash = hash;
        }
    });

    chromiumHash = localStorage.chromiumHash;

    if (!chromiumHash) {
        return;
    }

    firstHashLink = shortlog.querySelector(
        'li > a[href$="/' + chromiumHash + '"]:first-child'
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
            'li > a[href$="/' + chromiumHash + '"]:first-child'
        );

        if (hashLink) {
            commit = hashLink.parentNode;
            commit.classList.toggle('marking');
            shortlog.appendChild(
                getTargetContents(nextShortlog.firstElementChild, commit)
            );

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
