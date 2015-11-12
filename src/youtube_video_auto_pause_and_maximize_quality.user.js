// ==UserScript==
// @name           YouTube Video Auto Pause and Maximize Quality
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.3
// @description    automatically pause and maximize quality in YouTube Video.
// @include        http://www.youtube.com/watch?*
// @include        https://www.youtube.com/watch?*
// @run-at         document-end
// ==/UserScript==

/* User Script info
license: Public Domain
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 30.0(Scriptish 0.1.12)
*/

// ref. https://developers.google.com/youtube/js_api_reference

(function executeAutoPauseAndMaximizeQuality(usDoc) {
  'use strict';

  if (!usDoc.querySelector('.player-unavailable.hid')) {
    return;
  }

  function executeYouTubeEventListener(win, doc) {
    var video, moviePlayer, intervalID, isMuted,
      disabledPlaying = false,
      disabledPaused = false,
      disabledDispatchPlaybackQualityChange = false;

    function hasTime() {
      return /^#t=(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(location.hash);
    }
    function seekAndUnMute() {
      if (!hasTime()) {
        moviePlayer.seekTo(0);
      }

      if (!isMuted) {
        moviePlayer.unMute();
      }
    }
    function executeStateChange(playerState) {
      var maxQualityLevel;

      if (disabledPlaying && disabledPaused) {
        return;
      }

      if (playerState === 1) {
        disabledPlaying = true;

        moviePlayer.pauseVideo();
      } else if (playerState === 2) {
        disabledPaused = true;

        maxQualityLevel = moviePlayer.getAvailableQualityLevels()[0];

        if (moviePlayer.getPlaybackQuality() === maxQualityLevel) {
          seekAndUnMute();
        } else {
          moviePlayer.setPlaybackQuality(maxQualityLevel);
        }
      }
    }
    function executePlaybackQualityChange() {
      if (disabledDispatchPlaybackQualityChange) {
        return;
      }

      disabledDispatchPlaybackQualityChange = true;

      seekAndUnMute();
    }

    video = doc.querySelector('video');

    // for HTML5 Player
    if (video && hasTime()) {
      video.pause();
    }

    // for Flash Player
    intervalID = win.setInterval(function mute() {
      moviePlayer = doc.getElementById('movie_player');

      if (!moviePlayer.isMuted) {
        return;
      }

      win.clearInterval(intervalID);

      /*
      if (hasTime()) {
        moviePlayer.pauseVideo();
      }*/

      isMuted = moviePlayer.isMuted();

      if (!isMuted) {
        moviePlayer.mute();
      }

      win.executeStateChange = executeStateChange;
      win.executePlaybackQualityChange = executePlaybackQualityChange;

      moviePlayer.addEventListener(
        'onStateChange',
        executeStateChange.name
      );
      moviePlayer.addEventListener(
        'onPlaybackQualityChange',
        executePlaybackQualityChange.name
      );
    }, 0);
  }

  usDoc.head.appendChild(usDoc.createElement('script')).textContent =
    '(' + executeYouTubeEventListener + '(window, document));';
}(document));
