import React from "react";
import { Canvas } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";

const pencils = [
    { color: "#8B4513", label: "FAMILY", number: "1" },
    { color: "#7CFC00", label: "FINANCE", number: "2" },
    { color: "#1E90FF", label: "GOVERNMENT", number: "3" },
    { color: "#FFD700", label: "SPIRITUALITY", number: "4" },
    { color: "#8A2BE2", label: "TALENT", number: "5" },
    { color: "#FF8C00", label: "TRAINING", number: "6" },
    { color: "#FF0000", label: "SERVICE", number: "7" }
];

function Pencil({ position, color, label, number }) {
    return (
        <group position={position}>
            {/* Pencil Body */}
            <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.3, 4, 32]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Wood Tip */}
            <mesh position={[0, 2.3, 0]}>
                <coneGeometry args={[0.3, 0.8, 32]} />
                <meshStandardMaterial color="#DEB887" />
            </mesh>

            {/* Graphite Tip */}
            <mesh position={[0, 2.8, 0]}>
                <coneGeometry args={[0.1, 0.4, 32]} />
                <meshStandardMaterial color="black" />
            </mesh>

            {/* Bottom Base */}
            <mesh position={[0, -2.4, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 0.6, 32]} />
                <meshStandardMaterial color="#cccccc" />
            </mesh>

            {/* Number */}
            <Text
                position={[0, -2.4, 0.36]}
                fontSize={0.35}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {number}
            </Text>

            {/* Bold Black Label */}
            <Text
                position={[0, 0, 0.32]}
                rotation={[0, 0, 0]}
                fontSize={0.4}
                color="black"
                anchorX="center"
                anchorY="middle"
                maxWidth={3}
                lineHeight={1}
            >
                {label}
            </Text>
        </group>
    );
}

export default function Pencil3DScene() {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 2, 10], fov: 50 }}
            style={{ height: "500px", background: "#f5f5f5" }}
        >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />

            {pencils.map((p, i) => (
                <Pencil
                    key={i}
                    position={[i * 1.2 - 3.6, 0, 0]}
                    {...p}
                />
            ))}

            <OrbitControls />
        </Canvas>
    );
}