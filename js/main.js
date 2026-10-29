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
const hudWrapper = document.getElementById('hud-wrapper'); // NEW: The rings container

// 1. Initialize Engine
const engine = new TimerEngine(
    (ms) => updateClockDisplay(ms), 
    () => {                         
        btnStart.disabled = false;
        btnPause.disabled = true;
        sfx.playAlarm();
        hudWrapper.classList.remove('active'); // Rings slow down when finished
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
    (newMs) => engine.setTime(newMs), 
    () => engine.isRunning,           
    sfx
);

// 5. Buttons
btnStart.addEventListener('click', () => {
    sfx.init();
    engine.start();
    btnStart.disabled = true;
    btnPause.disabled = false;
    hudWrapper.classList.add('active'); // Rings spin fast
});

btnPause.addEventListener('click', () => {
    engine.pause();
    btnStart.disabled = false;
    btnPause.disabled = true;
    hudWrapper.classList.remove('active'); // Rings slow down
});

btnReset.addEventListener('click', () => {
    sfx.init();
    engine.reset();
    btnStart.disabled = false;
    btnPause.disabled = true;
    hudWrapper.classList.remove('active'); // Rings slow down
});

sfxToggleBtn.addEventListener('click', () => {
    sfx.init();
    const isEnabled = sfx.toggle();
    sfxToggleBtn.textContent = isEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
    sfxToggleBtn.style.color = isEnabled ? 'var(--neon-cyan)' : '#666';
});

// 6. Start
initClockLayout();
engine.setTime(0); 
