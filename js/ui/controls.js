import { composeTime, decomposeTime, MS_IN_SEC, MS_IN_MIN, MS_IN_HR, MS_IN_DAY, MS_IN_WEEK, MS_IN_MONTH, MS_IN_YEAR } from '../core/time.js';

const UNIT_MULTIPLIERS = {
    years: MS_IN_YEAR, months: MS_IN_MONTH, weeks: MS_IN_WEEK,
    days: MS_IN_DAY, hours: MS_IN_HR, minutes: MS_IN_MIN, seconds: MS_IN_SEC
};

export function setupControls(onTimeChanged, isRunning, sfx) {
    // 1. Arrow Buttons
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            sfx.init();
            if (isRunning()) return;
            
            const unit = e.target.dataset.unit;
            const dir = parseInt(e.target.dataset.dir);
            
            sfx.playTick();
            // Read from the hidden tracker in HTML
            const tracker = document.getElementById('hidden-ms-tracker');
            const currentMs = parseInt(tracker.value) || 0;
            
            const newMs = Math.max(0, currentMs + (dir * UNIT_MULTIPLIERS[unit]));
            onTimeChanged(newMs);
        });
    });

    // 2. Manual Typing
    document.querySelectorAll('.input-wrapper input').forEach(input => {
        input.addEventListener('change', () => {
            if (isRunning()) return;
            
            const newTimeObj = {
                years: parseInt(document.getElementById('input-years').value) || 0,
                months: parseInt(document.getElementById('input-months').value) || 0,
                weeks: parseInt(document.getElementById('input-weeks').value) || 0,
                days: parseInt(document.getElementById('input-days').value) || 0,
                hours: parseInt(document.getElementById('input-hours').value) || 0,
                minutes: parseInt(document.getElementById('input-minutes').value) || 0,
                seconds: parseInt(document.getElementById('input-seconds').value) || 0
            };
            
            onTimeChanged(composeTime(newTimeObj));
        });
    });
}

export function syncInputBoxes(ms) {
    // Update the hidden tracker
    document.getElementById('hidden-ms-tracker').value = ms;

    // Update the visible inputs
    const time = decomposeTime(ms);
    document.getElementById('input-years').value = time.years;
    document.getElementById('input-months').value = time.months;
    document.getElementById('input-weeks').value = time.weeks;
    document.getElementById('input-days').value = time.days;
    document.getElementById('input-hours').value = time.hours;
    document.getElementById('input-minutes').value = time.minutes;
    document.getElementById('input-seconds').value = time.seconds;
}
