import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mutableGameState } from '../store';

export const Effects: React.FC = () => {
  const sparksRef = useRef<THREE.Points>(null);
  const streaksRef = useRef<THREE.LineSegments>(null);

  // Pre-allocate spark particles
  const sparkPositions = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    return pos;
  }, []);

  // Speed streak line segments
  const streakPositions = useMemo(() => {
    const count = 30;
    const pos = new Float32Array(count * 6); // 2 vertices per line
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = Math.random() * 4 + 0.5;
      const z = Math.random() * 40;
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y;
      pos[i * 6 + 5] = z + 3.0;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    const carX = mutableGameState.carPosition.x;
    const carZ = mutableGameState.carPosition.z;
    const speed = mutableGameState.carSpeed;

    // Speed streak lines visible when traveling > 55 km/h
    if (streaksRef.current) {
      if (speed > 55) {
        streaksRef.current.visible = true;
        streaksRef.current.position.set(carX * 0.4, 0, carZ - 10);
      } else {
        streaksRef.current.visible = false;
      }
    }

    // Sparks during collision invulnerability window
    if (sparksRef.current) {
      if (mutableGameState.invulnerabilityTimer > 0) {
        sparksRef.current.visible = true;
        sparksRef.current.position.set(carX, 0.4, carZ + 1.8);
        sparksRef.current.rotation.y += delta * 15;
      } else {
        sparksRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* Collision Sparks */}
      <points ref={sparksRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#f59e0b"
          transparent
          opacity={0.9}
        />
      </points>

      {/* Speed Streaks */}
      <lineSegments ref={streaksRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[streakPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.35}
        />
      </lineSegments>
    </group>
  );
};
