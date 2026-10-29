/* ORION motion director.
 * Uses GSAP by GreenSock if available; straightforward immediate fallback when
 * GSAP is blocked so the timer itself is never dependent on an animation CDN.
 * https://github.com/greensock/GSAP
 */
(function () {
  'use strict';
  window.ORIONMotion = {
    create(targets, reducedMotion) {
      const hasGSAP = typeof window.gsap !== 'undefined' && !reducedMotion;
      let sequence = null;
      const reset = () => {
        if (sequence) { sequence.kill(); sequence = null; }
        if (hasGSAP) window.gsap.killTweensOf([targets.instrument.scale, targets.screen.scale, targets.glow.scale, targets.flash.material, targets.leftClamp.position, targets.rightClamp.position]);
      };
      return {
        initialize() {
          if (!hasGSAP) return;
          targets.instrument.scale.setScalar(0.96);
          targets.screen.scale.setScalar(0.95);
          sequence = window.gsap.timeline({ defaults: { ease: 'power2.out' } });
          sequence.to(targets.instrument.scale, {x:1,y:1,z:1,duration:1.1})
            .to(targets.screen.scale,{x:1,y:1,z:1,duration:0.65},'<0.25')
            .fromTo(targets.flash.material,{opacity:0.0},{opacity:0.27,duration:0.12,yoyo:true,repeat:1},'<0.15');
        },
        change(state) {
          reset();
          const running = state === 'running';
          const complete = state === 'complete';
          const paused = state === 'paused';
          const scale = running ? 1.1 : paused ? 0.92 : complete ? 1.20 : 0.98;
          const glow = running ? 1.12 : paused ? 0.80 : complete ? 1.28 : 1.0;
          const clamp = running ? 0.12 : 0;
          if (!hasGSAP) {
            targets.glow.scale.setScalar(glow);
            targets.leftClamp.position.x = -2.56 - clamp;
            targets.rightClamp.position.x = 2.56 + clamp;
            targets.screen.scale.setScalar(1);
            targets.flash.material.opacity=0;
            return;
          }
          sequence = window.gsap.timeline({ defaults: { ease:'power2.out' } });
          sequence.to(targets.glow.scale,{x:glow,y:glow,z:glow,duration:0.85},0)
            .to(targets.leftClamp.position,{x:-2.56-clamp,duration:0.5},0)
            .to(targets.rightClamp.position,{x:2.56+clamp,duration:0.5},0)
            .to(targets.screen.scale,{x:scale,y:scale,z:1,duration:0.38,yoyo:true,repeat:1},0);
          if (running || complete) {
            sequence.fromTo(targets.flash.material,{opacity:0},{opacity:complete?0.60:0.43,duration:0.12,repeat:1,yoyo:true},0);
          }
        },
        dispose() { reset(); }
      };
    }
  };
})();
