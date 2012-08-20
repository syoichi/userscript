// ==UserScript==
// @name           YouTube Video Auto Pause and Maximize Quality
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    automatically pause and maximize quality in YouTube Video.
// @include        http://www.youtube.com/watch?*
// @include        https://www.youtube.com/watch?*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
    Windows 7 Home Premium SP1 64bit:
        Mozilla Firefox 14.0.1(Scriptish 0.1.7)
        Google Chrome 21.0.1180.79
        Opera 12.01
*/

/*jslint browser: true, maxlen: 80*/
// Edition 2012-08-11

// ref. https://developers.google.com/youtube/js_api_reference

(function executeAutoPauseAndMaximizeQuality(doc) {
    'use strict';

    var hasHTML5Player, hasTime, handleFlashPlayer;

    if (!doc.getElementById('eow-title')) {
        return;
    }

    hasHTML5Player = !doc.getElementById('movie_player');
    hasTime = function hasTime() {
        return (/^#t=(?:\d+h)?(?:\d+m)?(?:\d+s)?$/).test(location.hash);
    };

    if (hasHTML5Player) {
        doc.addEventListener('play', function handleHTML5Player(evt) {
            var maxQuality, settingButton, moviePlayer;

            doc.removeEventListener('play', handleHTML5Player, true);

            maxQuality = doc.querySelector(
                '.html5-settings-popup-menu [style*="list-item"]'
            );

            if (maxQuality && !maxQuality.classList.contains('active')) {
                settingButton = doc.querySelector(
                    '.html5-quality-button:not(.hid)'
                );

                if (settingButton) {
                    maxQuality.click();
                    settingButton.click();
                }
            }

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

        function seekAndUnMute() {
            doc.removeEventListener(
                'YouTubePlaybackQualityChange',
                seekAndUnMute
            );
            if (!hasTime()) {
                moviePlayer.seekTo(0);
            }
            if (!isMuted) {
                moviePlayer.unMute();
            }
        }
        function pauseAndMaximize(evt) {
            var playerState, maxQualityLevel;

            playerState = evt.detail.playerState;

            if (playerState === 1) {
                moviePlayer.pauseVideo();
            } else if (playerState === 2) {
                doc.removeEventListener('YouTubeStateChange', pauseAndMaximize);
                maxQualityLevel = moviePlayer.getAvailableQualityLevels()[0];

                if (moviePlayer.getPlaybackQuality() === maxQualityLevel) {
                    seekAndUnMute();
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

            doc.addEventListener('YouTubeStateChange', pauseAndMaximize);
            doc.addEventListener('YouTubePlaybackQualityChange', seekAndUnMute);
            doc.head.appendChild(doc.createElement('script')).textContent =
                '(' + listenYouTubeEvent + '(window, document));';
        }, 0);
    };

    doc.head.appendChild(doc.createElement('script')).textContent =
        '(' + handleFlashPlayer + '(window, document, ' + hasTime + '));';
}(document));
