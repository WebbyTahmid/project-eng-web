"use client";

import React, { useEffect, useRef } from 'react';

export default function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    // Crisp high-DPI canvas resolution
    const syncSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor((canvas.clientWidth || 1280) * dpr);
      const h = Math.floor((canvas.clientHeight || 720) * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    // Realistic WebGL Water Surface Caustics Shader
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.wwww) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Natural liquid water caustics pattern
float waveCaustics(vec2 uv, float t) {
  vec2 p = uv * 6.0;
  float c1 = sin(p.x + sin(p.y + t * 1.2) + t * 0.8);
  float c2 = cos(p.y + cos(p.x + t * 1.0) + t * 0.9);
  return pow(abs(c1 + c2), 1.4) * 0.25;
}

void main() {
  vec2 uv = v_texCoord;
  float time = u_time * 1.2;
  
  vec2 waveUv = uv;
  waveUv.x += sin(uv.y * 7.0 + time * 1.4) * 0.025;
  waveUv.y += cos(uv.x * 6.0 + time * 1.1) * 0.02;

  float noise1 = snoise(waveUv * 3.0 + time * 0.6);
  float noise2 = snoise(waveUv * 6.0 - time * 0.5);
  
  float combinedNoise = noise1 * 0.6 + noise2 * 0.4;
  
  // Exact Ocean Color Palette from Stitch Theme
  vec3 color1 = vec3(0.02, 0.35, 0.45); // Deep Teal
  vec3 color2 = vec3(0.05, 0.55, 0.65); // Mid Blue
  vec3 color3 = vec3(0.95, 0.98, 1.0);  // Sunlit Foam
  
  vec3 color = mix(color1, color2, combinedNoise * 0.5 + 0.5);
  
  // Liquid caustics & sunlit reflections
  float caustics = waveCaustics(waveUv, time);
  color += vec3(caustics * 0.9, caustics * 1.1, caustics * 1.3);
  
  // Wave foam
  float foam = pow(max(0.0, snoise(waveUv * 12.0 + time * 1.8)), 8.0);
  color = mix(color, color3, foam * 0.4);
  
  float vig = 1.0 - length(uv - 0.5) * 0.4;
  color *= vig;
  
  gl_FragColor = vec4(color, 0.30);
}`;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    let animId: number;

    const render = (t: number) => {
      if (canvas) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, t * 0.001);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* SVG Liquid Displacement Map Filter Definition */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter 
            id="ocean-fluid-ripple" 
            x="-10%" 
            y="-10%" 
            width="120%" 
            height="120%" 
            filterUnits="objectBoundingBox" 
            primitiveUnits="userSpaceOnUse"
          >
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.012 0.02" 
              numOctaves="3" 
              seed="5" 
              result="fluidNoise"
            >
              <animate 
                attributeName="baseFrequency" 
                dur="9s" 
                values="0.01 0.018;0.018 0.008;0.012 0.025;0.01 0.018" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="fluidNoise" 
              scale="36" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      {/* Ocean Image with Real-time Liquid Pixel Displacement */}
      <div 
        className="absolute inset-[-30px] bg-cover bg-center transition-all" 
        style={{ 
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_FR1KEjE5gwexJkiOZsQKMZudeNblFOSce_lRXdqKRW-Vc-ZFY6PYX8Rn8gtzsRZVPnkInov4fTmQaPkTunjls6qRWKKeKa7gqDUGbXuKU5KPlrs-sUAHLWNbLeR-l3Z6QQVLfabMLKhVLdP3HaCt_tuS4AWgGloInlFkc8T-UePco8nb-zvT0-rtchWH3iCSu4MZxd-kyFa6b40tg3PB_5KE3LQrXDYzQ9g-MbeC3Y5Y_ySrM_u-hw')`,
          filter: 'url(#ocean-fluid-ripple)',
          WebkitFilter: 'url(#ocean-fluid-ripple)'
        }} 
      />

      {/* WebGL Animated Liquid Caustics & Waves Layer */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block opacity-85" 
      />

      {/* Soft Semi-transparent Overlay for Text Legibility */}
      <div className="absolute inset-0 bg-white/65 backdrop-blur-[1px]" />
    </div>
  );
}
