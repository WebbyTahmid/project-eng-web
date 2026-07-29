"use client";

import React, { useEffect, useRef } from 'react';

export default function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const syncSize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
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

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;

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

void main() {
  vec2 uv = v_texCoord;
  float time = u_time * 1.2;
  float noise1 = snoise(uv * 2.5 + time);
  float noise2 = snoise(uv * 5.0 - time * 0.7);
  float combinedNoise = mix(noise1, noise2, 0.5);
  
  vec3 color1 = vec3(0.02, 0.35, 0.45);
  vec3 color2 = vec3(0.05, 0.55, 0.65);
  vec3 color3 = vec3(0.9, 0.95, 1.0);
  
  vec3 color = mix(color1, color2, combinedNoise * 0.5 + 0.5);
  float foam = pow(max(0.0, snoise(uv * 12.0 + time * 2.5)), 12.0);
  color = mix(color, color3, foam * 0.5);
  
  float vig = 1.0 - length(uv - 0.5) * 0.6;
  color *= vig;
  
  gl_FragColor = vec4(color, 0.18); 
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
    let animId: number;

    const render = (t: number) => {
      if (canvas) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, t * 0.001);
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
      {/* Background Ocean Image from Stitch Theme */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
        style={{ 
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_FR1KEjE5gwexJkiOZsQKMZudeNblFOSce_lRXdqKRW-Vc-ZFY6PYX8Rn8gtzsRZVPnkInov4fTmQaPkTunjls6qRWKKeKa7gqDUGbXuKU5KPlrs-sUAHLWNbLeR-l3Z6QQVLfabMLKhVLdP3HaCt_tuS4AWgGloInlFkc8T-UePco8nb-zvT0-rtchWH3iCSu4MZxd-kyFa6b40tg3PB_5KE3LQrXDYzQ9g-MbeC3Y5Y_ySrM_u-hw')` 
        }} 
      />
      {/* WebGL Animated Water Waves Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block opacity-80" 
      />
      {/* Soft Semi-transparent Overlay for Text Legibility */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
    </div>
  );
}
