/* ORION Chrono Core 2.3 — Horizontal Holographic Edition
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
  const glowMat = (color=C.cyan,opacity=.8) => new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const lineMat = (color=C.cyan,opacity=.5) => new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
  const torus = (radius,tube,y,material) => {
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,96),material);
    mesh.rotation.x=Math.PI/2;mesh.position.y=y;return mesh;
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
  casing.add(new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.CylinderGeometry(1.83,1.83,6.96,32,13,true)),
    lineMat(0x45ceff,.27)
  ));
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
  for(const side of [-1,1]) {
    const y=3.47*side;
    const endCylinder=cylinder(1.78,.29,matte(0x09263e,.98),48,1,false);
    endCylinder.position.y=y; casing.add(endCylinder);
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
      const bolt=new THREE.Mesh(new THREE.BoxGeometry(.20,.16,.18),matte(0x178fc0,.90));
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
    ctx.textAlign='right';ctx.fillStyle='#63caeb';ctx.fillText('MODULE 2.3',w-28,40);
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

  // Mouse/touch drag gently turns the ENTIRE gadget in 3D without rolling digits.
  let dragging=false,lastX=0,lastY=0,targetYaw=0,targetPitch=0;
  canvas.style.touchAction='pan-y';
  canvas.addEventListener('pointerdown',e=>{
    dragging=true;lastX=e.clientX;lastY=e.clientY;
    if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!dragging||reducedMotion)return;
    targetYaw=Math.max(-.42,Math.min(.42,targetYaw+(e.clientX-lastX)*.0045));
    targetPitch=Math.max(-.16,Math.min(.16,targetPitch+(e.clientY-lastY)*.0018));
    lastX=e.clientX;lastY=e.clientY;
  });
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('lostpointercapture',()=>dragging=false);

  function resize(){
    const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
    const narrow=w<510;
    camera.aspect=w/h;
    camera.fov=narrow?38:36;
    camera.position.set(narrow?2.1:2.4,narrow?1.15:1.20,narrow?17.8:14.2);
    camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,narrow?1.5:2));
    renderer.setSize(w,h,false);
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
    helix.rotation.y-=dt*(.065+spin*.39)*animate;
    reactor.rotation.y+=dt*(.18+spin*.43)*animate;
    core.rotation.z+=dt*.075*animate;
    instrument.rotation.y+=(targetYaw-instrument.rotation.y)*Math.min(1,dt*6);
    instrument.rotation.x+=(targetPitch-instrument.rotation.x)*Math.min(1,dt*6);
    instrument.position.y=animate*Math.sin(t*.62)*.035;
    const urgent=running&&status.remainingMs>0&&status.remainingMs<=10000;
    const charge=.4+spin*.35+(urgent?.2:0);
    if(hologram){hologram.update(t,charge);hologram.setColor(urgent?C.warning:C.glow);}
    coreMat.color.setHex(urgent?C.warning:C.glow);
    coreMat.opacity=(.46+spin*.23)*(1+Math.sin(t*(urgent?8:2.3))*.065*animate);
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
