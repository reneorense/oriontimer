import { decomposeTime } from './core/time.js';
import { TimerEngine } from './core/engine.js';
import { setupControls, syncInputBoxes } from './ui/controls.js';
import { createReelContainer, setReelDigit } from './ui/reels.js';
import { sfx } from './audio/sfx.js'; 

const plusReels = document.getElementById('plus-reels');
const baseReels = document.getElementById('base-reels');
const plusSeparator = document.getElementById('plus-separator');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const sfxToggleBtn = document.getElementById('sfx-toggle');
const clockWindow = document.querySelector('.clock-window');
const missionStatus = document.getElementById('mission-status');
const missionProgress = document.getElementById('mission-progress');
const missionProgressFill = document.getElementById('mission-progress-fill');
let initialDurationMs = 0;
let completed = false;

function setStatus(text, mode = 'idle') {
    missionStatus.textContent = text;
    missionStatus.dataset.mode = mode;
}

function setDuration(ms) {
    // Only idle/paused countdowns can be edited. A fresh duration becomes the baseline.
    if (engine.isRunning) return;
    initialDurationMs = Math.max(0, ms);
    completed = false;
    engine.setTime(initialDurationMs);
    setStatus(initialDurationMs > 0 ? 'MISSION READY' : 'AWAITING INPUT', 'idle');
    btnStart.disabled = initialDurationMs <= 0;
    btnPause.disabled = true;
    notify3DEngine(false);
}


// Function to notify the 3D engine of state changes
function notify3DEngine(isRunning) {
    const event = new CustomEvent('timerStateChanged', { detail: { isRunning } });
    window.dispatchEvent(event);
}

// 1. Initialize Engine
const engine = new TimerEngine(
    (ms) => updateClockDisplay(ms), 
    () => {                         
        completed = true;
        btnStart.disabled = true;
        btnPause.disabled = true;
        setStatus('MISSION COMPLETE', 'complete');
        sfx.playAlarm();
        notify3DEngine(false); // Stop 3D spin
    }
);

// 2. Build 3D Reels
function initClockLayout() {
    plusReels.innerHTML = '';
    baseReels.innerHTML = '';

    plusReels.appendChild(createReelContainer('years-tens', 'YRS'));
    plusReels.appendChild(createReelContainer('years-ones', ''));
    plusReels.appendChild(createReelContainer('months-tens', 'MOS'));
    plusReels.appendChild(createReelContainer('months-ones', ''));
    plusReels.appendChild(createReelContainer('weeks-tens', 'WKS'));
    plusReels.appendChild(createReelContainer('weeks-ones', ''));

    baseReels.appendChild(createReelContainer('days-tens', 'DAYS'));
    baseReels.appendChild(createReelContainer('days-ones', ''));
    baseReels.appendChild(createReelContainer('hours-tens', 'HRS'));
    baseReels.appendChild(createReelContainer('hours-ones', ''));
    baseReels.appendChild(createReelContainer('minutes-tens', 'MIN'));
    baseReels.appendChild(createReelContainer('minutes-ones', ''));
    baseReels.appendChild(createReelContainer('seconds-tens', 'SEC'));
    baseReels.appendChild(createReelContainer('seconds-ones', ''));
    baseReels.appendChild(createReelContainer('ms-hundreds', 'MS'));
    baseReels.appendChild(createReelContainer('ms-tens', ''));
}

// 3. Update Visuals
function updateClockDisplay(ms) {
    syncInputBoxes(ms);
    const progress = initialDurationMs > 0 ? Math.max(0, Math.min(1, ms / initialDurationMs)) : 0;
    missionProgressFill.style.transform = `scaleX(${progress})`;
    missionProgress.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    window.dispatchEvent(new CustomEvent('timerProgress', {
        detail: { remainingMs: ms, totalMs: initialDurationMs, progress }
    }));
    const time = decomposeTime(ms);

    setReelDigit('years-tens', Math.floor(time.years / 10), '#ff00ea');
    setReelDigit('years-ones', time.years % 10, '#ff00ea');
    setReelDigit('months-tens', Math.floor(time.months / 10), '#ff00ea');
    setReelDigit('months-ones', time.months % 10, '#ff00ea');
    setReelDigit('weeks-tens', Math.floor(time.weeks / 10), '#ff00ea');
    setReelDigit('weeks-ones', time.weeks % 10, '#ff00ea');

    setReelDigit('days-tens', Math.floor(time.days / 10), '#ffb800');
    setReelDigit('days-ones', time.days % 10, '#ffb800');
    setReelDigit('hours-tens', Math.floor(time.hours / 10), '#00ff66');
    setReelDigit('hours-ones', time.hours % 10, '#00ff66');
    setReelDigit('minutes-tens', Math.floor(time.minutes / 10), '#00ff66');
    setReelDigit('minutes-ones', time.minutes % 10, '#00ff66');
    setReelDigit('seconds-tens', Math.floor(time.seconds / 10), '#00f3ff');
    setReelDigit('seconds-ones', time.seconds % 10, '#00f3ff');
    setReelDigit('ms-hundreds', Math.floor(time.ms / 100), '#5a7a9e');
    setReelDigit('ms-tens', Math.floor((time.ms % 100) / 10), '#5a7a9e');

    const hasPlusUnits = time.years > 0 || time.months > 0 || time.weeks > 0;
    plusReels.classList.toggle('hidden', !hasPlusUnits);
    plusSeparator.classList.toggle('hidden', !hasPlusUnits);
    
    if (hasPlusUnits) clockWindow.classList.add('scaled-down');
    else clockWindow.classList.remove('scaled-down');
}

// 4. Setup Controls
setupControls(
    (newMs) => setDuration(newMs), 
    () => engine.isRunning,           
    sfx
);

// 5. Buttons
btnStart.addEventListener('click', () => {
    sfx.init();
    if (!engine.start()) return;
    completed = false;
    btnStart.disabled = true;
    btnPause.disabled = false;
    setStatus('MISSION ACTIVE', 'running');
    notify3DEngine(true); // Trigger 3D spin up
});

btnPause.addEventListener('click', () => {
    engine.pause();
    btnStart.disabled = engine.remainingMs <= 0;
    btnPause.disabled = true;
    setStatus('MISSION PAUSED', 'paused');
    notify3DEngine(false); // Trigger 3D slow down
});

btnReset.addEventListener('click', () => {
    sfx.init();
    engine.reset();
    initialDurationMs = 0;
    completed = false;
    btnStart.disabled = true;
    btnPause.disabled = true;
    setStatus('AWAITING INPUT', 'idle');
    notify3DEngine(false); // Trigger 3D slow down
});

sfxToggleBtn.addEventListener('click', () => {
    sfx.init();
    const isEnabled = sfx.toggle();
    sfxToggleBtn.textContent = isEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
    sfxToggleBtn.setAttribute('aria-pressed', String(isEnabled));
    sfxToggleBtn.style.color = isEnabled ? 'var(--neon-cyan)' : '#666';
});

// Quick presets are separate from the fine-grained time controls.
document.querySelectorAll('.preset-btn').forEach(button => {
    button.addEventListener('click', () => {
        if (engine.isRunning) return;
        sfx.init();
        sfx.playTick();
        setDuration(Number(button.dataset.minutes) * 60 * 1000);
    });
});

// 6. Start
initClockLayout();
setDuration(0); 
