"use client";

import React, { useEffect, useRef } from 'react';

export default function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    // Device Pixel Ratio for crisp, high-definition rendering
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

    // Intense & High-Visibility Dynamic Ocean Wave Shader
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

// Intense ocean wave caustics
float waveCaustics(vec2 uv, float t) {
  vec2 p = uv * 6.0;
  float c1 = sin(p.x + sin(p.y + t * 1.5) + t * 1.2);
  float c2 = cos(p.y + cos(p.x + t * 1.3) + t * 1.4);
  return pow(abs(c1 + c2), 1.3) * 0.35;
}

void main() {
  vec2 uv = v_texCoord;
  float time = u_time * 2.2; // Faster, dynamic wave speed
  
  // High-amplitude wave displacement
  vec2 waveUv = uv;
  waveUv.x += sin(uv.y * 8.0 + time * 2.0) * 0.045;
  waveUv.y += cos(uv.x * 7.0 + time * 1.5) * 0.04;

  float noise1 = snoise(waveUv * 2.5 + time * 0.9);
  float noise2 = snoise(waveUv * 5.0 - time * 0.8);
  float noise3 = snoise(waveUv * 9.0 + time * 1.4);
  
  float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
  
  // Exact Ocean Color Palette from Stitch Theme
  vec3 color1 = vec3(0.02, 0.35, 0.45); // Deep Teal
  vec3 color2 = vec3(0.05, 0.55, 0.65); // Mid Blue
  vec3 color3 = vec3(0.95, 0.98, 1.0);  // Bright Sunlit Foam / Caustics
  
  vec3 color = mix(color1, color2, combinedNoise * 0.5 + 0.5);
  
  // Add bright, highly visible water caustics
  float caustics = waveCaustics(waveUv, time);
  color += vec3(caustics * 1.2, caustics * 1.4, caustics * 1.6);
  
  // Rolling foam crests
  float foam = pow(max(0.0, snoise(waveUv * 12.0 + time * 2.5)), 7.0);
  color = mix(color, color3, foam * 0.6);
  
  // Vignette
  float vig = 1.0 - length(uv - 0.5) * 0.4;
  color *= vig;
  
  gl_FragColor = vec4(color, 0.42); // Higher opacity for intense visibility
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
      {/* Dynamic Background Ocean Image with High-Movement Wave Loop */}
      <div 
        className="absolute inset-[-20px] bg-cover bg-center transition-transform ease-in-out animate-intense-ocean" 
        style={{ 
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_FR1KEjE5gwexJkiOZsQKMZudeNblFOSce_lRXdqKRW-Vc-ZFY6PYX8Rn8gtzsRZVPnkInov4fTmQaPkTunjls6qRWKKeKa7gqDUGbXuKU5KPlrs-sUAHLWNbLeR-l3Z6QQVLfabMLKhVLdP3HaCt_tuS4AWgGloInlFkc8T-UePco8nb-zvT0-rtchWH3iCSu4MZxd-kyFa6b40tg3PB_5KE3LQrXDYzQ9g-MbeC3Y5Y_ySrM_u-hw')` 
        }} 
      />
      {/* WebGL Animated High-Intensity Water Waves & Caustics Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block opacity-90" 
      />
      {/* Soft Semi-transparent Overlay for Text Legibility */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />

      <style jsx global>{`
        @keyframes intenseOcean {
          0%, 100% {
            transform: scale(1.06) translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: scale(1.12) translateY(-14px) translateX(10px) rotate(0.8deg);
          }
          50% {
            transform: scale(1.08) translateY(-4px) translateX(-8px) rotate(-0.5deg);
          }
          75% {
            transform: scale(1.14) translateY(12px) translateX(6px) rotate(0.6deg);
          }
        }
        .animate-intense-ocean {
          animation: intenseOcean 6s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
