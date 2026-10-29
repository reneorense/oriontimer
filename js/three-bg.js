/* ORION 2.6: Hybrid mechanical holographic chrono-core. */
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
      title:'Drive collars', code:'// COUPLING 03',
      desc:'Motorized locking collars, hydraulic catches, and geared couplings stabilize the chamber. They shift outward during startup and in exploded view.'
    },
    casing: {
      title:'Wireframe chassis', code:'// CHASSIS 04',
      desc:'Metallic cog drives, motor housings, coolant conduits, and wire mesh form the outer pressure chamber.'
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


/* ORION Chrono Core 2.6 — Hybrid Reactor Edition
 * The horizontal machine and its upright display are separate children of one
 * inspectable instrument. Neither the display nor its digits receive roll.
 * Three.js r128, plain JavaScript, GitHub Pages compatible, no build step.
 */
window.addEventListener('load', () => {
  'use strict';
  const stage = document.getElementById('chrono-stage');
  const canvas = document.getElementById('three-canvas');
  if (!stage || !canvas || typeof THREE === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:window.innerWidth>=700,powerPreference:'default'});
  } catch (err) {
    console.warn('ORION: 3D unavailable; keeping accessible 2D schematic.',err);
    return;
  }
  renderer.setClearColor(0x000000,0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37,1,0.1,100);
  const instrument = new THREE.Group();
  scene.add(instrument);

  const C = {cyan:0x70f4ff, glow:0x16dfff,blue:0x258af8, dark:0x071524, pale:0xe9ffff, warning:0xffaf61};
  const matte = (color, opacity=1) => new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:opacity===1});
  const metalMat = (color=0x24445b) => new THREE.MeshStandardMaterial({color,metalness:.78,roughness:.38,side:THREE.DoubleSide});
  scene.add(new THREE.AmbientLight(0x75caff,.92));
  const keyLight=new THREE.PointLight(0x86f5ff,2.35,32);keyLight.position.set(-3,4,8);scene.add(keyLight);
  const rimLight=new THREE.PointLight(0x2b6aff,1.35,29);rimLight.position.set(3,-3,-5);scene.add(rimLight);
  const glowMat = (color=C.cyan,opacity=.8) => new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const lineMat = (color=C.cyan,opacity=.5) => new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});

  const torus = (radius,tube,y,material) => {
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,96),material);
    mesh.rotation.x=Math.PI/2;mesh.position.y=y;return mesh;
  };
  const createCogWheel = ({outer=.82, inner=.28, teeth=16, depth=.14, color=0x50e8ff, accent=0x173c58}={}) => {
    const group = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.RingGeometry(inner, outer, teeth*3, 1), metalMat(0x17374c));
    group.add(plate);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(outer, depth*.38, 8, teeth*4), metalMat(0x527488));
    group.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(inner*.46, inner*.46, depth, 18, 1, false), matte(0x0c2738,.95));
    hub.rotation.x = Math.PI/2;
    group.add(hub);
    for(let i=0;i<teeth;i++){
      const a=i*Math.PI*2/teeth;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(depth*.9, depth*.54, depth*1.2), metalMat(i%2?0x325569:0x63829b));
      tooth.position.set(Math.cos(a)*(outer+.07), Math.sin(a)*(outer+.07), 0);
      tooth.rotation.z=a;
      group.add(tooth);
    }
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2 + Math.PI/4;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(outer*1.06, depth*.30, depth*.85), metalMat(0x27485b));
      spoke.rotation.z=a;
      group.add(spoke);
    }
    const halo = new THREE.Mesh(new THREE.RingGeometry(outer+.12, outer+.17, 42, 1), glowMat(color,.38));
    group.add(halo);
    return group;
  };
  const cylinder=(radius,height,material,radial=40,vertical=1,open=true)=>new THREE.Mesh(
    new THREE.CylinderGeometry(radius,radius,height,radial,vertical,open),material
  );

  // All cylindrical geometry is created along its LOCAL Y axis then turned
  // sideways. The screen is NOT a child of this rotated group.
  const machine = new THREE.Group();
  machine.rotation.z = -Math.PI/2;
  instrument.add(machine);
  const casing = new THREE.Group(); machine.add(casing);
  const shell = cylinder(1.76,7.0,matte(0x07213b,.32),40,1,true);
  casing.add(shell);
  const wireCasing = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.CylinderGeometry(1.83,1.83,6.96,32,13,true)),
    lineMat(0x45ceff,.27)
  );
  casing.add(wireCasing);
  const hologram = window.ORIONHologram && window.ORIONHologram.create({color:C.glow,opacity:.44,scanDensity:23});
  const shimmer = cylinder(1.88,6.75,hologram ? hologram.material : glowMat(C.glow,.09),48,1,true);
  casing.add(shimmer);
  const interior=cylinder(1.19,6.6,glowMat(0x18adf1,.035),32,1,true);
  casing.add(interior);
  // Radial structural rods, running lengthwise through the translucent shell.
  for(let i=0;i<18;i++) {
    const theta=i*Math.PI*2/18;
    const x=Math.cos(theta)*1.9,z=Math.sin(theta)*1.9;
    const thick=i%3===0;
    const beam=cylinder(thick?.041:.018,6.88,glowMat(thick?0x4dd9ff:0x2d91c0,thick?.67:.39),7);
    beam.position.set(x,0,z);casing.add(beam);
  }
  // End caps and machined collars.
  const endCaps = [];
  for(const side of [-1,1]) {
    const y=3.47*side;
    const endCylinder=cylinder(1.78,.29,metalMat(0x24394c),48,1,false);
    endCylinder.position.y=y; casing.add(endCylinder); endCaps.push(endCylinder);
    for(const [r,t,dy,color,op] of [
      [2.08,.105,3.38,0x55e7ff,.96],
      [2.03,.035,3.62,0x259aff,.92],
      [1.83,.04,3.69,0x7afaff,.92],
      [1.38,.045,3.72,0x3bb2eb,.71],
      [2.10,.029,3.08,0x38ccef,.75]
    ])casing.add(torus(r,t,dy*side,glowMat(color,op)));
    const grid = cylinder(1.77,.302,
      new THREE.MeshBasicMaterial({color:0x31e2ff,wireframe:true,transparent:true,opacity:.19,depthWrite:false}),30,1,false);
    grid.position.y=y;casing.add(grid);
  }
  for(const y of [-2.7,-2.05,0,2.05,2.7]){
    casing.add(torus(1.98,.023,y,glowMat(y===0?C.cyan:C.blue,y===0?.83:.43)));
  }

  // Mechanical hoops spin around the horizontal axis; they never roll the screen.
  const rotor=new THREE.Group();machine.add(rotor);
  for(const y of [-2.65,-1.95,1.95,2.65]) {
    rotor.add(torus(1.96,.07,y,glowMat(y>0?0x349dea:0x5af5ff,.77)));
    for(let j=0;j<18;j++) {
      const a=j*Math.PI/9;
      const tooth=new THREE.Mesh(new THREE.BoxGeometry(.13,.23,.17),glowMat(j%3?0x187eac:0x8cf9ff,j%3?.43:.94));
      tooth.position.set(Math.cos(a)*1.96,y,Math.sin(a)*1.96);
      tooth.rotation.y=-a;rotor.add(tooth);
    }
  }
  // Two illuminated mechanical collar assemblies can "unlock" during startup.
  const leftClamp=new THREE.Group(),rightClamp=new THREE.Group();
  leftClamp.position.x=-2.56;rightClamp.position.x=2.56;
  instrument.add(leftClamp,rightClamp);
  for(const clamp of [leftClamp,rightClamp]) {
    const collar=torus(2.08,.09,0,glowMat(0x75f7ff,.9));
    collar.rotation.z=Math.PI/2;collar.rotation.x=0;
    // Torus default axis is Z. After rotation above, its face is perpendicular X.
    clamp.add(collar);
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      const bolt=new THREE.Mesh(new THREE.BoxGeometry(.20,.16,.18),metalMat(0x3e6078));
      bolt.position.set(0,Math.cos(a)*2.08,Math.sin(a)*2.08);clamp.add(bolt);
    }
  }
  // Internal spiraling coolant / electrical traces.
  const helix=new THREE.Group();machine.add(helix);
  for(let k=0;k<6;k++){
    const pts=[];
    for(let j=0;j<=170;j++) {
      const u=j/170,a=5*Math.PI*u+k*Math.PI/3;
      pts.push(Math.cos(a)*1.38,-3.03+6.06*u,Math.sin(a)*1.38);
    }
    const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    helix.add(new THREE.Line(geom,lineMat(k%2?0x45afff:0x62eaff,.27)));
  }
  // Reactor lattice and axial energy shaft.
  const reactor=new THREE.Group();machine.add(reactor);
  const coreMat=new THREE.MeshBasicMaterial({color:C.glow,wireframe:true,transparent:true,opacity:.6,depthWrite:false});
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.12,2),coreMat);
  reactor.add(core);
  reactor.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.79,2),glowMat(0x39dcff,.1)));
  const axial = cylinder(.25,5.85,glowMat(0x44dfff,.22),14);
  reactor.add(axial);
  for(const y of [-1.5,0,1.5])reactor.add(torus(1.17,.022,y,glowMat(C.cyan,.48)));

  // 64 real circumferential charge lamps, depleted in countdown order.
  const chargeSegments=[];
  for(let i=0;i<64;i++){
    const a=i*Math.PI*2/64;
    const material=glowMat(0x48eaff,.95);
    const segment=new THREE.Mesh(new THREE.BoxGeometry(.14,.26,.08),material);
    segment.position.set(Math.sin(a)*2.08,-2.96,Math.cos(a)*2.08);
    segment.rotation.y=a;machine.add(segment);chargeSegments.push(material);
  }


  // Mechanical augmentation: exposed cog drives, toothed couplers, and brace arms.
  const driveTrain = new THREE.Group();
  instrument.add(driveTrain);
  const driveGears=[];
  const gearConfigs=[
    {x:-3.02,y:1.20,z:1.12,outer:.86,inner:.30,teeth:16,dir:1},
    {x:-2.20,y:-1.18,z:1.05,outer:.58,inner:.22,teeth:12,dir:-1},
    {x:3.00,y:-1.18,z:1.12,outer:.86,inner:.30,teeth:16,dir:-1},
    {x:2.15,y:1.10,z:1.05,outer:.58,inner:.22,teeth:12,dir:1}
  ];
  gearConfigs.forEach(cfg=>{
    const mountPlate=new THREE.Mesh(new THREE.CylinderGeometry(cfg.outer*.78,cfg.outer*.78,.12,24,1,false), metalMat(0x152d40));
    mountPlate.rotation.x=Math.PI/2;
    mountPlate.position.set(cfg.x,cfg.y,cfg.z-.17);
    driveTrain.add(mountPlate);
    const gear=createCogWheel(cfg);
    gear.position.set(cfg.x,cfg.y,cfg.z);
    driveTrain.add(gear);
    gear.userData.spinDir=cfg.dir;
    driveGears.push(gear);
    const axle=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.42,10,1,false), glowMat(0x74f6ff,.54));
    axle.rotation.x=Math.PI/2;
    axle.position.set(cfg.x,cfg.y,cfg.z-.02);
    driveTrain.add(axle);
  });
  const supportArms = new THREE.Group();
  instrument.add(supportArms);
  const armPairs=[
    {sx:-2.16,sy:.84,sz:1.88, ex:-3.0,ey:1.2,ez:1.00},
    {sx:-2.16,sy:-.84,sz:1.88, ex:-2.2,ey:-1.18,ez:.94},
    {sx:2.16,sy:.84,sz:1.88, ex:2.15,ey:1.10,ez:.94},
    {sx:2.16,sy:-.84,sz:1.88, ex:3.0,ey:-1.18,ez:1.00}
  ];
  armPairs.forEach(p=>{
    const dx=p.ex-p.sx, dy=p.ey-p.sy, dz=p.ez-p.sz;
    const len=Math.sqrt(dx*dx+dy*dy+dz*dz);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,len,8,1,false), glowMat(0x6deeff,.55));
    rod.position.set((p.sx+p.ex)/2,(p.sy+p.ey)/2,(p.sz+p.ez)/2);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3(dx,dy,dz).normalize());
    supportArms.add(rod);
  });
  const pistonSet=new THREE.Group();
  instrument.add(pistonSet);
  for(const side of [-1,1]){
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,3.25,10,1,false), metalMat(0x29485b));
    rail.rotation.z=Math.PI/2;
    rail.position.set(0,side*1.54,1.24);
    pistonSet.add(rail);
    for(const x of [-1.82,1.82]){
      const coupler = new THREE.Mesh(new THREE.BoxGeometry(.44,.18,.18), glowMat(0x48dfff,.42));
      coupler.position.set(x,side*1.54,1.24);
      pistonSet.add(coupler);
    }
  }
  const toothedBands = new THREE.Group();
  machine.add(toothedBands);
  for(const y of [-1.15,1.15]){
    toothedBands.add(torus(2.12,.045,y,glowMat(0x7cf7ff,.84)));
    for(let j=0;j<24;j++){
      const a=j*Math.PI/12;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(.11,.17,.13), glowMat(j%2?0x1878ac:0x90fbff,j%2?.40:.88));
      tooth.position.set(Math.cos(a)*2.12,y,Math.sin(a)*2.12);
      tooth.rotation.y=-a;
      toothedBands.add(tooth);
    }
  }

  // 2.6: six exposed motor housings with dark titanium plating and glowing bearing races.
  const motorBank=new THREE.Group();instrument.add(motorBank);
  const rotorHousings=[];
  for(const side of [-1,1]) for(const level of [-1,0,1]){
    const x=side*2.58, y=level*.91, z=1.09;
    const assembly=new THREE.Group();assembly.position.set(x,y,z);motorBank.add(assembly);
    const casingMesh=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.42,12),metalMat(0x243e55));
    casingMesh.rotation.x=Math.PI/2;assembly.add(casingMesh);
    const race=new THREE.Mesh(new THREE.TorusGeometry(.235,.024,8,32),glowMat(level===0?0x90faff:0x3dbfe8,.84));
    race.position.z=.24;assembly.add(race);
    const fan=new THREE.Group();fan.position.z=.26;assembly.add(fan);
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3;
      const blade=new THREE.Mesh(new THREE.BoxGeometry(.19,.062,.025),metalMat(0x6791a4));
      blade.position.set(Math.cos(a)*.11,Math.sin(a)*.11,0);
      blade.rotation.z=a+.32;fan.add(blade);
    }
    rotorHousings.push({fan,dir:side*(level===0?-1:1)});
  }

  // 2.6: physical coolant conduits route along the chamber rather than floating in background.
  const coolantGroup=new THREE.Group();instrument.add(coolantGroup);
  const coolantTubes=[];
  for(const side of [-1,1]) for(const level of [-1,1]){
    const y=level*1.42;
    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(side*3.12,y,1.36),
      new THREE.Vector3(side*2.65,y*1.18,1.66),
      new THREE.Vector3(side*1.38,y*1.08,1.74),
      new THREE.Vector3(side*.45,y*.90,1.85)
    ]);
    const tube=new THREE.Mesh(new THREE.TubeGeometry(path,32,.075,8,false),metalMat(0x365e75));
    coolantGroup.add(tube);
    const trace=new THREE.Mesh(new THREE.TubeGeometry(path,32,.018,6,false),glowMat(level===1?0x3fefff:0x218bff,.72));
    coolantGroup.add(trace);coolantTubes.push(trace);
    for(const t of [.2,.73]){
      const pt=path.getPoint(t);
      const coupling=new THREE.Mesh(new THREE.TorusGeometry(.095,.025,6,16),metalMat(0x7a9bad));
      coupling.position.copy(pt);coupling.rotation.y=Math.PI/2;coolantGroup.add(coupling);
    }
  }

  // 2.6: motorized front latch arms, anchored outside of the upright display.
  const latchAssembly=new THREE.Group();instrument.add(latchAssembly);
  const latches=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*2.92,0,2.06);latchAssembly.add(pivot);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.72,.18,.20),metalMat(0x455f70));
    arm.position.x=-side*.36;pivot.add(arm);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(.54,.033,.225),glowMat(0x65dfff,.55));
    stripe.position.set(-side*.35,0,.025);pivot.add(stripe);
    const knuckle=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.26,14),metalMat(0x7d99a7));
    knuckle.rotation.x=Math.PI/2;pivot.add(knuckle);
    latches.push({pivot,side});
  }

  // Separate mission-state alert lights; never obscure the countdown digits.
  const alertLights=[];
  for(const side of [-1,1])for(const y of [-1.70,1.70]){
    const housing=new THREE.Mesh(new THREE.BoxGeometry(.38,.18,.17),metalMat(0x2e4355));
    housing.position.set(side*2.4,y,1.85);instrument.add(housing);
    const lampMat=glowMat(0x59eaff,.48);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.09,.04),lampMat);
    lamp.position.set(side*2.4,y,1.96);instrument.add(lamp);alertLights.push(lampMat);
  }

  // Additional inner ceramic turbine blades mounted on a dedicated X-axis shaft.
  const turbine=new THREE.Group();instrument.add(turbine);
  for(const x of [-1.15,1.15]){
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.14,20),metalMat(0x273f57));
    shaft.rotation.z=Math.PI/2;shaft.position.x=x;turbine.add(shaft);
    for(let n=0;n<12;n++){
      const a=n*Math.PI/6;
      const blade=new THREE.Mesh(new THREE.BoxGeometry(.12,.70,.09),metalMat(n%3?0x335c73:0x6897a5));
      blade.position.set(x,Math.cos(a)*.70,Math.sin(a)*.70);
      blade.rotation.x=a+.32;turbine.add(blade);
    }
  }

  // Soft photographic halo without requiring heavy bloom post-processing.
  const auraCanvas=document.createElement('canvas');auraCanvas.width=auraCanvas.height=128;
  const auraCtx=auraCanvas.getContext('2d');
  if(auraCtx){
    const g=auraCtx.createRadialGradient(64,64,3,64,64,64);
    g.addColorStop(0,'rgba(105,239,255,.7)');g.addColorStop(.22,'rgba(31,187,255,.28)');g.addColorStop(1,'rgba(0,100,255,0)');
    auraCtx.fillStyle=g;auraCtx.fillRect(0,0,128,128);
  }
  const glowTexture = new THREE.CanvasTexture(auraCanvas);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x48daff,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
  aura.scale.set(9.2,4.5,1);aura.position.z=-.15;instrument.add(aura);
  const flashes = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:C.cyan,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
  flashes.scale.set(8.6,4.6,1);flashes.position.z=.3;instrument.add(flashes);
  // Sparse floating charge particles INSIDE the machine (not a page background).
  const particleCount=55;
  const particleArray=new Float32Array(particleCount*3);
  const seed=[];
  for(let i=0;i<particleCount;i++){
    const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*1.55,y=(Math.random()-.5)*6.3;
    seed.push({a,r,y});
    particleArray[i*3]=y;particleArray[i*3+1]=Math.cos(a)*r;particleArray[i*3+2]=Math.sin(a)*r;
  }
  const particleGeometry=new THREE.BufferGeometry();
  particleGeometry.setAttribute('position',new THREE.BufferAttribute(particleArray,3));
  const particleCloud=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0x8cedff,size:.07,transparent:true,opacity:.78,depthWrite:false,blending:THREE.AdditiveBlending}));
  instrument.add(particleCloud);

  // Independent front-facing screen: mounted to the same instrument but never
  // under the sideways rotation. The digits always remain left-to-right.
  const screenMount=new THREE.Group();
  screenMount.position.set(0,.05,2.22);instrument.add(screenMount);
  const bezel=new THREE.Mesh(new THREE.BoxGeometry(5.35,1.70,.22),matte(0x030b17,.98));
  screenMount.add(bezel);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.42,1.77,.23)),lineMat(C.cyan,.93));
  screenMount.add(edge);
  const screenBorder=new THREE.Mesh(new THREE.PlaneGeometry(5.12,1.52),glowMat(0x24d8ff,.15));
  screenBorder.position.z=.13;screenMount.add(screenBorder);
  for(const x of [-2.55,2.55])for(const y of [-.73,.73]){
    const rivet=new THREE.Mesh(new THREE.SphereGeometry(.045,7,7),glowMat(0xb9ffff,.96));
    rivet.position.set(x,y,.15);screenMount.add(rivet);
  }
  const displayCanvas=document.createElement('canvas');displayCanvas.width=1024;displayCanvas.height=330;
  const ctx=displayCanvas.getContext('2d');
  if(!ctx) return;
  const displayTexture=new THREE.CanvasTexture(displayCanvas);
  displayTexture.minFilter=THREE.LinearFilter;displayTexture.magFilter=THREE.LinearFilter;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(5.14,1.53),new THREE.MeshBasicMaterial({map:displayTexture,transparent:true,depthWrite:false,depthTest:false}));
  face.position.z=.145;face.renderOrder=30;screenMount.add(face);

  const status={time:'05:00',ratio:1,remainingMs:300000,state:'idle'};
  function paintDisplay(){
    const w=1024,h=330;
    ctx.clearRect(0,0,w,h);
    const g=ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#04131f');g.addColorStop(.5,'#092c40');g.addColorStop(1,'#03101c');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(80,220,255,.055)';
    for(let y=6;y<h;y+=8)ctx.fillRect(0,y,w,1);
    ctx.strokeStyle='#2088a6';ctx.lineWidth=2;ctx.strokeRect(7,7,w-14,h-14);
    ctx.textBaseline='alphabetic';ctx.font='21px Share Tech Mono,monospace';
    ctx.textAlign='left';ctx.fillStyle='#7dd6ed';ctx.fillText('ORION / CHRONO UNIT',28,40);
    ctx.textAlign='right';ctx.fillStyle='#63caeb';ctx.fillText('MODULE 2.6',w-28,40);
    const urgent=status.state==='running'&&status.remainingMs>0&&status.remainingMs<=10000;
    const color=urgent?'#ffcf91':status.state==='complete'?'#a2ffbf':'#eaffff';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=urgent?'#ff912d':'#20d9ff';ctx.shadowBlur=27;
    let size=202;
    do{ctx.font=`700 ${size}px Share Tech Mono,monospace`;if(ctx.measureText(status.time).width<900||size<=63)break;size-=4;}while(true);
    ctx.fillStyle=color;ctx.fillText(status.time,w/2,169);
    ctx.shadowBlur=0;
    ctx.fillStyle='#63bad9';ctx.font='20px Share Tech Mono,monospace';
    const statusText = status.state==='running'?'COUNTDOWN IN PROGRESS':status.state==='paused'?'SYSTEM ON HOLD':status.state==='complete'?'MISSION COMPLETE':'CHRONO SYSTEM ARMED';
    ctx.fillText(statusText,w/2,282);
    ctx.fillStyle='#17445b';ctx.fillRect(30,310,w-60,7);
    ctx.fillStyle=urgent?'#ffbb74':'#53edff';ctx.fillRect(30,310,(w-60)*status.ratio,7);
    displayTexture.needsUpdate=true;
  }
  paintDisplay();
  let running=false,completed=false,spin=0;
  const motion=window.ORIONMotion&&window.ORIONMotion.create({instrument,screen:screenMount,glow:aura,flash:flashes,leftClamp,rightClamp},reducedMotion);
  if(motion)motion.initialize();
  let lastLit = -1;
  function applyProgress(detail={}){
    const previousRatio=status.ratio;
    const wasUrgent=running&&status.remainingMs>0&&status.remainingMs<=10000;
    const nextRatio=Math.max(0,Math.min(1,Number(detail.progress)||0));
    const nextTime=typeof detail.display==='string'?detail.display:status.time;
    const nextRemaining=Math.max(0,Number(detail.remainingMs)||0);
    status.ratio=nextRatio;
    status.time=nextTime;
    status.remainingMs=nextRemaining;
    const urgent=running&&status.remainingMs>0&&status.remainingMs<=10000;
    // Repaint high-resolution clock texture only when a readable value, a
    // 1%-charge step, or urgency changes (not on every requestAnimationFrame).
    if(nextTime!==lastDrawnTime||Math.floor(previousRatio*100)!==Math.floor(nextRatio*100)||wasUrgent!==urgent){
      paintDisplay();lastDrawnTime=nextTime;
    }
    const lit=Math.round(64*status.ratio);
    if(lit!==lastLit||wasUrgent!==urgent){
      chargeSegments.forEach((m,i)=>{
        const active=i<lit;
        m.color.setHex(active?(urgent?C.warning:C.cyan):0x18415a);
        m.opacity=active?.96:.12;
      });
      lastLit=lit;
    }
  }
  let lastDrawnTime=status.time;
  window.addEventListener('timerProgress',event=>applyProgress(event.detail));
  window.addEventListener('timerStateChanged',event=>{
    const d=event.detail||{};
    running=Boolean(d.isRunning);completed=Boolean(d.isComplete);
    status.state=completed?'complete':running?'running':d.isPaused?'paused':'idle';
    paintDisplay();
    if(motion)motion.change(status.state);
  });

  // Resync after timer main.js was initialized earlier.
  window.dispatchEvent(new CustomEvent('orion3DReady'));

  // 2.4 inspection controls. Uses built-in Three.js raycasting for part
  // selection; no new framework or 3D-control CDN is necessary.
  const interaction = window.ORIONInteraction && window.ORIONInteraction.create({
    canvas,stage,camera,instrument,screen:face,shell,wireCasing,
    core,reactor,rotor,screenMount,bezel,leftClamp,rightClamp,endCaps,
    reducedMotion
  });

  function resize(){
    const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
    const narrow=w<510;
    camera.aspect=w/h;
    camera.fov=narrow?38:36;
    camera.position.set(narrow?2.1:2.4,narrow?1.15:1.20,narrow?17.8:14.2);
    camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,narrow?1.5:2));
    renderer.setSize(w,h,false);
    if(interaction)interaction.configureCamera({x:narrow?2.1:2.4,y:narrow?1.15:1.2,z:narrow?17.8:14.2});
  }
  resize();window.addEventListener('resize',resize);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(stage);
  stage.classList.add('webgl-ready');
  const clock=new THREE.Clock();
  function render(){
    requestAnimationFrame(render);
    const dt=Math.min(.05,clock.getDelta());
    if(document.hidden)return;
    const t=clock.elapsedTime;
    const animate=reducedMotion?0:1;
    spin+=( (running?1:0)-spin)*Math.min(1,dt*2.25);
    rotor.rotation.y+=dt*(.085+spin*1.12)*animate;
    toothedBands.rotation.y-=dt*(.03+spin*.18)*animate;
    helix.rotation.y-=dt*(.065+spin*.39)*animate;
    reactor.rotation.y+=dt*(.18+spin*.43)*animate;
    core.rotation.z+=dt*.075*animate;
    driveGears.forEach((gear,index)=>{
      gear.rotation.z += dt*(.42 + spin*.95)*(gear.userData.spinDir||1)*animate*(index%2?1.25:1);
    });
    supportArms.rotation.z = Math.sin(t*1.6)*.015*animate;
    rotorHousings.forEach(({fan,dir})=>{fan.rotation.z+=dt*(.28+spin*1.6)*dir*animate;});
    turbine.rotation.x+=dt*(.12+spin*.58)*animate;
    latches.forEach(({pivot,side})=>{
      const target=running?side*.09:0;
      pivot.rotation.z+=(target-pivot.rotation.z)*Math.min(1,dt*3);
    });
    coolantTubes.forEach((trace,i)=>{trace.material.opacity=.48+spin*.24+Math.sin(t*2.4+i)*.08*animate;});

    if(interaction)interaction.update(dt);
    instrument.position.y=animate*Math.sin(t*.62)*.035;
    pistonSet.position.z = Math.sin(t*(running?2.6:1.2))*.03*animate;
    const urgent=running&&status.remainingMs>0&&status.remainingMs<=10000;
    alertLights.forEach((mat,i)=>{
      const pulse=urgent?(Math.sin(t*8+i*Math.PI)*.5+.5):running?.78:.38;
      mat.color.setHex(urgent?C.warning:running?0x64eeff:0x2d94c3);
      mat.opacity=.20+pulse*.78;
    });

    const charge=.4+spin*.35+(urgent?.2:0);
    if(hologram){hologram.update(t,charge);hologram.setColor(urgent?C.warning:C.glow);}
    coreMat.color.setHex(urgent?C.warning:C.glow);
    coreMat.opacity=(.46+spin*.23+(interaction&&interaction.isXray()?0.20:0))*(1+Math.sin(t*(urgent?8:2.3))*.065*animate);
    interior.material.opacity=.032+spin*.09;
    if(!reducedMotion){
      const attr=particleGeometry.attributes.position;
      for(let i=0;i<particleCount;i++){
        const p=seed[i],a=p.a+t*(.07+spin*.3),x=((p.y+t*(.14+spin*.26)+3.15)%6.3)-3.15;
        attr.setXYZ(i,x,Math.cos(a)*p.r,Math.sin(a)*p.r);
      }
      attr.needsUpdate=true;
    }
    renderer.render(scene,camera);
  }
  render();
});
