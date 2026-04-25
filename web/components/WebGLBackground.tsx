"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
uniform float uTime;
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
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

void main() {
  vColor = customColor;
  vec3 pos = position;
  float wave = sin(pos.x * 0.15 + uTime * 0.3) * 1.8;
  wave += sin(pos.z * 0.2 + uTime * 0.2) * 1.5;
  float noise = snoise(vec3(pos.x * 0.08, pos.z * 0.08, uTime * 0.08));
  pos.y += wave + noise * 2.5;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = size * (120.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  float depthFade = smoothstep(15.0, 60.0, -mvPosition.z);
  vColor = mix(vColor, vec3(0.02, 0.02, 0.05), depthFade * 0.95);
}
`;

const FRAGMENT_SHADER = `
varying vec3 vColor;
void main() {
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, dist);
  gl_FragColor = vec4(vColor, alpha * 0.9);
}
`;

export default function WebGLBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    async function init() {
      const THREE = await import("three");
      const { EffectComposer } = await import(
        "three/examples/jsm/postprocessing/EffectComposer.js"
      );
      const { RenderPass } = await import(
        "three/examples/jsm/postprocessing/RenderPass.js"
      );
      const { UnrealBloomPass } = await import(
        "three/examples/jsm/postprocessing/UnrealBloomPass.js"
      );

      if (disposed || !container) return;

      const GRID_SIZE = 100;
      const PARTICLE_COUNT = GRID_SIZE * GRID_SIZE;
      const SPACING = 0.55;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#04080f");

      const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        200
      );
      camera.position.set(0, 8, 30);
      camera.rotation.set(-Math.PI / 8, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const sizes = new Float32Array(PARTICLE_COUNT);

      const cyan = new THREE.Color("#00D1FF");
      const violet = new THREE.Color("#7000FF");

      let idx = 0;
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          positions[idx * 3] = (x - GRID_SIZE / 2) * SPACING;
          positions[idx * 3 + 1] = 0;
          positions[idx * 3 + 2] = (z - GRID_SIZE / 2) * SPACING;
          const c = Math.random() > 0.85 ? violet : cyan;
          colors[idx * 3] = c.r;
          colors[idx * 3 + 1] = c.g;
          colors[idx * 3 + 2] = c.b;
          sizes[idx] = Math.random() * 1.5 + 1.0;
          idx++;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "customColor",
        new THREE.BufferAttribute(colors, 3)
      );
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const uniforms = { uTime: { value: 0 } };

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      points.position.y = -6;
      scene.add(points);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.6,
        0.8,
        0.2
      );
      composer.addPass(bloomPass);

      const timer = new THREE.Timer();
      timer.connect(document);
      let animId: number;

      function animate(timestamp?: number) {
        if (disposed) return;
        animId = requestAnimationFrame(animate);
        timer.update(timestamp);
        uniforms.uTime.value = timer.getElapsed();
        composer.render();
      }

      function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      }

      window.addEventListener("resize", onResize);
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        timer.dispose();
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        container.removeChild(renderer.domElement);
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((c) => {
      cleanup = c;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div id="webgl-bg" ref={containerRef} aria-hidden="true" />;
}
