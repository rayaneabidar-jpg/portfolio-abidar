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

    // ── Environment cube map ──
    const cubeRT = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRT);

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
                vec3 dark = vec3(0.01, 0.03, 0.01);
                vec3 mid = vec3(0.08, 0.16, 0.05);
                vec3 bright = vec3(0.20, 0.30, 0.10);
                vec3 highlight = vec3(0.35, 0.45, 0.18);
                vec3 col = mix(dark, mid, smoothstep(0.0, 0.35, y));
                col = mix(col, bright, smoothstep(0.35, 0.65, y));
                col = mix(col, highlight, smoothstep(0.75, 1.0, y));
                float x = vWorldPos.x * 0.15 + 0.5;
                col *= 0.8 + 0.4 * smoothstep(0.2, 0.8, x);
                gl_FragColor = vec4(col, 1.0);
            }
        `
    });
    envScene.add(new THREE.Mesh(envGeo, envMat));

    const spotGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const spot1 = new THREE.Mesh(spotGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 1.2, 0.4) }));
    spot1.position.set(2, 2, 1);
    envScene.add(spot1);
    const spot2 = new THREE.Mesh(spotGeo.clone(), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.8, 0.25) }));
    spot2.position.set(-2, -1, 2);
    envScene.add(spot2);

    cubeCamera.update(renderer, envScene);

    // ── GPU-based morphing sphere (shader displacement) ──
    const geo = new THREE.IcosahedronGeometry(1.2, 48);

    // Noise GLSL (simplex 3D)
    const noiseGLSL = `
        vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }
    `;

    const uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(0.10, 0.20, 0.06) },
        envMap: { value: cubeRT.texture },
    };

    const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            ${noiseGLSL}
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying float vDisplacement;

            void main() {
                vec3 norm = normalize(position);
                float freq = 1.2;
                float amp = 0.18;

                // Two octaves of noise
                float n1 = snoise(norm * freq + uTime * 0.3) * amp;
                float n2 = snoise(norm * freq * 2.0 + uTime * 0.15 + 0.5) * amp * 0.4;

                // Mouse influence
                float mouseInf = (norm.x * uMouse.x + norm.y * uMouse.y) * 0.08;

                float disp = 1.0 + n1 + n2 + mouseInf;
                vDisplacement = n1 + n2;

                vec3 newPos = position * disp;

                // Compute displaced normal via finite differences
                float eps = 0.01;
                vec3 tangent1 = normalize(cross(norm, vec3(0.0, 1.0, 0.0)));
                if (length(tangent1) < 0.001) tangent1 = normalize(cross(norm, vec3(1.0, 0.0, 0.0)));
                vec3 tangent2 = normalize(cross(norm, tangent1));

                vec3 n1a = normalize(position + tangent1 * eps);
                vec3 n2a = normalize(position + tangent2 * eps);
                float d1 = 1.0 + snoise(n1a * freq + uTime * 0.3) * amp
                          + snoise(n1a * freq * 2.0 + uTime * 0.15 + 0.5) * amp * 0.4
                          + (n1a.x * uMouse.x + n1a.y * uMouse.y) * 0.08;
                float d2 = 1.0 + snoise(n2a * freq + uTime * 0.3) * amp
                          + snoise(n2a * freq * 2.0 + uTime * 0.15 + 0.5) * amp * 0.4
                          + (n2a.x * uMouse.x + n2a.y * uMouse.y) * 0.08;

                vec3 p1 = (position + tangent1 * eps) * d1;
                vec3 p2 = (position + tangent2 * eps) * d2;
                vNormal = normalize(cross(p1 - newPos, p2 - newPos));

                vViewPos = (modelViewMatrix * vec4(newPos, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform samplerCube envMap;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying float vDisplacement;

            void main() {
                vec3 norm = normalize(vNormal);
                vec3 viewDir = normalize(-vViewPos);
                vec3 reflected = reflect(-viewDir, norm);

                // Environment reflection
                vec3 envColor = textureCube(envMap, reflected).rgb;

                // Fresnel
                float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);

                // Base metallic color
                vec3 baseColor = uColor;

                // Mix: metallic reflection — deep dark green
                vec3 col = mix(baseColor * envColor * 1.8, envColor * 1.0, fresnel * 0.5 + 0.2);

                // Slight variation based on displacement
                col += vDisplacement * vec3(0.15, 0.25, 0.05);

                // Tone mapping approximation
                col = col / (col + 1.0);
                col = pow(col, vec3(1.0 / 2.2));

                gl_FragColor = vec4(col, 1.0);
            }
        `
    });

    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    // ── Mouse tracking ──
    let mouseX = 0, mouseY = 0;
    let smoothX = 0, smoothY = 0;

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

    // ── Animate ──
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Smooth mouse
        smoothX += (mouseX - smoothX) * 0.03;
        smoothY += (mouseY - smoothY) * 0.03;

        // Update uniforms (GPU does the work)
        uniforms.uTime.value = t;
        uniforms.uMouse.value.set(smoothX, smoothY);

        // Slow rotation + mouse tilt
        sphere.rotation.y = t * 0.12 + smoothX * 0.4;
        sphere.rotation.x = -0.15 + smoothY * 0.3;

        // Subtle float
        sphere.position.y = Math.sin(t * 0.6) * 0.08;

        renderer.render(scene, camera);
    }

    animate();
})();
