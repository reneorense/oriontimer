/* ORION 2.4 — Interactive 3D Inspection
 * Raycasting, camera interaction, X-ray and mechanical disassembly.
 * Uses the same Three.js instance as the chronometer. GSAP is optional.
 * This is presentation-only; the precise countdown engine is never changed.
 */
(function () {
  'use strict';
  const COMPONENTS = {
    display: {
      title:'Digital chronometer', code:'// DISPLAY 01',
      desc:'A front-mounted holographic panel, synchronized with the live countdown. Its digits stay upright as the instrument moves.'
    },
    reactor: {
      title:'Temporal reactor', code:'// CORE 02',
      desc:'A luminous reactor lattice and axial energy shaft rotate inside the transparent cylindrical body.'
    },
    collars: {
      title:'Locking collars', code:'// COUPLING 03',
      desc:'Dual mechanical couplings stabilize the chamber. They shift outward during startup and in exploded view.'
    },
    casing: {
      title:'Wireframe chassis', code:'// CHASSIS 04',
      desc:'Layered structural rods, wire mesh, and holographic scanning surfaces form the outer pressure chamber.'
    }
  };

  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  window.ORIONInteraction = {
    create(config) {
      const {canvas,stage,camera,instrument,screen,shell,wireCasing,core,reactor,
        rotor,screenMount,leftClamp,rightClamp,endCaps,reducedMotion} = config;
      const bay = stage.closest('.core-bay');
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const buttons = [...bay.querySelectorAll('.view-btn')];
      const partButtons = [...bay.querySelectorAll('.component-pick')];
      buttons.forEach(b => b.disabled = false);
      partButtons.forEach(b => b.disabled = false);

      let targetYaw=0, targetPitch=0, targetZoom=1, zoom=1;
      let baseCamera={x:2.4,y:1.2,z:14.2};
      let xray=false, exploded=false, selected=null;
      let activePointer=null, moved=false;
      let prevX=0,prevY=0,startX=0,startY=0;
      const gsap = window.gsap && !reducedMotion ? window.gsap : null;
      const elems = {
        title:document.getElementById('inspector-title'),
        text:document.getElementById('inspector-description'),
        code:document.getElementById('inspector-code')
      };
      const btn = name => document.getElementById(`view-${name}`);

      function info(name) {
        if (!COMPONENTS[name]) return;
        selected=name;
        const part=COMPONENTS[name];
        elems.title.textContent=part.title;
        elems.text.textContent=part.desc;
        elems.code.textContent=part.code;
        partButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===name)));
        // Small additional visual cue with no effect on the timer display.
        core.scale.setScalar(name==='reactor'?1.14:1);
        stage.dataset.inspect=name;
      }

      function tween(target, values) {
        if (gsap) gsap.to(target,{...values,duration:.65,ease:'power2.inOut',overwrite:true});
        else Object.keys(values).forEach(key => {if(key!=='duration') target[key]=values[key];});
      }
      function setXray(next) {
        xray=Boolean(next);
        shell.material.opacity=xray?.065:.32;
        wireCasing.material.opacity=xray?.12:.27;
        btn('xray').setAttribute('aria-pressed',String(xray));
        btn('xray').querySelector('span').textContent=xray?'X-RAY ON':'X-RAY';
        if(xray) info('reactor');
      }
      function setExploded(next) {
        exploded=Boolean(next);
        tween(leftClamp.position,{x:exploded?-3.35:-2.56});
        tween(rightClamp.position,{x:exploded?3.35:2.56});
        tween(screenMount.position,{z:exploded?2.90:2.22});
        tween(reactor.position,{y:exploded?.52:0});
        tween(rotor.position,{y:exploded?-.45:0});
        btn('explode').setAttribute('aria-pressed',String(exploded));
        btn('explode').querySelector('span').textContent=exploded?'ASSEMBLE':'EXPLODE';
        if(exploded)info('reactor');
      }
      function resetView() {
        targetYaw=0;targetPitch=0;targetZoom=1;
      }
      function zoomBy(delta) {targetZoom=clamp(targetZoom+delta,.73,1.45);}

      btn('zoom-in').addEventListener('click',()=>zoomBy(-.13));
      btn('zoom-out').addEventListener('click',()=>zoomBy(.13));
      btn('home').addEventListener('click',resetView);
      btn('xray').addEventListener('click',()=>setXray(!xray));
      btn('explode').addEventListener('click',()=>setExploded(!exploded));
      partButtons.forEach(b=>b.addEventListener('click',()=>info(b.dataset.part)));
      btn('fullscreen').addEventListener('click',async()=>{
        try {
          if(document.fullscreenElement===bay)await document.exitFullscreen();
          else if(bay.requestFullscreen)await bay.requestFullscreen();
        } catch(error) {console.warn('Fullscreen not supported by this browser',error);}
      });
      function syncFullscreen(){
        const full=document.fullscreenElement===bay;
        const el=btn('fullscreen');
        el.querySelector('span').textContent=full?'EXIT FULLSCREEN':'FULLSCREEN';
        el.setAttribute('aria-pressed',String(full));
      }
      document.addEventListener('fullscreenchange',syncFullscreen);
      if(!bay.requestFullscreen)btn('fullscreen').disabled=true;

      function pickAt(x,y) {
        const rect=canvas.getBoundingClientRect();
        if(!rect.width || !rect.height)return;
        pointer.set((x-rect.left)/rect.width*2-1,-((y-rect.top)/rect.height*2-1));
        raycaster.setFromCamera(pointer,camera);
        // Explicitly restricted to interactive parts; the decorative particle
        // field and unselectable hologram meshes do not steal touches.
        const candidates=[screen,...endCaps,core,shell];
        const hits=raycaster.intersectObjects(candidates,false);
        if(!hits.length)return;
        const hit=hits[0].object;
        if(hit===screen)info('display');
        else if(endCaps.includes(hit))info('collars');
        else if(hit===core)info('reactor');
        else if(hit===shell)info(xray?'reactor':'casing');
      }
      // Horizontal drags keep mobile vertical page scrolling available.
      canvas.style.touchAction='pan-y';
      canvas.addEventListener('pointerdown',e=>{
        if(activePointer!==null)return;
        activePointer=e.pointerId;
        startX=prevX=e.clientX;startY=prevY=e.clientY;moved=false;
        if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove',e=>{
        if(activePointer!==e.pointerId)return;
        const dx=e.clientX-prevX,dy=e.clientY-prevY;
        if(Math.hypot(e.clientX-startX,e.clientY-startY)>8)moved=true;
        targetYaw=clamp(targetYaw+dx*.006,-.82,.82);
        targetPitch=clamp(targetPitch+dy*.003,-.35,.35);
        prevX=e.clientX;prevY=e.clientY;
      });
      canvas.addEventListener('pointerup',e=>{
        if(activePointer!==e.pointerId)return;
        activePointer=null;
        if(!moved)pickAt(e.clientX,e.clientY);
      });
      canvas.addEventListener('pointercancel',()=>{activePointer=null;});
      canvas.addEventListener('lostpointercapture',()=>{activePointer=null;});
      canvas.addEventListener('dblclick',e=>{e.preventDefault();resetView();});
      canvas.addEventListener('wheel',e=>{
        e.preventDefault();
        zoomBy(Math.sign(e.deltaY)*.065);
      },{passive:false});
      canvas.addEventListener('keydown',e=>{
        const step=.1;
        if(e.key==='ArrowLeft')targetYaw=clamp(targetYaw-step,-.82,.82);
        else if(e.key==='ArrowRight')targetYaw=clamp(targetYaw+step,-.82,.82);
        else if(e.key==='ArrowUp')targetPitch=clamp(targetPitch-step,-.35,.35);
        else if(e.key==='ArrowDown')targetPitch=clamp(targetPitch+step,-.35,.35);
        else if(e.key==='+'||e.key==='=')zoomBy(-.1);
        else if(e.key==='-')zoomBy(.1);
        else if(e.key==='Escape')resetView();
        else return;
        e.preventDefault();
      });

      // The inspection controls affect only the renderer's view. They never
      // change the countdown clock or the timer engine's run/pause state.
      return {
        configureCamera(position){baseCamera=position;},
        update(dt){
          const smoothing=Math.min(1,dt*(reducedMotion?16:7));
          instrument.rotation.y+=(targetYaw-instrument.rotation.y)*smoothing;
          instrument.rotation.x+=(targetPitch-instrument.rotation.x)*smoothing;
          zoom+=(targetZoom-zoom)*smoothing;
          camera.position.set(baseCamera.x*zoom,baseCamera.y*zoom,baseCamera.z*zoom);
          camera.lookAt(0,0,0);
        },
        isXray(){return xray;},
        isExploded(){return exploded;}
      };
    }
  };
})();
