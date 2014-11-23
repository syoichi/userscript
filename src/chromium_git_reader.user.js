// ==UserScript==
// @name           Chromium Git Reader
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    record hash and load next page and filter any commit message on Chromium Git.
// @include        https://chromium.googlesource.com/chromium/chromium/*
// @include        https://chromium.googlesource.com/chromium/src/*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 31.0(Scriptish 0.1.12)
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
        '^https://chromium\\.googlesource\\.com/chromium/' +
            '(?:chromium|src)/\\+log/HEAD/$'
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

    colons = [
        'cc',
        'tracing_ui\\.cc',
        'gpu(?: testing)?',
        'gfx',
        'gl_helper',
        'win8',
        'Windows perf bots',
        'mac(?:Views| (?:notifications|ÜC))?',
        'Core ?Animation',
        '(?:Mac )?AVFoundation',
        'Mac Video Capture',
        'Linux(?: Sandbox)?(?: (?:unit)?tests?)?',
        'sandbox_linux_unittests',
        'linux[- _]aura(?: clang)?',
        'linux_ash',
        'aura-linux',
        'Breakpad Linux',
        'Linux (?:NaCl|Zygote|Breakpad)',
        'x11(?:/test)?',
        'GTK',
        '(?:(?:linux(?:_aura)?)[\\- _/])?(?:cros|chrome ?os)' +
            '(?:[\\- _/](?:EULA|dbus|library|asan|interface))?',
        '(?:(?:DMP|Telemetry) / |ASan/)?Android' +
            '(?: (?:buildbot|bb|WebView(?: build)?|Video|media|scroller|' +
            'perf(?: tests?)?(?: runner)?|envsetup|memreport|Chromoting|' +
            '/ (?:Telemetry|DMP|dmprof|memreport))|Perf|/clang)?',
        'android_webview',
        'aw',
        'FindBugs',
        'drive',
        'Drive API',
        'File?s\\.app',
        'file[_ ]manager',
        'file_handler_util',
        'File manager drive API',
        'Gallery(?:\\.app)?',
        'Audio ?Player',
        'Video ?Player',
        '(?:Mac|Android) Video ?Capture',
        'kiosk',
        'cryptohome',
        'shill \\(chromeos\\)',
        '(?:Non-?SFI )?P?NaCl(?:[\\- ]?(?:SDK(?: docs)?|IRT|test|Coordinator|' +
            'doc(?:s|umentation)?|security hardening|Sandbox|' +
            'Linux(?: sandbox)?))?',
        'POSIX',
        'pepper',
        'PPAPI(?:/NaCl)?',
        'Simple ?Cache(?: Eviction)?',
        'Disk Cache',
        'Test',
        'LayoutTests',
        'I-?Spy',
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
        'Histograms\\.xml',
        '(?:More )?(?:win-)?TSAN(?:/Win)?(?: ?v\\d+)?(?: suppressions?)?',
        '[alm]san',
        'AsanCoverage',
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
        'test_runner',
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
        'device/bluetooth',
        'Bluetooth(?: Device)?',
        'unit_tests',
        'veatest',
        'LeakSanitizer',
        'Fixes for re-enabling more MSVC level 4 warnings',
        '(?:Chrome)?cast'
    ].join('|');
    category = [
        'CC',
        'cc_perftests',
        'gfx',
        'win8',
        'Linux(?:-Only)?',
        'Gtk',
        'mac',
        'OS ?X',
        'Cocoa',
        'OriginChip, OSX',
        'Extensions Toolbar Mac',
        'rAC,? ?(?:OSX|Android)',
        'OSX,? rAC',
        'Chrome ?OS',
        'cros(?:,? (?:login|i18n|multi-profile))?',
        '(?:(?:Chromoting|Mirror) )?android[ _]?' +
            '(?:webview|webivew|Buildbot|Chromoting|nNTP|Java Bridge)?',
        'oobe',
        'MIPS(?:64)?',
        'Chromoting',
        'Remoting',
        'chromed?river',
        'Telemetry',
        'UMA',
        'Metrics',
        'Variations?',
        'NaCl ?(?:SD[KL])?(?: ?(?:browser_tester|Docs|AppEngine))?',
        'PPAPI',
        'Media ?Galleries',
        'Memory Sheriff',
        'Clean[- ]?up',
        'ASAN',
        'content shell',
        'sql',
        'Build fix',
        'tools',
        'Perf bisector',
        'Bisect',
        'Files\\.app(?: Gallery)?',
        'AudioPlayer',
        'VideoPlayer',
        'Mem ?Sherr?iff?',
        'Sheriff',
        'Refactor(?:ing)?',
        'cr tool',
        'Tests?',
        'I-?Spy',
        'Valgrind',
        'Cast',
        'Testing'
    ].join('|');
    roll = [
        'lib(?:jingle|FLAC|vpx|webp|webm|jpeg_turbo|phonenumber|usb|srtp|mtp|' +
            'addressinput|va|yuv|expat|louis)(?: headers?)?',
        '(?:(?:src/)?third_party/)?' +
            '(?:android_tools|openssl|libmtp|accessibility-developer-tools|' +
            'protobuf|webpagereplay|freetype|webgl(?:/src)?|libva|' +
            'cros_system_api|skia|icu|cld_2)',
        '(?:tools/)?(?:gyp|grit|swarm(?:ing)?_client)(?:/)?',
        '(?:OpenSSL|[ln]ss)(?:_revision)?',
        'trunk VERSION',
        'Syzygy(?: (?:DEPS(?: latest release build)?|binaries))?',
        '(?:cros|сhromeos)[ _]?system[ _]?api',
        'ChromeVox',
        'libs for SDK monitor tool',
        'webdriver py bindings',
        'tools/imagediff/image_diff target',
        'XTBs based on .GRDs',
        'linux-release-64/sizes/chrome-bss/bss expectations(?:\\.$)?',
        'LSan suppressions(?:\\.$)?',
        'new revision of android_tools',
        '(?:Linux )?reference builds?',
        'sizes',
        '(?:(?:(?:webgl conformance )?test|(?:the )?perf|size) )?expectations?',
        'perf_expectations.json',
        'suppression',
        'FFmpeg',
        'Opus',
        'Breakpad',
        'src/breakpad/src',
        'trace[\\- ]viewer',
        'Manual Skia',
        'WebRTC',
        'lighttpd',
        'ANGLE',
        'loading_measurement_analyzer',
        '(?:Windows )?Clang',
        'WebGL conformance tests',
        'deps2git',
        'asan_symbolize.py',
        'ASan/Win',
        'openmax(?:[_ ]dl)?',
        'OTS',
        'Web[- ]Page[- ]Replay',
        'SDK tools',
        'net/third_party/nss(?:/ssl)?',
        'cacheinvalidation',
        'harfbuzz(?:-ng)?',
        '\\.DEPS\\.git',
        'leveldb',
        'Mesa',
        'Chromite',
        'GTM',
        'mtpd',
        'QO',
        'QuickOffice(?: (?:\\(Beta\\)|manifest files))',
        'histograms.xml',
        'build/ios/grit_whitelist.txt',
        'valgrind',
        'websocket-client',
        'lcov',
        'snappy',
        'freetype \\(Android-only\\)',
        'Jinja2 \\(Python template library\\)',
        'CLD[\\- _]?2',
        'Compact Language Detector v2',
        'crosh_builtin',
        'genius_app',
        'svn:ignore',
        '\\.gitignore',
        'sfntly',
        'XZ Utils',
        'swarming_client',
        'gtest',
        '(?:embedded )?polymer',
        '(?:Windows )?GN(?: binary)?',
        'NaCl',
        'smhasher',
        'Brotli',
        'fontconfig',
        'findbugs',
        'KeystoneRegistration.framework',
        'html-office-public',
        'hunspell',
        'pyauto',
        'W3C test repos',
        'CDM interface',
        'tlslite',
        'pdfium',
        'buildtools',
        'font-compression-reference',
        'Dr\\. Memory',
        'dom_distiller_js',
        'usrsctp(?:lib)?',
        'usrcstplib',
        'Android SDK',
        'BoringSSL',
        'cryptotoken',
        'AOSP Manifest',
        'Checkstyle',
        'typ',
        'src/tools/gyp',
        'mojo sdk',
        'google-input-tools'
    ].join('|');
    fix = [
        '(?:the )?(?:(?:(?:non-goma )?Android(?: (?:Webview|Clang))?|' +
            'GYP|MIPS|ozone|' +
            'Chrome(?: for Android| ?OS)?|Linux/Gtk|(?:64 bit )?Mac|' +
            'G?TV|non-aura|win(?:64)?|(?:Windows|mac) GN|clang) )?' +
            'build(?: (?:error|issue))?(?: (?:after|for) |\\.$)?',
        'checkdeps$',
        '(?:a )?typos?(?:(?:\\.)?$| in )',
        '(?:a )?memory leak(?: in |\\.$)',
        'unused variable assignement\\.$',
        'build breakage on ',
        'reference builds on ',
        'compile for ',
        '(?:win64 )?compilation error(?:\\.)?$',
        'a compilation error with ',
        'compile error on ',
        'GTK compilation after',
        'use after free ',
        'use-after-free$',
        'build break for ',
        'broken build\\.$',
        'bustage$',
        'bustage with ',
        '(?:error|assert) in ',
        'unit test for ',
        'a crasher$',
        'Android compile',
        '(?:another )?missing #include build error from ',
        '"unreachable code" warnings \\(MSVC warning 4702\\) in ',
        'memory leak in ',
        'line endings(?:\\.)?$',
        'a DCHECK '
    ].join('|');
    remove = [
        'empty directory(?:\\.)?$',
        'unreferenced variables\\.$',
        '(?:(?:remaining|unneeded) )?' +
            '(?:obsolete|Skia|LSan) suppressions?(?:\\.)?$',
        'obsolete comment(?:\\.)?$',
        'stale expectations$',
        '(?:some )?unused (?:variable )?' +
            '(?:declarations?|definitions?|dependency|code|property|headers?|' +
            'unit tests?|field|files?|strings?|function|actions?|resources?|' +
            'var(?:iable)?|includes?|assets?)(?:\\.)?$',
        'unnecessary code for ',
        'unnecessary code\\.$',
        'unnecessary condition\\.',
        'unnecessary macro\\.$',
        'unneeded includes?(?:\\.)?$',
        'test suppression\\.$',
        'a spurious space$',
        'dead code(?:\\.)?$',
        'implicit conversions from scoped_refptr to T\\* in '
    ].join('|');
    misc = [
        'Reland',
        '(?:(?:Manual|Partial|Experimental|Tentatively) )?Revert(?:ing)?',
        'Use a direct include of ' +
            '(?:strings|time|the (?:message_loop|shared_memory)) ' +
            'headers? in',
        'Automated Commit: Committing new LKGM version',
        '\\[Mac\\]\\[MC\\]',
        '\\[rAc\\] ?\\[OSX\\]',
        'Disabl(?:ed?|ing) flaky(?: test)?',
        'Add(?:ed|s|ing)? (?:a )?(?:(?:manual|browser) )?(?:(?:unit|perf) ?)?' +
            'test(?:case)?s?(?: for)?',
        '(?:Minor )?Clean(?:ing|ed)?[- ]?ups?',
        'Add(?:s|ed)? (?:(?:more|a) )?(?:(?:new|UMA) )?' +
            '(?:histogram|metric|UMA(?: (?:entr(?:y|ie)))?|stat)s?' +
            '(?: (?:for|to))?',
        'Suppress (?:an? )?(?:(?:new|quic|intentional|memory) )?' +
            '(?:error|issue|leak)s?(?: (?:in|of|after|from))?',
        'add missing #includes? of <algorithm>, needed on VS2013 for',
        'Build fix after',
        'Remove (?:usages? of )?deprecated V8 APIs? (?:from|in|usage)',
        'Add base:: to (?:straggling )?string16s? in',
        'Add logging for',
        'Refactor',
        'Whitespace change to',
        'Windows compile fix after',
        'Typo fix;',
        'Retire obsolete Valgrind supressions',
        'Retire obsolete DrMemory suppressions',
        'Remove implicit HANDLE conversions from',
        'Replacing the OVERRIDE with override and FINAL with final in',
        'replace OVERRIDE and FINAL with override and final in',
        'Replacing the OVERRIDE with override in',
        'Replace FINAL and OVERRIDE with their C\\+\\+11 counterparts in',
        'Replace OVERRIDE with its C\\+\\+11 counterparts in',
        'Standardize usage of virtual/override/final in'
    ].join('|');

    filterRE = new RegExp([
        '^(?:(?:' + colons + '):|\\[(?:' + category + ')\\]:?|' + misc + ') ',
        '^(?:DEPS:? )?' +
            '(?:(?:(?:Ro|Pu)ll|Upgrad|Updat|Bump)(?:ing|e?[sd]?)?|Uprev) ' +
            '(?:DEPS )?(?:(?:for|to|of) )?(?:pick up )?(?:the )?(?:latest )?' +
            '(?:' + roll + ')(?: (?:expectations|suppressions))?' +
            '(?: (?:from|after|version))?(?: DEPS)?(?: (?:for|to))?',
        '^(?:' + roll + ') (?:DEPS )?roll(?: to)?(?:\\.)?',
        '^Use (?:' + roll + ') revision \\d+\\.$',
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
        '^Back out trunk r\\d+(?:\\.)?$',
        '^Disable a flaky test\\.$',
        '^Style nits$',
        '^Compile fix for Clang$',
        '^net: a batch of HSTS preloaded updates\\.$',
        '^Land Recent (?:QUIC|SPDY) Changes(?:\\.)?',
        '^(?:Update|Upload)(?: files in)? .*? ' +
            'to use results\\.AddValue(?:\\((?:\\.\\.\\.)?\\)(?:\\.)?)?$',
        'for scoped_refptr(?:<T>)? operator T\\* removal(?:\\.)?$',
        '^Cleanup\\.$',
        '^Use scoped_ptr::Pass instead of scoped_ptr::PassAs<T>\\.$',
        '^Adding instrumentation to locate the source of jankiness\\.$',
        '^Standardize usage of virtual/override/final specifiers\\.$'/*,
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

    request(firstNextLink.href, function nextPageLoader(nextDoc) {
        var nextShortlog, hashLink, commit, nextLink;

        nextShortlog = nextDoc.querySelector('.shortlog, .log');

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
