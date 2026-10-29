console.log("main.js loaded successfully");

import { decomposeTime, composeTime, MS_IN_SEC, MS_IN_MIN, MS_IN_HR, MS_IN_DAY, MS_IN_WEEK, MS_IN_MONTH, MS_IN_YEAR } from './core/time.js';
import { createReelContainer, setReelDigit } from './ui/reels.js';
import { sfx } from './audio/sfx.js'; 

let totalMs = 0;
let isRunning = false;
let lastTime = 0;
let rafId = null;

const UNIT_MULTIPLIERS = {
    years: MS_IN_YEAR, months: MS_IN_MONTH, weeks: MS_IN_WEEK,
    days: MS_IN_DAY, hours: MS_IN_HR, minutes: MS_IN_MIN, seconds: MS_IN_SEC
};

const plusReels = document.getElementById('plus-reels');
const baseReels = document.getElementById('base-reels');
const plusSeparator = document.getElementById('plus-separator');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const sfxToggleBtn = document.getElementById('sfx-toggle');
const clockWindow = document.querySelector('.clock-window');

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

function syncFromTotalMs() {
    const time = decomposeTime(totalMs);

    document.getElementById('input-years').value = time.years;
    document.getElementById('input-months').value = time.months;
    document.getElementById('input-weeks').value = time.weeks;
    document.getElementById('input-days').value = time.days;
    document.getElementById('input-hours').value = time.hours;
    document.getElementById('input-minutes').value = time.minutes;
    document.getElementById('input-seconds').value = time.seconds;

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
    
    if (hasPlusUnits) {
        clockWindow.classList.add('scaled-down');
    } else {
        clockWindow.classList.remove('scaled-down');
    }
}

// BUTTON LISTENERS
document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log("Arrow clicked!", e.target.dataset.unit, e.target.dataset.dir);
        sfx.init(); 
        if (isRunning) return;
        
        const unit = e.target.dataset.unit;
        const dir = parseInt(e.target.dataset.dir);
        
        sfx.playTick(); 
        totalMs = Math.max(0, totalMs + (dir * UNIT_MULTIPLIERS[unit]));
        syncFromTotalMs(); 
    });
});

document.querySelectorAll('.input-wrapper input').forEach(input => {
    input.addEventListener('change', () => {
        console.log("Input box changed");
        if (isRunning) return;
        
        const newTimeObj = {
            years: parseInt(document.getElementById('input-years').value) || 0,
            months: parseInt(document.getElementById('input-months').value) || 0,
            weeks: parseInt(document.getElementById('input-weeks').value) || 0,
            days: parseInt(document.getElementById('input-days').value) || 0,
            hours: parseInt(document.getElementById('input-hours').value) || 0,
            minutes: parseInt(document.getElementById('input-minutes').value) || 0,
            seconds: parseInt(document.getElementById('input-seconds').value) || 0
        };

        totalMs = composeTime(newTimeObj);
        syncFromTotalMs();
    });
});

sfxToggleBtn.addEventListener('click', () => {
    console.log("SFX toggled");
    sfx.init();
    const isEnabled = sfx.toggle();
    sfxToggleBtn.textContent = isEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
    sfxToggleBtn.style.color = isEnabled ? 'var(--neon-cyan)' : '#666';
});

function tick(now) {
    if (!isRunning) return;
    if (!lastTime) lastTime = now;
    const delta = now - lastTime;
    lastTime = now;

    totalMs = Math.max(0, totalMs - delta);
    syncFromTotalMs();

    if (totalMs > 0) {
        rafId = requestAnimationFrame(tick);
    } else {
        isRunning = false;
        btnStart.disabled = false;
        btnPause.disabled = true;
        sfx.playAlarm(); 
    }
}

btnStart.addEventListener('click', () => {
    console.log("START clicked");
    sfx.init();
    if (totalMs === 0) return;
    isRunning = true;
    lastTime = 0;
    btnStart.disabled = true;
    btnPause.disabled = false;
    rafId = requestAnimationFrame(tick);
});

btnPause.addEventListener('click', () => {
    console.log("PAUSE clicked");
    isRunning = false;
    cancelAnimationFrame(rafId);
    btnStart.disabled = false;
    btnPause.disabled = true;
});

btnReset.addEventListener('click', () => {
    console.log("RESET clicked");
    sfx.init();
    isRunning = false;
    cancelAnimationFrame(rafId);
    totalMs = 0;
    syncFromTotalMs();
    btnStart.disabled = false;
    btnPause.disabled = true;
});

// Start everything up
initClockLayout();
syncFromTotalMs();
