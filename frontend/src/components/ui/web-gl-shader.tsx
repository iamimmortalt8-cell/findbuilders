"use client"

import { useLayoutEffect, useRef } from "react"
import * as THREE from "three"

export function WebGLShader({ className }: { className?: string } = {}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sceneRef = useRef<{
        scene: THREE.Scene | null
        camera: THREE.OrthographicCamera | null
        renderer: THREE.WebGLRenderer | null
        mesh: THREE.Mesh | null
        uniforms: any
        animationId: number | null
    }>({
        scene: null,
        camera: null,
        renderer: null,
        mesh: null,
        uniforms: null,
        animationId: null,
    })

    useLayoutEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const { current: refs } = sceneRef

        const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

        const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      uniform float yOffset;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + yOffset + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + yOffset + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + yOffset + sin((bx + time) * xScale) * yScale);
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `

        const initScene = () => {
            refs.scene = new THREE.Scene()
            refs.renderer = new THREE.WebGLRenderer({ canvas })
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            refs.renderer.setPixelRatio(dpr)
            refs.renderer.setClearColor(new THREE.Color(0x000000))

            refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

            const initW = window.innerWidth
            const initH = window.innerHeight
            const baseOffset = 0.14
            const initYOffset = initW < initH ? baseOffset * (initH / initW) : baseOffset

            refs.uniforms = {
                resolution: { value: [initW, initH] },
                time: { value: 0.0 },
                xScale: { value: 1.0 },
                yScale: { value: 0.40 },
                distortion: { value: 0.05 },
                yOffset: { value: initYOffset },
            }

            const position = [
                -1.0, -1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, 1.0, 0.0,
            ]

            const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute("position", positions)

            const material = new THREE.RawShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: refs.uniforms,
                side: THREE.DoubleSide,
            })

            refs.mesh = new THREE.Mesh(geometry, material)
            refs.scene.add(refs.mesh)

            handleResize()
        }

        const animate = () => {
            if (refs.uniforms) refs.uniforms.time.value += 0.01
            if (refs.renderer && refs.scene && refs.camera) {
                refs.renderer.render(refs.scene, refs.camera)
            }
            refs.animationId = requestAnimationFrame(animate)
        }

        const handleResize = () => {
            if (!refs.renderer || !refs.uniforms) return
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            refs.renderer.setSize(width, height, false)
            refs.renderer.setPixelRatio(dpr)
            refs.uniforms.resolution.value = [width, height]

            // Proportional geometric wave offset: keeps the wave at a consistent fraction of hero height
            const baseOffset = 0.14
            refs.uniforms.yOffset.value = width < height ? baseOffset * (height / width) : baseOffset
        }

        initScene()
        // Ensure first resize after layout stabilises
        requestAnimationFrame(() => {
          handleResize()
          animate()
        })
        const ro = new ResizeObserver(handleResize)
        ro.observe(canvas)
        window.addEventListener("resize", handleResize)

        return () => {
            if (refs.animationId) cancelAnimationFrame(refs.animationId)
            window.removeEventListener("resize", handleResize)
            ro.disconnect()
            if (refs.mesh) {
                refs.scene?.remove(refs.mesh)
                refs.mesh.geometry.dispose()
                if (refs.mesh.material instanceof THREE.Material) {
                    refs.mesh.material.dispose()
                }
            }
            refs.renderer?.dispose()
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className={className || "absolute inset-0 w-full h-full pointer-events-none -z-20"}
        />
    )
}
