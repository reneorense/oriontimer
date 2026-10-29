import { decomposeTime, MS_IN_SEC, MS_IN_MIN, MS_IN_HR, MS_IN_DAY, MS_IN_WEEK, MS_IN_MONTH, MS_IN_YEAR } from './core/time.js';
import { createReelContainer, setReelDigit } from './ui/reels.js';

// --- State ---
let totalMs = 0;
let isRunning = false;
let lastTime = 0;
let rafId = null;

// Multipliers for the input steppers
const UNIT_MULTIPLIERS = {
    years: MS_IN_YEAR,
    months: MS_IN_MONTH,
    weeks: MS_IN_WEEK,
    days: MS_IN_DAY,
    hours: MS_IN_HR,
    minutes: MS_IN_MIN,
    seconds: MS_IN_SEC
};

// DOM Elements
const plusReels = document.getElementById('plus-reels');
const baseReels = document.getElementById('base-reels');
const plusSeparator = document.getElementById('plus-separator');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');

// --- 1. Build the Reels ---
function initClockLayout() {
    plusReels.innerHTML = '';
    baseReels.innerHTML = '';

    // Build Plus Reels (Years, Months, Weeks)
    plusReels.appendChild(createReelContainer('years-tens', 'YRS'));
    plusReels.appendChild(createReelContainer('years-ones', ''));
    plusReels.appendChild(createReelContainer('months-tens', 'MOS'));
    plusReels.appendChild(createReelContainer('months-ones', ''));
    plusReels.appendChild(createReelContainer('weeks-tens', 'WKS'));
    plusReels.appendChild(createReelContainer('weeks-ones', ''));

    // Build Base Reels (Days, Hours, Minutes, Seconds, MS)
    baseReels.appendChild(createReelContainer('days-tens', 'DAYS'));
    baseReels.appendChild(createReelContainer('days-ones', ''));
    
    baseReels.appendChild(createReelContainer('hours-tens', 'HRS'));
    baseReels.appendChild(createReelContainer('hours-ones', ''));
    
    baseReels.appendChild(createReelContainer('minutes-tens', 'MIN'));
    baseReels.appendChild(createReelContainer('minutes-ones', ''));
    
    baseReels.appendChild(createReelContainer('seconds-tens', 'SEC'));
    baseReels.appendChild(createReelContainer('seconds-ones', ''));

    // MS (Only showing the hundreds and tens for visual speed)
    baseReels.appendChild(createReelContainer('ms-hundreds', 'MS'));
    baseReels.appendChild(createReelContainer('ms-tens', ''));
}

// --- 2. Render Logic ---
function updateClockDisplay() {
    const time = decomposeTime(totalMs);

    // Plus Reels
    setReelDigit('years-tens', Math.floor(time.years / 10), '#ff00ea');
    setReelDigit('years-ones', time.years % 10, '#ff00ea');
    setReelDigit('months-tens', Math.floor(time.months / 10), '#ff00ea');
    setReelDigit('months-ones', time.months % 10, '#ff00ea');
    setReelDigit('weeks-tens', Math.floor(time.weeks / 10), '#ff00ea');
    setReelDigit('weeks-ones', time.weeks % 10, '#ff00ea');

    // Base Reels
    setReelDigit('days-tens', Math.floor(time.days / 10), '#ffb800');
    setReelDigit('days-ones', time.days % 10, '#ffb800');
    setReelDigit('hours-tens', Math.floor(time.hours / 10), '#00ff66');
    setReelDigit('hours-ones', time.hours % 10, '#00ff66');
    setReelDigit('minutes-tens', Math.floor(time.minutes / 10), '#00ff66');
    setReelDigit('minutes-ones', time.minutes % 10, '#00ff66');
    setReelDigit('seconds-tens', Math.floor(time.seconds / 10), '#00f3ff');
    setReelDigit('seconds-ones', time.seconds % 10, '#00f3ff');
    
    // Milliseconds (Math.floor(time.ms / 10) gives us the 2-digit display)
    setReelDigit('ms-hundreds', Math.floor(time.ms / 100), '#5a7a9e');
    setReelDigit('ms-tens', Math.floor((time.ms % 100) / 10), '#5a7a9e');

    // Toggle "+" Block visibility based on if there are any weeks/months/years
    const hasPlusUnits = time.years > 0 || time.months > 0 || time.weeks > 0;
    plusReels.classList.toggle('hidden', !hasPlusUnits);
    plusSeparator.classList.toggle('hidden', !hasPlusUnits);
}

// --- 3. Input Steppers ---
document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (isRunning) return; // Prevent changes while running

        const unit = e.target.dataset.unit;
        const dir = parseInt(e.target.dataset.dir);
        const multiplier = UNIT_MULTIPLIERS[unit];

        // Add or subtract the exact millisecond value of that unit
        totalMs = Math.max(0, totalMs + (dir * multiplier));
        
        // Update the input field visually
        const timeObj = decomposeTime(totalMs);
        document.getElementById(`input-${unit}`).value = timeObj[unit];
        
        updateClockDisplay();
    });
});

// --- 4. Timer Engine ---
function tick(now) {
    if (!isRunning) return;

    if (!lastTime) lastTime = now;
    const delta = now - lastTime;
    lastTime = now;

    totalMs = Math.max(0, totalMs - delta);
    
    // Update the display
    updateClockDisplay();

    if (totalMs > 0) {
        rafId = requestAnimationFrame(tick);
    } else {
        isRunning = false;
        btnStart.disabled = false;
        btnPause.disabled = true;
        // Future: Trigger alarm sound here
    }
}

// --- 5. Controls ---
btnStart.addEventListener('click', () => {
    if (totalMs === 0) return;
    isRunning = true;
    lastTime = 0;
    btnStart.disabled = true;
    btnPause.disabled = false;
    rafId = requestAnimationFrame(tick);
});

btnPause.addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(rafId);
    btnStart.disabled = false;
    btnPause.disabled = true;
});

btnReset.addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(rafId);
    totalMs = 0;
    
    // Reset input fields
    document.querySelectorAll('.input-wrapper input').forEach(input => input.value = 0);
    
    updateClockDisplay();
    btnStart.disabled = false;
    btnPause.disabled = true;
});

// --- Init ---
initClockLayout();
updateClockDisplay();
