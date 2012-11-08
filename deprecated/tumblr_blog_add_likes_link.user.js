// ==UserScript==
// @name           Tumblr Blog add Likes link
// @namespace      https://github.com/syoichi/userscript
// @version        0.0.1
// @description    add Likes link in Tumblr Blog.
// @include        http://www.tumblr.com/blog/*
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

(function executeAddLikesLink(doc) {
    'use strict';

    var settings = doc.querySelector('ul.controls_section:nth-child(2)');

    if (!settings) {
        return;
    }

    settings.insertAdjacentHTML('BeforeBegin', [
        '<ul class="controls_section">',
        '  <li class="forever_alone">',
        '    <a href="/likes" class="likes">',
        '      <div class="hide_overflow">Liked</div>',
        '    </a>',
        '  </li>',
        '</ul>'
    ].join(''));
}(document));
