// ==UserScript==
// @name           YouTube Video Auto Pause and Maximize Quality
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.4
// @description    automatically pause and maximize quality in YouTube Video.
// @include        https://www.youtube.com/*
// @run-at         document-end
// @grant          none
// ==/UserScript==

/* User Script info
license: CC0 1.0 Universal
confirmed:
  Windows 7 Home Premium SP1 64bit:
    Mozilla Firefox 42.0(Greasemonkey 3.5)
*/

// ref. https://developers.google.com/youtube/iframe_api_reference

(function executeAutoPauseAndMaximizeQuality(usDoc) {
  'use strict';

  // via https://gist.github.com/syoichi/3366491
  function nodeObserver(callback, options) {
    let hasOnly = options.addOnly || options.removeOnly;
    let each = Array.prototype.forEach;
    let nodesType = options.addOnly ? 'addedNodes' : 'removedNodes';

    function eachNodes(record) {
      function callWithInfo(node) {
        callback({
          node: node,
          record: record,
          options: options
        });
      }

      if (record.type === 'childList' && hasOnly) {
        each.call(record[nodesType], callWithInfo);
      } else {
        callWithInfo(null);
      }
    }

    let observer = new MutationObserver(mutations => {
      mutations.forEach(eachNodes);
    });

    observer.observe(options.target, options);

    return Object.assign(options, {
      observer: observer,
      callback: callback
    });
  }

  function loadScript() {
    function executeYouTubeEventListener(doc, lc) {
      // 'use strict';

      let moviePlayer = doc.getElementById('movie_player');
      let prevID;

      function getParamsObj(params) {
        return params.replace(/^\?/, '').split(/[&;]/).reduce((obj, param) => {
          let pair = param.split('=');

          if (pair.length === 2) {
            let key = pair[0];
            let val = pair[1];

            if (!obj[key]) {
              obj[key] = val;
            } else if (Array.isArray(obj[key])) {
              obj[key].push(val);
            } else {
              obj[key] = [obj[key], val];
            }
          }

          return obj;
        }, {});
      }

      function operateVideo() {
        let isMuted = moviePlayer.isMuted();

        if (!isMuted) {
          moviePlayer.mute();
        }

        moviePlayer.stopVideo();

        let maxQualityLevel = moviePlayer.getAvailableQualityLevels()[0];

        if (moviePlayer.getPlaybackQuality() !== maxQualityLevel) {
          moviePlayer.setPlaybackQuality(maxQualityLevel);
        }

        if (!/[?&#]t=(?:\d+h)?(?:\d+m)?(?:\d+s)?/.test(lc.href)) {
          moviePlayer.seekTo(0);
        }

        if (isMuted) {
          return;
        }

        moviePlayer.unMute();
      }

      moviePlayer.addEventListener('onStateChange', playerState => {
        if (playerState !== 3 && playerState !== 1) {
          return;
        }

        let currentID = getParamsObj(lc.search).v;

        if (prevID && prevID === currentID) {
          return;
        }

        prevID = currentID;

        operateVideo();
      });
    }

    usDoc.head.appendChild(Object.assign(usDoc.createElement('script'), {
      type: 'application/javascript;version=1.8'
    })).textContent = `(${executeYouTubeEventListener}(document, location));`
      .replace('// \'use strict\';', '\'use strict\';');
  }

  if (usDoc.getElementById('movie_player')) {
    loadScript();

    return;
  }

  nodeObserver(info => {
    if (info.node.id !== 'movie_player') {
      return;
    }

    info.options.observer.disconnect();

    loadScript();
  }, {
    target: usDoc.body,
    addOnly: true,
    childList: true,
    subtree: true
  });
}(document));
