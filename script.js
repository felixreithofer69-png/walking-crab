/**
 * Finale Version (GitHub Pages / Mobile robust):
 * - KEIN Autoplay beim Laden (Browser blockiert sonst zuverlässig bei mehreren Videos).
 * - Erst nach User-Klick auf "Start" starten wir alle Videos parallel.
 * - Ton bleibt aus; Button schaltet Ton NUR für das Hauptvideo ein/aus.
 */

const videos = Array.from(document.querySelectorAll("video.vid"));
const mainVideo = document.getElementById("mainVideo");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const soundBtn = document.getElementById("soundBtn");

let started = false;

function setSoundState(on) {
  mainVideo.muted = !on;
  if (on) mainVideo.volume = 1.0;
  soundBtn.setAttribute("aria-pressed", String(on));
  soundBtn.textContent = on ? "Ton: AN" : "Ton: AUS";
}

async function startAllVideosFromUserGesture() {
  // alles stumm vorbereiten (autoplay-policy-freundlich)
  for (const v of videos) {
    v.loop = true;
    v.playsInline = true;
    v.muted = true;
  }
  // parallel starten
  const plays = videos.map(v => {
    try { return v.play(); } catch (e) { return Promise.reject(e); }
  });
  await Promise.allSettled(plays);
}

startBtn.addEventListener("click", async () => {
  if (started) return;
  started = true;
  startBtn.textContent = "Starte…";

  await startAllVideosFromUserGesture();

  // Startscreen weg
  startScreen.style.display = "none";

  // Ton-Button aktivieren (Ton bleibt vorerst AUS)
  soundBtn.disabled = false;
  setSoundState(false);
});

soundBtn.addEventListener("click", async () => {
  const turningOn = mainVideo.muted;
  setSoundState(turningOn);

  // Falls ein Browser beim Umschalten pausiert: nochmal sicher abspielen
  if (started) {
    try { await mainVideo.play(); } catch(e) {}
  }
});

// Initial: Ton aus
setSoundState(false);
