/* ORION Chrono Core 2.2
 * A genuine THREE.js cylindrical timer: the digital display is a CanvasTexture
 * mounted on the body of the 3D apparatus, not an unrelated HTML overlay.
 * Compatible with Three.js r128 included by index.html. No build step.
 */
window.addEventListener('load', () => {
  const stage = document.getElementById('chrono-stage');
  const canvas = document.getElementById('three-canvas');
  if (!stage || !canvas || typeof THREE === 'undefined') return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'default'});
  } catch (error) {
    console.warn('ORION: WebGL unavailable; showing schematic fallback.', error);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const instrument = new THREE.Group();
  scene.add(instrument);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clearCyan = 0x45e7ff, softCyan = 0x167cb3, blue = 0x238cff;
  const cyan = (opacity=.8, color=clearCyan) => new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});
  const lineMat = (opacity=.6, color=clearCyan) => new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
  const solidDark = (color=0x06182a,opacity=1) => new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide});

  // Central engineered shell: dark transparent body with multiple real cylindrical wire lattices.
  const frame = new THREE.Group();
  instrument.add(frame);
  // Reorient the chronometer so the cylindrical body runs horizontally.
  frame.rotation.z = Math.PI / 2;
  frame.add(new THREE.Mesh(new THREE.CylinderGeometry(1.97,1.97,6.3,32,1,true),solidDark(0x071c31,.38)));
  const meshGeometry = new THREE.CylinderGeometry(2.08,2.08,6.22,30,11,true);
  frame.add(new THREE.Mesh(meshGeometry, new THREE.MeshBasicMaterial({color:0x3bd7ff,wireframe:true,transparent:true,opacity:.22,depthWrite:false})));
  const internal = new THREE.Mesh(new THREE.CylinderGeometry(1.58,1.58,5.75,30,1,true),cyan(.045,0x15c7ef));
  frame.add(internal);

  // The vertical machined rails and internal beam braces are separate 3D objects.
  const railGeometry = new THREE.CylinderGeometry(.037,.037,6.25,6);
  const darkRailGeometry = new THREE.CylinderGeometry(.085,.085,6.42,8);
  for(let i=0;i<16;i++){
    const angle=i*Math.PI*2/16;
    const x=Math.cos(angle)*2.12,z=Math.sin(angle)*2.12;
    const rail = new THREE.Mesh(i%4===0?darkRailGeometry:railGeometry,
      i%4===0?cyan(.65,0x3c9fd8):cyan(.32,0x2ad9ff));
    rail.position.set(x,0,z);frame.add(rail);
    if(i%4===0){
      const bright = new THREE.Mesh(new THREE.CylinderGeometry(.017,.017,5.9,6),cyan(.83,0x75edff));
      bright.position.set(x,0,z);frame.add(bright);
    }
  }
  // Concentric collars mechanically close the cylinder at the upper and lower ends.
  function torus(radius,tube,y,material){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,9,96),material);
    ring.rotation.x=Math.PI/2;ring.position.y=y;return ring;
  }
  for(const side of [-1,1]){
    for(const [radius,tube,offset,opacity,color] of [
      [2.28,.09,3.21,.97,0x75eaff],
      [2.21,.025,3.42,.85,0x31b9e6],
      [1.88,.035,3.4,.95,0x1981f6],
      [2.19,.075,2.92,.57,0x1d97cc],
      [2.26,.016,2.68,.82,0x40eeff]]){
      frame.add(torus(radius,tube,offset*side,cyan(opacity,color)));
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.96,1.96,.17,40),solidDark(0x092c45,.95));
    cap.position.y=side*3.32;frame.add(cap);
    const capGrid = new THREE.Mesh(new THREE.CylinderGeometry(1.93,1.93,.19,24,1,false),new THREE.MeshBasicMaterial({color:0x33dfff,wireframe:true,transparent:true,opacity:.45}));
    capGrid.position.y=side*3.32;frame.add(capGrid);
    frame.add(torus(1.04,.022,side*3.45,cyan(.7)));
  }
  for(const y of [-2.1,-1.58,1.57,2.08]){
    frame.add(torus(2.18,.025,y,cyan(.51,y<0?0x31e7ff:0x319cd9)));
  }

  // Machine ribs: twisting lattice inside the cylinder creates visible depth.
  const helices=new THREE.Group();frame.add(helices);
  for(let helix=0;helix<4;helix++){
    const xyz=[];
    for(let j=0;j<=170;j++){
      const u=j/170,angle=6*Math.PI*u+helix*Math.PI/2;
      xyz.push(Math.cos(angle)*1.68,-2.68+u*5.36,Math.sin(angle)*1.68);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
    helices.add(new THREE.Line(geo,lineMat(.3,helix%2?0x2375ef:0x3ae7ff)));
  }
  // Rotating independent mechanical drum / hoops around the core.
  const rotor=new THREE.Group();frame.add(rotor);
  for(const y of [-2.33,2.33]){
    const hoop=torus(1.86,.068,y,cyan(.9,0x37c0f7));rotor.add(hoop);
    for(let j=0;j<16;j++){
      const angle=j*Math.PI/8;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,.13),cyan(.75,j%4?0x168ccc:0x92f9ff));
      bar.position.set(Math.cos(angle)*1.86,y,Math.sin(angle)*1.86);
      bar.rotation.y=-angle;rotor.add(bar);
    }
  }
  // Reactor core behind the display, visible above and below it.
  const energyCore=new THREE.Group();frame.add(energyCore);
  const coreMesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1.34,1),new THREE.MeshBasicMaterial({color:0x0da6e6,wireframe:true,transparent:true,opacity:.65}));
  energyCore.add(coreMesh);
  energyCore.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.96,2),cyan(.13,0x2fe2ff)));
  for(const radius of [1.33,1.56]){
    const ring=torus(radius,.017,0,cyan(.64,0x37caff));ring.rotation.x=Math.PI/2+.26;energyCore.add(ring);
  }

  // Circular progress segments around the outer machine's lower collar.
  const progressBars=[];
  for(let i=0;i<64;i++){
    const theta=i*2*Math.PI/64;
    const material=cyan(.26,0x23729b);
    const segment=new THREE.Mesh(new THREE.BoxGeometry(.17,.28,.085),material);
    segment.position.set(Math.sin(theta)*2.3,-2.42,Math.cos(theta)*2.3);
    segment.rotation.y=theta;
    frame.add(segment);progressBars.push(material);
  }
  // Several circular rotating wire tracks provide a machinery/gyroscope silhouette.
  const orbitGroup=new THREE.Group();frame.add(orbitGroup);
  for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.29,.018,6,120),cyan(.38,i===1?blue:clearCyan));
    ring.rotation.set(.34+i*.52,i*.35,.1+i*.19);
    orbitGroup.add(ring);
  }
  // Four small metallic clamp structures support a *real 3D mounted screen*.
  const mount = new THREE.Group();mount.position.set(0,.05,2.28);frame.add(mount);
  mount.add(new THREE.Mesh(new THREE.BoxGeometry(4.53,1.48,.18),solidDark(0x06111c,.98)));
  mount.add(new THREE.Mesh(new THREE.BoxGeometry(4.59,1.55,.08),cyan(.13,0x33caff)));
  const screenEdge= new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.65,1.63,.1)),lineMat(.92,0x61f3ff));
  screenEdge.position.z=.05;mount.add(screenEdge);
  for(const x of [-2.22,2.22]){
    for(const y of [-.68,.68]){
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(.065,7,7),cyan(.85,0x9aefff));
      rivet.position.set(x,y,.17);mount.add(rivet);
    }
  }

  // CanvasTexture updates the illuminated clock digits *on the physical 3D screen*.
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1024;screenCanvas.height=360;
  const ctx=screenCanvas.getContext('2d');
  if(!ctx) return;
  const screenTexture=new THREE.CanvasTexture(screenCanvas);
  screenTexture.minFilter=THREE.LinearFilter;
  screenTexture.magFilter=THREE.LinearFilter;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(4.37,1.34),new THREE.MeshBasicMaterial({map:screenTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  screen.position.z=.18;mount.add(screen);
  const accent=torus(2.3,.04,.05,cyan(.82));accent.rotation.x=Math.PI/2;frame.add(accent);

  const statusData={time:'00:00',state:'idle',ratio:0};
  function drawDisplay(){
    const w=screenCanvas.width,h=screenCanvas.height;
    ctx.clearRect(0,0,w,h);
    const fill=ctx.createLinearGradient(0,0,w,0);
    fill.addColorStop(0,'#061a29');fill.addColorStop(.5,'#09283c');fill.addColorStop(1,'#041222');
    ctx.fillStyle=fill;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(78,236,255,.042)';for(let x=0;x<w;x+=24)ctx.fillRect(x,0,1,h);
    ctx.fillStyle='rgba(104,214,247,.045)';for(let y=0;y<h;y+=9)ctx.fillRect(0,y,w,1);
    ctx.strokeStyle='#247e9b';ctx.lineWidth=2;ctx.strokeRect(8,8,w-16,h-16);
    ctx.fillStyle='#5eb1d1';ctx.textAlign='left';ctx.font='22px Share Tech Mono,monospace';ctx.fillText('ORION / TEMPORAL ARRAY',34,46);
    ctx.textAlign='right';ctx.fillStyle='#69dff0';ctx.fillText('CHRONO-01',w-30,46);
    const urgent=statusData.state==='running'&&statusData.ratio<.10;
    const textColor=urgent?'#ffcc78':statusData.state==='complete'?'#8bffb9':'#d6fbff';
    const glowColor=urgent?'#ff9739':'#31eaff';
    ctx.textAlign='center';ctx.textBaseline='middle';
    let fontSize=156;
    do{ctx.font=`700 ${fontSize}px Share Tech Mono,monospace`;fontSize-=3;}while(ctx.measureText(statusData.time).width>900&&fontSize>60);
    ctx.shadowColor=glowColor;ctx.shadowBlur=37;ctx.fillStyle=textColor;
    ctx.fillText(statusData.time,w/2,184);ctx.shadowBlur=0;
    ctx.fillStyle='#6cd5e9';ctx.font='20px Share Tech Mono,monospace';
    ctx.fillText(statusData.state==='complete'?'MISSION COMPLETE':statusData.state==='running'?'COUNTDOWN IN PROGRESS':statusData.state==='paused'?'CHRONO CORE SUSPENDED':'COUNTDOWN SYSTEM ARMED',w/2,309);
    ctx.fillStyle='#184961';ctx.fillRect(30,337,w-60,5);
    ctx.fillStyle=urgent?'#ffbf70':'#3feaff';ctx.fillRect(30,337,(w-60)*statusData.ratio,5);
    screenTexture.needsUpdate=true;
  }
  drawDisplay();

  let spinning=false,completed=false;
  function updateProgress(detail){
    statusData.ratio=Math.min(1,Math.max(0,Number(detail.progress)||0));
    if(typeof detail.display==='string'&&detail.display!==statusData.time){
      statusData.time=detail.display;
      drawDisplay();
    }
    progressBars.forEach((material,index)=>{
      const charged=index/64<statusData.ratio;
      const urgent=spinning&&statusData.ratio<.1;
      material.color.setHex(charged?(urgent?0xffb15b:0x4de6ff):0x17516e);
      material.opacity=charged?.95:.19;
    });
    if(completed){statusData.state='complete';drawDisplay();}
  }
  window.addEventListener('timerProgress',e=>updateProgress(e.detail||{}));
  window.addEventListener('timerStateChanged',e=>{
    spinning=Boolean(e.detail&&e.detail.isRunning);
    completed=Boolean(e.detail&&e.detail.isComplete);
    statusData.state=completed?'complete':spinning?'running':e.detail&&e.detail.isPaused?'paused':'idle';
    drawDisplay();
  });

  // The 3D renderer is initialized on window.load, after module scripts may
  // have already sent the initial 05:00 state. Ask the timer to replay it.
  window.dispatchEvent(new CustomEvent('orion3DReady'));

  let dragX=0,tilt=0,previousX=0,dragging=false;
  canvas.addEventListener('pointerdown',e=>{dragging=true;previousX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!dragging||reducedMotion)return;
    const delta=e.clientX-previousX;previousX=e.clientX;
    dragX=Math.max(-.58,Math.min(.58,dragX+delta*.004));
  });
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('pointercancel',()=>dragging=false);

  function resize(){
    const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
    camera.aspect=w/h;
    const isNarrow=w<490;
    camera.fov=isNarrow?46:40;
    camera.position.set(isNarrow?4.4:5.6,isNarrow?2.45:2.7,isNarrow?16.8:17.2);
    camera.lookAt(0,0,0);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isNarrow?1.5:2));
    renderer.setSize(w,h,false);
  }
  resize();window.addEventListener('resize',resize);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(stage);
  // Fallback only hides once WebGL is actually initialized.
  stage.classList.add('webgl-ready');

  const clock=new THREE.Clock();let spinSpeed=0;
  function render(){
    requestAnimationFrame(render);
    if(document.hidden)return;
    const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;
    spinSpeed+=( (spinning?1:0)-spinSpeed )*Math.min(1,dt*2.3);
    const motion=reducedMotion?0:1;
    rotor.rotation.y+=dt*(.13+spinSpeed*.95)*motion;
    helices.rotation.y-=dt*(.045+spinSpeed*.12)*motion;
    energyCore.rotation.y+=dt*(.17+spinSpeed*.7)*motion;
    energyCore.rotation.x+=dt*.045*motion;
    orbitGroup.rotation.y+=dt*(.14+spinSpeed*.19)*motion;
    for(let i=0;i<orbitGroup.children.length;i++){
      orbitGroup.children[i].rotation.z+=dt*.08*(i%2===0?1:-1)*motion;
    }
    tilt+=(dragX-tilt)*Math.min(1,dt*3);
    frame.rotation.z=Math.PI/2;
    frame.rotation.y=tilt;
    frame.rotation.x=Math.sin(t*.35)*.045*motion;
    frame.position.y=motion*Math.sin(t*.55)*.03;
    frame.position.x=motion*Math.sin(t*.42)*.08;
    const ratio=statusData.ratio;
    const pulse=spinning?(1+Math.sin(t*7)*.055):(1+Math.sin(t*1.8)*.025);
    internal.material.opacity=(.045+.11*spinSpeed)*pulse;
    coreMesh.material.opacity=(.4+.35*spinSpeed)*pulse;
    if(spinning&&ratio<.1){
      coreMesh.material.color.setHex(0xffad5c);
    }else{
      coreMesh.material.color.setHex(0x14c5f4);
    }
    renderer.render(scene,camera);
  }
  render();
});
