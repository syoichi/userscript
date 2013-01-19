// ==UserScript==
// @name           YouTube Video Auto Pause and Maximize Quality
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.2
// @description    automatically pause and maximize quality in YouTube Video.
// @include        http://www.youtube.com/watch?*
// @include        https://www.youtube.com/watch?*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 18.0.1(Scriptish 0.1.8)
        Google Chrome 24.0.1312.52
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2012-12-31

// ref. https://developers.google.com/youtube/js_api_reference

(function executeAutoPauseAndMaximizeQuality(doc) {
    'use strict';

    var hasHTML5Player, hasTime, handleFlashPlayer;

    // via https://gist.github.com/3366491
    function nodeObserver(callback, options) {
        var MO, hasOnly, each, nodesType;

        MO = window.MutationObserver || window.WebKitMutationObserver;
        hasOnly = options.addOnly || options.removeOnly;
        each = Array.prototype.forEach;
        nodesType = (options.addOnly ? 'add' : 'remov') + 'edNodes';
        options.callback = callback;

        function eachNodes(mutation) {
            function callWithInfo(node) {
                callback({node: node, mutation: mutation, options: options});
            }

            if (mutation.type === 'childList' && hasOnly) {
                each.call(mutation[nodesType], callWithInfo);
            } else {
                callWithInfo(null);
            }
        }

        (options.observer = new MO(function eachMutations(mutations) {
            mutations.forEach(eachNodes);
        })).observe(options.target, options);
        return options;
    }

    if (!doc.querySelector('#video-player, embed')) {
        return;
    }

    hasHTML5Player = !doc.getElementById('movie_player');
    hasTime = function hasTime() {
        return (/^#t=(?:\d+h)?(?:\d+m)?(?:\d+s)?$/).test(location.hash);
    };

    if (hasHTML5Player) {
        doc.addEventListener('play', function handleHTML5Player(evt) {
            var moviePlayer;

            doc.removeEventListener('play', handleHTML5Player, true);

            nodeObserver(function maximizeQualityHTML5Player(info) {
                var maxQuality, options;

                maxQuality = doc.querySelector(
                    '.html5-settings-popup-menu [style*="list-item"]'
                );
                options = info.options;

                if (
                    maxQuality && !maxQuality.classList.contains('active') &&
                        !options.target.classList.contains('hid')
                ) {
                    maxQuality.click();
                    doc.body.click();
                }

                options.observer.disconnect();
            }, {
                target: doc.querySelector('.html5-quality-button'),
                attributes: true,
                attributeFilter: ['style']
            });

            moviePlayer = evt.target;

            moviePlayer.pause();

            if (0 < moviePlayer.currentTime && !hasTime()) {
                moviePlayer.currentTime = 0;
            }
        }, true);
        return;
    }

    handleFlashPlayer = function handleFlashPlayer(win, doc, hasTime) {
        var moviePlayer, intervalID, isMuted;

        function seekAndUnMuteFlashPlayer() {
            doc.removeEventListener(
                'YouTubePlaybackQualityChange',
                seekAndUnMuteFlashPlayer
            );
            if (!hasTime()) {
                moviePlayer.seekTo(0);
            }
            if (!isMuted) {
                moviePlayer.unMute();
            }
        }
        function pauseAndMaximizeQualityFlashPlayer(evt) {
            var playerState, maxQualityLevel;

            playerState = evt.detail.playerState;

            if (playerState === 1) {
                moviePlayer.pauseVideo();
            } else if (playerState === 2) {
                doc.removeEventListener(
                    'YouTubeStateChange',
                    pauseAndMaximizeQualityFlashPlayer
                );
                maxQualityLevel = moviePlayer.getAvailableQualityLevels()[0];

                if (moviePlayer.getPlaybackQuality() === maxQualityLevel) {
                    seekAndUnMuteFlashPlayer();
                } else {
                    moviePlayer.setPlaybackQuality(maxQualityLevel);
                }
            }
        }
        function listenYouTubeEvent(win, doc) {
            var moviePlayer = doc.getElementById('movie_player'),
                eventInitDict = {bubbles: true, cancelable: true},
                disabledPlaying = false,
                disabledPaused = false,
                disabledDispatchPlaybackQualityChange = false;

            function dispatchStateChange(playerState) {
                if (disabledPlaying && disabledPaused) {
                    return;
                }

                if (playerState === 1) {
                    disabledPlaying = true;
                } else if (playerState === 2) {
                    disabledPaused = true;
                }

                eventInitDict.detail = {playerState: playerState};

                moviePlayer.dispatchEvent(new win.CustomEvent(
                    'YouTubeStateChange',
                    eventInitDict
                ));
            }
            function dispatchPlaybackQualityChange() {
                if (disabledDispatchPlaybackQualityChange) {
                    return;
                }

                disabledDispatchPlaybackQualityChange = true;

                delete eventInitDict.detail;

                moviePlayer.dispatchEvent(new win.CustomEvent(
                    'YouTubePlaybackQualityChange',
                    eventInitDict
                ));
            }

            win.dispatchStateChange = dispatchStateChange;
            win.dispatchPlaybackQualityChange = dispatchPlaybackQualityChange;

            moviePlayer.addEventListener(
                'onStateChange',
                dispatchStateChange.name
            );
            moviePlayer.addEventListener(
                'onPlaybackQualityChange',
                dispatchPlaybackQualityChange.name
            );
        }

        intervalID = win.setInterval(function muteFlashPlayer() {
            moviePlayer = doc.getElementById('movie_player');

            if (!moviePlayer.isMuted) {
                return;
            }

            win.clearInterval(intervalID);

            isMuted = moviePlayer.isMuted();

            if (!isMuted) {
                moviePlayer.mute();
            }

            doc.addEventListener(
                'YouTubeStateChange',
                pauseAndMaximizeQualityFlashPlayer
            );
            doc.addEventListener(
                'YouTubePlaybackQualityChange',
                seekAndUnMuteFlashPlayer
            );
            doc.head.appendChild(doc.createElement('script')).textContent =
                '(' + listenYouTubeEvent + '(window, document));';
        }, 0);
    };

    doc.head.appendChild(doc.createElement('script')).textContent =
        '(' + handleFlashPlayer + '(window, document, ' + hasTime + '));';
}(document));
