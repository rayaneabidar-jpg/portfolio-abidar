(function () {
    'use strict';

    const canvas = document.getElementById('metal-sphere');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    /* ─── Lights ─── */
    const ambient = new THREE.AmbientLight(0x1a3010, 0.4);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0x90A955, 1.4);
    key.position.set(3, 4, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x4F772D, 0.7);
    fill.position.set(-3, -1, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xECF39E, 0.9);
    rim.position.set(-1, 3, -3);
    scene.add(rim);

    const bottom = new THREE.DirectionalLight(0x2a4a15, 0.5);
    bottom.position.set(0, -4, 2);
    scene.add(bottom);

    /* ─── Sphere ─── */
    const geo = new THREE.IcosahedronGeometry(1.3, 64);
    const basePositions = Float32Array.from(geo.attributes.position.array);

    const mat = new THREE.MeshStandardMaterial({
        color: 0x4F772D,
        metalness: 0.95,
        roughness: 0.08,
        envMapIntensity: 1.2,
    });

    /* Simple env map via CubeCamera trick — fake green metallic reflections */
    const cubeRT = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRT);

    /* Build a simple environment scene for reflections */
    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(5, 32, 32);
    const envMat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        color: 0x0a1a08,
    });
    envScene.add(new THREE.Mesh(envGeo, envMat));

    /* Add colored lights to env scene for green reflections */
    const envLights = [
        { color: 0x90A955, pos: [3, 2, 2], intensity: 2 },
        { color: 0xECF39E, pos: [-2, 3, -1], intensity: 1.5 },
        { color: 0x4F772D, pos: [0, -3, 3], intensity: 1.2 },
        { color: 0xb5d45a, pos: [-3, 0, -2], intensity: 1 },
        { color: 0x31572C, pos: [2, -2, -3], intensity: 0.8 },
    ];
    envLights.forEach(l => {
        const light = new THREE.PointLight(l.color, l.intensity, 10);
        light.position.set(...l.pos);
        envScene.add(light);
        /* Small emissive sphere at each light position */
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ color: l.color })
        );
        glow.position.copy(light.position);
        envScene.add(glow);
    });

    cubeCamera.update(renderer, envScene);
    mat.envMap = cubeRT.texture;

    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    /* ─── Particles ─── */
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pVelocities = [];
    for (let i = 0; i < pCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.8 + Math.random() * 1.5;
        pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pPositions[i * 3 + 2] = r * Math.cos(phi);
        pVelocities.push({
            speed: 0.002 + Math.random() * 0.004,
            axis: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize(),
        });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMat = new THREE.PointsMaterial({
        color: 0x90A955,
        size: 0.025,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ─── Mouse ─── */
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    window.addEventListener('mousemove', e => {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    /* ─── Resize ─── */
    function resize() {
        const container = canvas.parentElement;
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    /* ─── Simplex-like noise (simplified) ─── */
    function hash(x, y, z) {
        let h = x * 374761393 + y * 668265263 + z * 1274126177;
        h = (h ^ (h >> 13)) * 1274126177;
        return (h ^ (h >> 16)) / 2147483648;
    }

    function noise3D(x, y, z) {
        const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        const fx = x - ix, fy = y - iy, fz = z - iz;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const sz = fz * fz * (3 - 2 * fz);

        const n000 = hash(ix, iy, iz);
        const n100 = hash(ix + 1, iy, iz);
        const n010 = hash(ix, iy + 1, iz);
        const n110 = hash(ix + 1, iy + 1, iz);
        const n001 = hash(ix, iy, iz + 1);
        const n101 = hash(ix + 1, iy, iz + 1);
        const n011 = hash(ix, iy + 1, iz + 1);
        const n111 = hash(ix + 1, iy + 1, iz + 1);

        return n000 * (1 - sx) * (1 - sy) * (1 - sz) +
               n100 * sx * (1 - sy) * (1 - sz) +
               n010 * (1 - sx) * sy * (1 - sz) +
               n110 * sx * sy * (1 - sz) +
               n001 * (1 - sx) * (1 - sy) * sz +
               n101 * sx * (1 - sy) * sz +
               n011 * (1 - sx) * sy * sz +
               n111 * sx * sy * sz;
    }

    /* ─── Animate ─── */
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        /* Smooth mouse */
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        /* Deform sphere based on noise + mouse */
        const pos = geo.attributes.position;
        const mouseInfluence = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        const deformStrength = 0.12 + mouseInfluence * 0.15;

        for (let i = 0; i < pos.count; i++) {
            const bx = basePositions[i * 3];
            const by = basePositions[i * 3 + 1];
            const bz = basePositions[i * 3 + 2];

            const len = Math.sqrt(bx * bx + by * by + bz * bz);
            const nx = bx / len, ny = by / len, nz = bz / len;

            /* Noise displacement */
            const noiseVal = noise3D(
                nx * 2.0 + t * 0.3 + mouseX * 0.5,
                ny * 2.0 + t * 0.25 + mouseY * 0.5,
                nz * 2.0 + t * 0.2
            );

            /* Mouse-directed bulge */
            const mouseDot = nx * mouseX + ny * mouseY;
            const mouseBulge = Math.max(0, mouseDot) * mouseInfluence * 0.2;

            const displacement = len + (noiseVal - 0.5) * deformStrength + mouseBulge;

            pos.array[i * 3] = nx * displacement;
            pos.array[i * 3 + 1] = ny * displacement;
            pos.array[i * 3 + 2] = nz * displacement;
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();

        /* Gentle rotation */
        sphere.rotation.y = t * 0.15 + mouseX * 0.3;
        sphere.rotation.x = mouseY * 0.2;

        /* Animate particles orbiting */
        const pPos = particles.geometry.attributes.position;
        for (let i = 0; i < pCount; i++) {
            const v = pVelocities[i];
            const px = pPos.array[i * 3];
            const py = pPos.array[i * 3 + 1];
            const pz = pPos.array[i * 3 + 2];

            const p = new THREE.Vector3(px, py, pz);
            p.applyAxisAngle(v.axis, v.speed);

            pPos.array[i * 3] = p.x;
            pPos.array[i * 3 + 1] = p.y;
            pPos.array[i * 3 + 2] = p.z;
        }
        pPos.needsUpdate = true;

        particles.rotation.y = t * 0.05;

        renderer.render(scene, camera);
    }

    /* Start after a short delay to let layout settle */
    setTimeout(() => {
        resize();
        animate();
    }, 100);
})();
