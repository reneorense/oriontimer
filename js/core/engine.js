export class TimerEngine {
    constructor(onTick, onFinish) {
        this.onTick = onTick;
        this.onFinish = onFinish;
        this.remainingMs = 0;
        this.isRunning = false;
        this.lastTime = 0;
        this.rafId = null;
    }

    setTime(ms) {
        if (this.isRunning) return; // Don't change time while running
        this.remainingMs = Math.max(0, ms);
        this.onTick(this.remainingMs);
    }

    getTime() {
        return this.remainingMs;
    }

    start() {
        if (this.isRunning || this.remainingMs <= 0) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    pause() {
        this.isRunning = false;
        cancelAnimationFrame(this.rafId);
    }

    reset() {
        this.pause();
        this.remainingMs = 0;
        this.onTick(0);
    }

    loop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        this.remainingMs = Math.max(0, this.remainingMs - delta);
        this.onTick(this.remainingMs);

        if (this.remainingMs > 0) {
            this.rafId = requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
            this.onFinish();
        }
    }
}
