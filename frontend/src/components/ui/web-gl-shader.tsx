"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export interface WebGLShaderProps {
    className?: string
    mobileIntensity?: number
    mobileColorShift?: number
    mobileYScale?: number
    mobileYOffset?: number
    mobileSoftness?: number
    desktopIntensity?: number
    desktopSoftness?: number
}

export function WebGLShader({
    className,
    mobileIntensity = 0.038,
    mobileColorShift = 0.16,
    mobileYScale = 0.28,
    mobileYOffset = -0.46,
    mobileSoftness = 0.018,
    desktopIntensity = 0.036,
    desktopSoftness = 0.016,
}: WebGLShaderProps = {}) {
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

    useEffect(() => {
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
      uniform float intensity;
      uniform float colorShift;
      uniform float yOffset;
      uniform float softness;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d) + colorShift;
        float gx = p.x;
        float bx = p.x * (1.0 - d) - colorShift;

        float py = p.y - yOffset;

        float r = intensity / (abs(py + sin((rx + time) * xScale) * yScale) + softness);
        float g = intensity / (abs(py + sin((gx + time) * xScale) * yScale) + softness);
        float b = intensity / (abs(py + sin((bx + time) * xScale) * yScale) + softness);
        
        float alpha = clamp(max(r, max(g, b)), 0.0, 1.0);
        gl_FragColor = vec4(r, g, b, alpha);
      }
    `

        const updateUniforms = (width: number, height: number) => {
            if (!refs.uniforms || !refs.renderer) return
            const isMobile = width < 768
            const dpr = refs.renderer.getPixelRatio()

            // Drawing buffer resolution so gl_FragCoord maps 1:1 on all DPRs
            refs.uniforms.resolution.value = [width * dpr, height * dpr]

            if (isMobile) {
                // Mobile-optimized: gentle contrast, soft glow, compressed ribbon, framed below heading text
                refs.uniforms.intensity.value = mobileIntensity
                refs.uniforms.colorShift.value = mobileColorShift
                refs.uniforms.yScale.value = mobileYScale
                refs.uniforms.yOffset.value = mobileYOffset
                refs.uniforms.softness.value = mobileSoftness
                refs.uniforms.xScale.value = 1.0
                refs.uniforms.distortion.value = 0.05
            } else {
                // Desktop / Laptop: Softened lighting & contrast while preserving exact wave shape & animation
                refs.uniforms.intensity.value = desktopIntensity
                refs.uniforms.colorShift.value = 0.0
                refs.uniforms.yScale.value = 0.5
                refs.uniforms.yOffset.value = 0.0
                refs.uniforms.softness.value = desktopSoftness
                refs.uniforms.xScale.value = 1.0
                refs.uniforms.distortion.value = 0.05
            }
        }

        const initScene = () => {
            refs.scene = new THREE.Scene()
            refs.renderer = new THREE.WebGLRenderer({ canvas, alpha: true })
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            refs.renderer.setPixelRatio(dpr)
            refs.renderer.setClearColor(new THREE.Color(0x000000), 0)

            refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

            const width = window.innerWidth
            const height = window.innerHeight

            refs.uniforms = {
                resolution: { value: [width * dpr, height * dpr] },
                time: { value: 0.0 },
                xScale: { value: 1.0 },
                yScale: { value: 0.5 },
                distortion: { value: 0.05 },
                intensity: { value: 0.05 },
                colorShift: { value: 0.0 },
                yOffset: { value: 0.0 },
                softness: { value: 0.0 },
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
            const width = window.innerWidth
            const height = window.innerHeight
            refs.renderer.setSize(width, height, false)
            updateUniforms(width, height)
        }

        initScene()
        animate()
        window.addEventListener("resize", handleResize)

        return () => {
            if (refs.animationId) cancelAnimationFrame(refs.animationId)
            window.removeEventListener("resize", handleResize)
            if (refs.mesh) {
                refs.scene?.remove(refs.mesh)
                refs.mesh.geometry.dispose()
                if (refs.mesh.material instanceof THREE.Material) {
                    refs.mesh.material.dispose()
                }
            }
            refs.renderer?.dispose()
        }
    }, [mobileIntensity, mobileColorShift, mobileYScale, mobileYOffset, mobileSoftness, desktopIntensity, desktopSoftness])

    return (
        <canvas
            ref={canvasRef}
            className={className || "absolute inset-0 w-full h-full pointer-events-none -z-20"}
        />
    )
}
