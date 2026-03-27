import * as THREE from 'three';

(function () {
    const container = document.getElementById('hero-3d');
    if (!container) return;

    // ── Setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── Environment (fake matcap-like lighting) ──
    const cubeRT = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRT);

    // Build a simple env scene with green gradients
    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(5, 32, 32);
    const envMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vWorldPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPos;
            void main() {
                float y = vWorldPos.y * 0.1 + 0.5;
                vec3 dark = vec3(0.04, 0.06, 0.02);
                vec3 mid = vec3(0.18, 0.33, 0.1);
                vec3 bright = vec3(0.56, 0.66, 0.33);
                vec3 highlight = vec3(0.93, 0.95, 0.62);
                vec3 col = mix(dark, mid, smoothstep(0.0, 0.35, y));
                col = mix(col, bright, smoothstep(0.35, 0.65, y));
                col = mix(col, highlight, smoothstep(0.75, 1.0, y));
                // Add horizontal variation
                float x = vWorldPos.x * 0.15 + 0.5;
                col *= 0.8 + 0.4 * smoothstep(0.2, 0.8, x);
                gl_FragColor = vec4(col, 1.0);
            }
        `
    });
    envScene.add(new THREE.Mesh(envGeo, envMat));

    // Add bright spot lights to env
    const spotGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const spotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 2.5, 1.2) });
    const spot1 = new THREE.Mesh(spotGeo, spotMat);
    spot1.position.set(2, 2, 1);
    envScene.add(spot1);
    const spot2 = new THREE.Mesh(spotGeo.clone(), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 1.8, 0.6) }));
    spot2.position.set(-2, -1, 2);
    envScene.add(spot2);

    cubeCamera.update(renderer, envScene);

    // ── Morphing sphere ──
    const geo = new THREE.IcosahedronGeometry(1.2, 64);
    const posAttr = geo.attributes.position;
    const origPositions = new Float32Array(posAttr.array);

    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.22, 0.42, 0.12),
        metalness: 1.0,
        roughness: 0.08,
        envMap: cubeRT.texture,
        envMapIntensity: 2.5,
    });

    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    // ── Lights ──
    const amb = new THREE.AmbientLight(0x1a2e0a, 0.3);
    scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0x90A955, 1.5);
    dir1.position.set(3, 4, 2);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xECF39E, 0.8);
    dir2.position.set(-2, -1, 3);
    scene.add(dir2);

    const point = new THREE.PointLight(0x4F772D, 1.2, 10);
    point.position.set(0, 2, 3);
    scene.add(point);

    // ── Mouse tracking ──
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ── Resize ──
    function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Noise (simplex-like) ──
    function mod289(x) { return x - Math.floor(x / 289.0) * 289.0; }
    function permute(x) { return mod289((x * 34.0 + 1.0) * x); }

    function noise3D(x, y, z) {
        // Simple value noise with smooth interpolation
        const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        const fx = x - ix, fy = y - iy, fz = z - iz;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const sz = fz * fz * (3 - 2 * fz);

        function hash(i, j, k) {
            let n = i * 157 + j * 113 + k * 271;
            n = (n << 13) ^ n;
            return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 2147483647.0;
        }

        const v000 = hash(ix, iy, iz);
        const v100 = hash(ix + 1, iy, iz);
        const v010 = hash(ix, iy + 1, iz);
        const v110 = hash(ix + 1, iy + 1, iz);
        const v001 = hash(ix, iy, iz + 1);
        const v101 = hash(ix + 1, iy, iz + 1);
        const v011 = hash(ix, iy + 1, iz + 1);
        const v111 = hash(ix + 1, iy + 1, iz + 1);

        return v000 * (1 - sx) * (1 - sy) * (1 - sz)
            + v100 * sx * (1 - sy) * (1 - sz)
            + v010 * (1 - sx) * sy * (1 - sz)
            + v110 * sx * sy * (1 - sz)
            + v001 * (1 - sx) * (1 - sy) * sz
            + v101 * sx * (1 - sy) * sz
            + v011 * (1 - sx) * sy * sz
            + v111 * sx * sy * sz;
    }

    // ── Animate ──
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Smooth mouse follow
        targetX += (mouseX - targetX) * 0.03;
        targetY += (mouseY - targetY) * 0.03;

        // Morph vertices
        const freq = 1.2;
        const amp = 0.18;
        for (let i = 0; i < posAttr.count; i++) {
            const ox = origPositions[i * 3];
            const oy = origPositions[i * 3 + 1];
            const oz = origPositions[i * 3 + 2];

            const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
            const nx = ox / len, ny = oy / len, nz = oz / len;

            // Layered noise for organic movement
            const n1 = noise3D(nx * freq + t * 0.3, ny * freq + t * 0.2, nz * freq) * amp;
            const n2 = noise3D(nx * freq * 2 + t * 0.15, ny * freq * 2 - t * 0.1, nz * freq * 2 + 0.5) * amp * 0.4;

            // Mouse influence — push geometry toward cursor
            const mouseInfluence = (nx * targetX + ny * targetY) * 0.08;

            const displacement = 1 + n1 + n2 + mouseInfluence;

            posAttr.setXYZ(i,
                ox * displacement,
                oy * displacement,
                oz * displacement
            );
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();

        // Slow rotation + mouse tilt
        sphere.rotation.y = t * 0.12 + targetX * 0.4;
        sphere.rotation.x = -0.15 + targetY * 0.3;

        // Subtle float
        sphere.position.y = Math.sin(t * 0.6) * 0.08;

        renderer.render(scene, camera);
    }

    animate();
})();
