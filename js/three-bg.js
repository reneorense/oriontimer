window.addEventListener('load', () => {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    // Add fog to make the wireframe fade into the background smoothly
    scene.fog = new THREE.FogExp2(0x030308, 0.015); 

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.innerWidth >= 720 });
    } catch (error) {
        console.warn('ORION: WebGL is unavailable; the 2D timer remains usable.', error);
        return;
    }
    const pixelRatioCap = window.innerWidth < 768 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 2. Create the Wireframe Schematics Group
    const schematicGroup = new THREE.Group();
    
    // Neon Materials
    const matCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.3 });
    const matMagenta = new THREE.MeshBasicMaterial({ color: 0xff00ea, wireframe: true, transparent: true, opacity: 0.2 });
    const matAmber = new THREE.MeshBasicMaterial({ color: 0xffb800, wireframe: true, transparent: true, opacity: 0.15 });
    const matGlow = new THREE.MeshBasicMaterial({ color: 0x00d8ff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false });

    // A. The Collider Rings (Steam Pump / Gyroscope tubes)
    const ringGeo1 = new THREE.TorusGeometry(8, 0.2, 16, 100);
    const ring1 = new THREE.Mesh(ringGeo1, matCyan);
    
    const ringGeo2 = new THREE.TorusGeometry(10, 0.2, 16, 100);
    const ring2 = new THREE.Mesh(ringGeo2, matMagenta);
    ring2.rotation.x = Math.PI / 2; // Rotate to make a sphere shape

    const ringGeo3 = new THREE.TorusGeometry(6, 0.2, 16, 100);
    const ring3 = new THREE.Mesh(ringGeo3, matAmber);
    ring3.rotation.y = Math.PI / 2;

    // B. The Hedron Core (Geometric diamond)
    const coreGeo = new THREE.IcosahedronGeometry(3, 1); // Level 1 detail
    const core = new THREE.Mesh(coreGeo, matCyan);
    // A translucent secondary core adds depth without expensive post-processing.
    const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), matGlow);

    // C. Outer Casing (Sparse wireframe)
    const cageGeo = new THREE.OctahedronGeometry(12, 0);
    const cage = new THREE.Mesh(cageGeo, matMagenta);

    schematicGroup.add(ring1);
    schematicGroup.add(ring2);
    schematicGroup.add(ring3);
    schematicGroup.add(core);
    schematicGroup.add(innerCore);
    schematicGroup.add(cage);
    
    scene.add(schematicGroup);

    // Countdown-driven arc: the arc shrinks as time passes, with no geometry rebuilding.
    const progressSegments = 240;
    const arcPoints = new Float32Array((progressSegments + 1) * 3);
    const progressRadius = 8.35;
    for (let i = 0; i <= progressSegments; i++) {
        const angle = -Math.PI / 2 + (i / progressSegments) * Math.PI * 2;
        arcPoints[i * 3] = Math.cos(angle) * progressRadius;
        arcPoints[i * 3 + 1] = Math.sin(angle) * progressRadius;
        arcPoints[i * 3 + 2] = 1;
    }
    const progressGeometry = new THREE.BufferGeometry();
    progressGeometry.setAttribute('position', new THREE.BufferAttribute(arcPoints, 3));
    progressGeometry.setDrawRange(0, 0);
    const progressArc = new THREE.Line(progressGeometry, new THREE.LineBasicMaterial({
        color: 0x78f4ff, transparent: true, opacity: 0.95, depthTest: false
    }));
    progressArc.renderOrder = 2;
    scene.add(progressArc);

    window.addEventListener('timerProgress', (event) => {
        const ratio = Math.min(1, Math.max(0, Number(event.detail.progress) || 0));
        progressGeometry.setDrawRange(0, ratio > 0 ? Math.max(2, Math.round(progressSegments * ratio) + 1) : 0);
        core.scale.setScalar(0.92 + 0.12 * ratio);
    });

    // 3. Animation State
    let speedMultiplier = 0.5; // Base idle speed
    let targetSpeed = 0.5;

    // Listen for a custom event from main.js to speed it up!
    window.addEventListener('timerStateChanged', (e) => {
        targetSpeed = e.detail.isRunning ? 3.0 : 0.5;
    });

    // 4. Render Loop
    const clock = new THREE.Clock();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function scaleScene() {
        const scale = Math.min(1, Math.max(0.42, window.innerWidth / 980, window.innerHeight / 690));
        schematicGroup.scale.setScalar(scale);
        progressArc.scale.setScalar(scale);
    }
    scaleScene();

    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = reducedMotion ? 0 : clock.getElapsedTime();
        
        // Smoothly transition the speed
        speedMultiplier += (targetSpeed - speedMultiplier) * 0.05;

        // Rotate rings on different axes
        ring1.rotation.x = elapsedTime * 0.2 * speedMultiplier;
        ring1.rotation.y = elapsedTime * 0.3 * speedMultiplier;
        
        ring2.rotation.z = elapsedTime * 0.1 * speedMultiplier;
        
        ring3.rotation.z = elapsedTime * 0.4 * speedMultiplier;

        // Rotate the core and cage
        core.rotation.y = elapsedTime * 0.5 * speedMultiplier;
        core.rotation.z = elapsedTime * 0.2 * speedMultiplier;

        cage.rotation.y = elapsedTime * -0.1 * speedMultiplier;
        cage.rotation.x = elapsedTime * 0.05 * speedMultiplier;

        // Gently float the whole group
        schematicGroup.position.y = reducedMotion ? 0 : Math.sin(elapsedTime * 0.5) * 0.65;
        innerCore.rotation.y = elapsedTime * -0.3 * speedMultiplier;
        if (document.visibilityState !== 'hidden') renderer.render(scene, camera);
    }

    animate();

    // 5. Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        scaleScene();
    });
});
