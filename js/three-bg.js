window.addEventListener('load', () => {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    // Add fog to make the wireframe fade into the background smoothly
    scene.fog = new THREE.FogExp2(0x030308, 0.015); 

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Create the Wireframe Schematics Group
    const schematicGroup = new THREE.Group();
    
    // Neon Materials
    const matCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.3 });
    const matMagenta = new THREE.MeshBasicMaterial({ color: 0xff00ea, wireframe: true, transparent: true, opacity: 0.2 });
    const matAmber = new THREE.MeshBasicMaterial({ color: 0xffb800, wireframe: true, transparent: true, opacity: 0.15 });

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

    // C. Outer Casing (Sparse wireframe)
    const cageGeo = new THREE.OctahedronGeometry(12, 0);
    const cage = new THREE.Mesh(cageGeo, matMagenta);

    schematicGroup.add(ring1);
    schematicGroup.add(ring2);
    schematicGroup.add(ring3);
    schematicGroup.add(core);
    schematicGroup.add(cage);
    
    scene.add(schematicGroup);

    // 3. Animation State
    let speedMultiplier = 0.5; // Base idle speed
    let targetSpeed = 0.5;

    // Listen for a custom event from main.js to speed it up!
    window.addEventListener('timerStateChanged', (e) => {
        targetSpeed = e.detail.isRunning ? 3.0 : 0.5;
    });

    // 4. Render Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();
        
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
        schematicGroup.position.y = Math.sin(elapsedTime * 0.5) * 1;

        renderer.render(scene, camera);
    }

    animate();

    // 5. Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
