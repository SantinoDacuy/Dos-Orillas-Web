"use client"

// From GradFlow, animated WebGL gradients for React: https://gradflow.meerbahadin.dev

import { useEffect, useRef } from "react"

export interface GlassFoldProps {
  /** The body of each glass pane. */
  color1?: string
  /** The background. */
  color2?: string
  /** The lit edges. */
  color3?: string
  /** Animation speed. 0 freezes it. */
  speed?: number
  /** How tightly the folds are packed. Higher is more, smaller folds. */
  scale?: number
  /** Film grain, 0 to 0.5. */
  noise?: number
  className?: string
}

const VERTEX = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAGMENT = `
  precision highp float;

  uniform float u_time;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_scale;
  uniform float u_noise;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float grain(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // centered coordinates, y in [-0.5, 0.5], x stretched by the aspect ratio
  vec2 centered(vec2 uv) {
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / max(u_resolution.y, 1.0);
    return p;
  }

  mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  // panes of glass folded over each other with uniform distribution from top to bottom
  vec3 shade(vec2 uv, float time) {
    vec2 q = rot(0.32) * centered(uv) * 1.8 * u_scale;
    float t = time * 0.5;
    float pixel = 2.0 * u_scale / max(u_resolution.y, 1.0);

    vec3 color = u_color2;

    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float bend = mod(fi, 2.0) * 2.0 - 1.0;

      // Distribute creases evenly across the canvas so top and bottom are equally balanced
      float crease = (fi - 2.5) * 0.52
                   + 0.22 * sin(q.x * (0.9 + 0.11 * fi) + fi * 1.7 + t * (0.22 + 0.04 * fi))
                   + 0.05 * bend * q.x * q.x;
      float s = q.y - crease;
      float pane = smoothstep(-pixel, pixel, s);
      float back = max(s, 0.0);

      // Soft body falloff and gentle fresnel
      float body = exp(-back * 1.5);
      float fresnel = exp(-back * 6.0);
      // Softened lit edge and bloom so it remains atmospheric without overpowering typography
      float rim = exp(-back * 45.0);
      float inner = exp(-pow((back - 0.045) / 0.018, 2.0));
      float bloom = exp(-abs(s) * 14.0);

      vec3 tint = mix(u_color1, u_color3, clamp(fresnel * 0.5 + 0.1 + 0.12 * sin(fi * 2.0 + q.x * 0.7 + t * 0.2), 0.0, 1.0));
      vec3 light = (tint * pane * (body * 0.26 + fresnel * 0.24)
                 + u_color3 * (pane * (rim * 0.22 + inner * 0.05) + bloom * 0.04)) * 0.38;

      // screen blend
      color += light * (1.0 - color);
    }

    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec3 color = shade(vUv, u_time);
    if (u_noise > 0.001) {
      float g = grain(vUv * 200.0 + u_time * 0.1);
      color *= 1.0 - u_noise * 0.4 + u_noise * g * 0.4;
    }
    gl_FragColor = vec4(color, 1.0);
  }
`

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export function GlassFold({
  color1 = "#0e3a66",
  color2 = "#071725",
  color3 = "#38bdf8",
  speed = 0.4,
  scale = 1.1,
  noise = 0.08,
  className,
}: GlassFoldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // the draw loop reads the latest props from here, so changing one never
  // rebuilds the WebGL program
  const props = useRef({ color1, color2, color3, speed, scale, noise })
  props.current = { color1, color2, color3, speed, scale, noise }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" })
    if (!gl) return

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const position = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uniform = (name: string) => gl.getUniformLocation(program, name)
    const u = {
      time: uniform("u_time"),
      color1: uniform("u_color1"),
      color2: uniform("u_color2"),
      color3: uniform("u_color3"),
      scale: uniform("u_scale"),
      noise: uniform("u_noise"),
      resolution: uniform("u_resolution"),
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
    }

    let elapsed = 0
    let last: number | null = null
    let frame = 0
    let isVisible = true

    const io = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
    }, { threshold: 0.05 });
    io.observe(canvas);

    const draw = (now: number) => {
      if (!isVisible) return;
      const p = props.current
      // accumulate speed over time, so changing it never makes the pattern jump
      if (last !== null) elapsed += Math.min((now - last) / 1000, 0.1) * p.speed
      last = now

      resize()
      if (canvas.width > 0 && canvas.height > 0) {
        gl.useProgram(program)
        gl.uniform1f(u.time, elapsed)
        gl.uniform3fv(u.color1, hexToVec3(p.color1))
        gl.uniform3fv(u.color2, hexToVec3(p.color2))
        gl.uniform3fv(u.color3, hexToVec3(p.color3))
        gl.uniform1f(u.scale, p.scale)
        gl.uniform1f(u.noise, p.noise)
        gl.uniform2f(u.resolution, canvas.width, canvas.height)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const loop = (now: number) => {
      draw(now)
      if (!still) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    // with motion off there is no loop, so repaint the still frame on resize
    const observer = new ResizeObserver(() => {
      if (still) draw(performance.now())
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      io.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  )
}

export default GlassFold
