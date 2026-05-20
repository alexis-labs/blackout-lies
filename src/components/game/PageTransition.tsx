"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type PageTransitionProps = {
  onComplete: () => void;
};

const TRANSITION_DURATION_MS = 1150;

export function PageTransition({ onComplete }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const uniforms = {
      uProgress: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    };
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;

        varying vec2 vUv;
        uniform float uProgress;
        uniform vec2 uResolution;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          float sweep = smoothstep(uProgress - 0.18, uProgress + 0.12, vUv.y);
          float shutter = smoothstep(0.0, 0.2, uProgress) * (1.0 - smoothstep(0.78, 1.0, uProgress));
          float scanline = step(0.55, fract(vUv.y * uResolution.y * 0.34));
          float grit = random(floor(vUv * uResolution / 4.0));
          float beam = 1.0 - smoothstep(0.0, 0.08, abs(vUv.y - (1.0 - uProgress)));
          vec3 amber = vec3(0.92, 0.66, 0.22);
          vec3 ink = vec3(0.01, 0.01, 0.008);
          vec3 color = mix(ink, amber, beam * 0.55 + grit * 0.08);
          float alpha = max(sweep, shutter * 0.86);
          alpha += scanline * 0.08 + beam * 0.5;
          alpha *= 1.0 - smoothstep(0.86, 1.0, uProgress);

          gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.96));
        }
      `,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let animationFrame = 0;
    let isComplete = false;
    const startedAt = performance.now();

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    }

    function animate(now: number) {
      const progress = Math.min((now - startedAt) / TRANSITION_DURATION_MS, 1);
      uniforms.uProgress.value = progress;
      renderer.render(scene, camera);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      if (!isComplete) {
        isComplete = true;
        onCompleteRef.current();
      }
    }

    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="page-transition" ref={containerRef} aria-hidden="true" />;
}
