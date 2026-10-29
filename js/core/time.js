export const MS_IN_SEC = 1000;
export const SEC_IN_MIN = 60;
export const MIN_IN_HR = 60;
export const HR_IN_DAY = 24;
export const DAY_IN_WEEK = 7;
export const DAY_IN_MONTH = 30; 
export const MONTH_IN_YEAR = 12;

export const MS_IN_MIN = MS_IN_SEC * SEC_IN_MIN;
export const MS_IN_HR = MS_IN_MIN * MIN_IN_HR;
export const MS_IN_DAY = MS_IN_HR * HR_IN_DAY;
export const MS_IN_WEEK = MS_IN_DAY * DAY_IN_WEEK;
export const MS_IN_MONTH = MS_IN_DAY * DAY_IN_MONTH; 
export const MS_IN_YEAR = MS_IN_MONTH * MONTH_IN_YEAR; 

export function decomposeTime(totalMs) {
    let remainder = Math.max(0, totalMs);
    const years = Math.floor(remainder / MS_IN_YEAR);
    remainder %= MS_IN_YEAR;
    const months = Math.floor(remainder / MS_IN_MONTH);
    remainder %= MS_IN_MONTH;
    const weeks = Math.floor(remainder / MS_IN_WEEK);
    remainder %= MS_IN_WEEK;
    const days = Math.floor(remainder / MS_IN_DAY);
    remainder %= MS_IN_DAY;
    const hours = Math.floor(remainder / MS_IN_HR);
    remainder %= MS_IN_HR;
    const minutes = Math.floor(remainder / MS_IN_MIN);
    remainder %= MS_IN_MIN;
    const seconds = Math.floor(remainder / MS_IN_SEC);
    remainder %= MS_IN_SEC;

    return { years, months, weeks, days, hours, minutes, seconds, ms: remainder };
}

export function composeTime(timeObj) {
    let total = 0;
    total += (timeObj.years || 0) * MS_IN_YEAR;
    total += (timeObj.months || 0) * MS_IN_MONTH;
    total += (timeObj.weeks || 0) * MS_IN_WEEK;
    total += (timeObj.days || 0) * MS_IN_DAY;
    total += (timeObj.hours || 0) * MS_IN_HR;
    total += (timeObj.minutes || 0) * MS_IN_MIN;
    total += (timeObj.seconds || 0) * MS_IN_SEC;
    return total;
}
