// ==UserScript==
// @name           YouTube Quality
// @description    Plays every YouTube video at the highest quality up to 2160p
// @author         AlexanderReaper7
// @version        1.0.0
// @homepageURL    https://github.com/AlexanderReaper7/firefox-extras
// ==/UserScript==

// A background module, so it runs once in the parent process. The work happens
// in YouTubeQualityChild, which Firefox loads inside each YouTube page's
// content process. fx-autoconfig's own @WindowActor support cannot do this: it
// registers actors for the privilegedabout and parent processes only.
//
// Firefox looks for an export named after the actor plus "Child", so the
// actor's name, the class and the file name must agree. Firefox 160 refuses
// to create an actor in a web process ("doesn't match remote type
// 'webIsolated=https://youtube.com'") unless it is marked
// safeForUntrustedWebProcess. That flag guards actors whose parent side has
// powers a compromised web process could reach. This one has no parent side
// and sends no messages, so the flag gives that process nothing.
try {
  ChromeUtils.registerWindowActor('YouTubeQuality', {
    child: {
      esModuleURI: 'chrome://userscripts/content/youtube-quality/YouTubeQualityChild.sys.mjs',
      events: { DOMContentLoaded: {} },
    },
    matches: ['*://www.youtube.com/*'],
    safeForUntrustedWebProcess: true,
  });
} catch (ex) {
  console.error('[youtube-quality] registerWindowActor failed', ex);
}

export {};
