import {TimerEngine} from './core/engine.js';
import {setupControls, syncInputBoxes} from './ui/controls.js';
import {sfx} from './audio/sfx.js';

const startBtn=document.getElementById('btn-start');
const pauseBtn=document.getElementById('btn-pause');
const resetBtn=document.getElementById('btn-reset');
const sfxToggle=document.getElementById('sfx-toggle');
const statusEl=document.getElementById('mission-status');
const telemetryTime=document.getElementById('telemetry-time');
const fallbackTime=document.getElementById('fallback-time');
const reactorStatus=document.getElementById('reactor-status');
const progressFill=document.getElementById('mission-progress-fill');
const progressEl=document.getElementById('mission-progress');
const progressNumber=document.getElementById('progress-number');
const presets=Array.from(document.querySelectorAll('.preset-btn'));

let initialDurationMs=0;
let paused=false;
let lastDisplay='';

/** Readable clock format used by both DOM and the real 3D CanvasTexture. */
export function formatCountdown(ms){
  const totalSeconds=Math.max(0,Math.ceil(ms/1000));
  const days=Math.floor(totalSeconds/86400);
  const hours=Math.floor((totalSeconds%86400)/3600);
  const minutes=Math.floor((totalSeconds%3600)/60);
  const seconds=totalSeconds%60;
  const pad=n=>String(n).padStart(2,'0');
  if(days>0)return `${days}D ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if(hours>0)return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function setStatus(message,mode='idle'){
  statusEl.textContent=message;
  statusEl.dataset.mode=mode;
  reactorStatus.textContent={running:'COUNTDOWN ACTIVE',paused:'POWER HOLD',complete:'MISSION COMPLETE',idle:'STANDBY'}[mode]||'STANDBY';
  document.body.dataset.mode=mode;
}

function notify3DEngine(isRunning=false,state='idle'){
  window.dispatchEvent(new CustomEvent('timerStateChanged',{detail:{isRunning,isPaused:state==='paused',isComplete:state==='complete'}}));
}

function updateClockDisplay(ms){
  const progress=initialDurationMs>0?Math.min(1,Math.max(0,ms/initialDurationMs)):0;
  const display=formatCountdown(ms);
  // The expensive texture is repainted only when its digits or state change.
  telemetryTime.textContent=display;
  fallbackTime.textContent=display;
  progressFill.style.transform=`scaleX(${progress})`;
  progressEl.setAttribute('aria-valuenow',String(Math.round(progress*100)));
  progressNumber.textContent=`${String(Math.round(progress*100)).padStart(3,'0')}%`;
  syncInputBoxes(ms);
  window.dispatchEvent(new CustomEvent('timerProgress',{
    detail:{remainingMs:ms,totalMs:initialDurationMs,progress,display}
  }));
  lastDisplay=display;
}

const engine=new TimerEngine(
  ms=>updateClockDisplay(ms),
  ()=>{
    paused=false;
    startBtn.disabled=true;
    pauseBtn.disabled=true;
    startBtn.innerHTML='<span class="action-symbol">▶</span> INITIALIZE';
    setStatus('MISSION COMPLETE','complete');
    notify3DEngine(false,'complete');
    sfx.playAlarm();
  }
);

function setDuration(ms){
  if(engine.isRunning)return;
  paused=false;
  initialDurationMs=Math.max(0,Number(ms)||0);
  engine.setTime(initialDurationMs);
  startBtn.disabled=initialDurationMs<=0;
  pauseBtn.disabled=true;
  startBtn.innerHTML='<span class="action-symbol">▶</span> INITIALIZE';
  setStatus(initialDurationMs>0?'MISSION ARMED':'AWAITING INPUT','idle');
  notify3DEngine(false,'idle');
  presets.forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.minutes)*60000===initialDurationMs));
}

setupControls(ms=>setDuration(ms),()=>engine.isRunning,sfx);

presets.forEach(button=>button.addEventListener('click',()=>{
  if(engine.isRunning)return;
  sfx.init();sfx.playTick();
  setDuration(Number(button.dataset.minutes)*60000);
}));

startBtn.addEventListener('click',()=>{
  sfx.init();
  if(!engine.start())return;
  paused=false;
  startBtn.disabled=true;
  pauseBtn.disabled=false;
  setStatus('COUNTDOWN ACTIVE','running');
  notify3DEngine(true,'running');
});

pauseBtn.addEventListener('click',()=>{
  if(!engine.isRunning)return;
  engine.pause();
  paused=true;
  startBtn.disabled=engine.remainingMs<=0;
  pauseBtn.disabled=true;
  startBtn.innerHTML='<span class="action-symbol">▶</span> RESUME';
  setStatus('MISSION PAUSED','paused');
  notify3DEngine(false,'paused');
});

resetBtn.addEventListener('click',()=>{
  engine.reset();
  initialDurationMs=0;
  paused=false;
  startBtn.disabled=true;
  pauseBtn.disabled=true;
  startBtn.innerHTML='<span class="action-symbol">▶</span> INITIALIZE';
  setStatus('AWAITING INPUT','idle');
  notify3DEngine(false,'idle');
  presets.forEach(btn=>btn.classList.remove('active'));
});

sfxToggle.addEventListener('click',()=>{
  sfx.init();
  const enabled=sfx.toggle();
  sfxToggle.textContent=enabled?'SFX ON':'SFX OFF';
  sfxToggle.setAttribute('aria-pressed',String(enabled));
});

// Re-sync initial time with the 3D scene after its asynchronous renderer starts.
window.addEventListener('orion3DReady',()=>{
  updateClockDisplay(engine.remainingMs);
  notify3DEngine(engine.isRunning,engine.isRunning?'running':statusEl.dataset.mode==='complete'?'complete':paused?'paused':'idle');
});

// Begin with a ready-to-launch 05:00 demonstration, making the physical 3D
// instrument immediately useful instead of showing a static zero clock.
setDuration(5*60000);
