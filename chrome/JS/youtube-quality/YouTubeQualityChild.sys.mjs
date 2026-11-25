// Sets each YouTube video to the first of these qualities that it offers.
// highres (4320p) is left out: no monitor here shows more than 2160 lines.
const WANTED = ['hd2160', 'hd1440', 'hd1080', 'hd720'];

// Enhancer for YouTube 2.0.136 has the same setting and loses a race: it
// applies the quality while the player is still buffering and
// getAvailableQualityLevels() is empty, sets undefined, marks the job done
// and never retries, so YouTube keeps its auto pick, sized to the player
// (480p in a 682x384 player, 2026-11-25). This waits for the levels instead,
// and applies once per video, so a quality picked by hand afterwards stays.
export class YouTubeQualityChild extends JSWindowActorChild {
  handleEvent(event) {
    if (event.type !== 'DOMContentLoaded') return;
    const doc = this.document;
    let appliedTo = null;
    const apply = () => {
      // The page's own object, past the Xray, to reach YouTube's player API.
      const player = doc.getElementById('movie_player')?.wrappedJSObject;
      if (!player?.getAvailableQualityLevels) return;
      const id = player.getVideoData?.()?.video_id;
      if (!id || id === appliedTo) return;
      const levels = Array.from(player.getAvailableQualityLevels());
      const quality = WANTED.find(q => levels.includes(q));
      if (!quality) return;
      appliedTo = id;
      if (player.getPlaybackQuality() !== quality) player.setPlaybackQualityRange(quality, quality);
    };
    // Media events do not bubble, so listen in the capture phase. YouTube
    // keeps one <video> across in-page navigations, and each new video
    // fires these again. timeupdate retries while the levels are empty.
    for (const type of ['loadeddata', 'playing', 'timeupdate']) doc.addEventListener(type, apply, true);
  }
}
