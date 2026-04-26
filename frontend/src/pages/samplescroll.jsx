"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function ScrollCylinder({ scrollProgress }) {
    const meshRef = useRef();
    const texture = useTexture("/scrollimage.jpeg");

    useFrame(() => {
        if (!meshRef.current) return;

        // Rotate cylinder to simulate unrolling
        meshRef.current.rotation.x = Math.PI / 2 - scrollProgress * (Math.PI / 2);

        // Slight scale stretch for realism
        meshRef.current.scale.y = 0.5 + scrollProgress * 1.5;
    });

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <cylinderGeometry args={[2, 2, 6, 64, 1, true]} />
            <meshStandardMaterial
                map={texture}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

export default function Scroll3D() {
    const scrollRef = useRef(0);

    // Track scroll manually (no heavy libs)
    if (typeof window !== "undefined") {
        window.onscroll = () => {
            const maxScroll =
                document.body.scrollHeight - window.innerHeight;
            scrollRef.current = window.scrollY / maxScroll;
        };
    }

    return (
        <div className="h-[200vh] bg-black">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>

                {/* Lighting */}
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 5, 5]} intensity={1} />

                {/* Scroll */}
                <ScrollCylinder scrollProgress={scrollRef.current} />

            </Canvas>
        </div>
    );
}