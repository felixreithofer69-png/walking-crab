/**
 * Ziel:
 * - Alle Videos starten parallel (autoplay + muted ist am zuverlässigsten)
 * - Button schaltet Ton für das Hauptvideo (klick-mich) an/aus
 * - Falls Autoplay blockiert wird: Overlay "Starten" zeigt sich und startet alles per User-Gesture
 */

const videos = Array.from(document.querySelectorAll("video.vid"));
const mainVideo = document.getElementById("mainVideo");
const soundBtn = document.getElementById("soundBtn");
const overlay = document.getElementById("tapToStart");
const startBtn = document.getElementById("startBtn");

function allPlaying() {
  return videos.every(v => !v.paused && !v.ended && v.readyState >= 2);
}

async function tryPlayAll() {
  let anyBlocked = false;
  for (const v of videos) {
    // Ensure loop + inline + muted for autoplay reliability
    v.loop = true;
    v.playsInline = true;

    try {
      const p = v.play();
      if (p && typeof p.then === "function") await p;
    } catch (e) {
      anyBlocked = true;
    }
  }
  overlay.hidden = !anyBlocked;
  document.body.classList.toggle('needsTap', anyBlocked);
}

function setSoundState(on) {
  // Nur Hauptvideo soll Ton haben (wie gewünscht)
  mainVideo.muted = !on;
  if (on) {
    mainVideo.volume = 1.0;
  }
  soundBtn.setAttribute("aria-pressed", String(on));
  soundBtn.textContent = on ? "Ton: AN" : "Ton: AUS";
}

soundBtn.addEventListener("click", async () => {
  const turningOn = mainVideo.muted; // if muted -> turning on
  setSoundState(turningOn);

  // Klick ist eine User-Gesture: wir nutzen sie auch, um ggf. Autoplay zu "entsperren"
  await tryPlayAll();
  // Wenn es trotzdem blockiert bleibt, Button wieder zurücksetzen
  if (!overlay.hidden && startBtn) startBtn.textContent = 'Starten';
});

async function handleUserStart(){
  try{
    if (startBtn) startBtn.textContent = 'Starte…';
  } catch(e) {}
  // Videos wieder einblenden, dann abspielen (User-Gesture)
  document.body.classList.remove('needsTap');
  overlay.hidden = true;
  await new Promise(requestAnimationFrame);
  await tryPlayAll();
  // Wenn es trotzdem blockiert bleibt, Button wieder zurücksetzen
  if (!overlay.hidden && startBtn) startBtn.textContent = 'Starten';
}

startBtn?.addEventListener("click", async () => {
  await handleUserStart();
});

// Initial state: all muted (inkl. Hauptvideo) - wie gewünscht
setSoundState(false);

// Attempt autoplay on load
tryPlayAll();

// If page becomes visible again (e.g., app switch), ensure playback resumes
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    tryPlayAll();
  }
});

// Tippen irgendwo auf die Fläche startet ebenfalls (hilft auf manchen Geräten)
overlay?.addEventListener("click", async (e) => {
  // Nur wenn man nicht direkt auf den Button klickt (der hat eigene Logik)
  if (e.target === overlay) {
    await handleUserStart();
  }
});


window.handleUserStart = handleUserStart;

// Ultimate fallback: jeder Tap/Klick irgendwo startet (capture), damit es wirklich geht.
window.addEventListener("pointerdown", async () => {
  if (!overlay.hidden) {
    await handleUserStart();
  }
}, {capture: true});
