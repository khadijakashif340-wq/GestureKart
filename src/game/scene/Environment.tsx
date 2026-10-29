import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_CONSTANTS, LEVELS } from '@/lib/constants';
import { mutableGameState, useGameStore } from '../store';

const NUM_TREES = 80;
const SPREAD_Z = 300;

export const Environment: React.FC = () => {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const level = LEVELS[currentLevelIndex] || LEVELS[0];

  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeFoliageRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-generate static offsets for trees along left canal bank and right road bank
  const treeOffsets = useMemo(() => {
    const list: { x: number; zOffset: number; scale: number }[] = [];
    for (let i = 0; i < NUM_TREES; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft
        ? ROAD_CONSTANTS.CANAL_X - 6.0 - (i % 3) * 1.5
        : ROAD_CONSTANTS.ROAD_WIDTH * 0.5 + 4.5 + (i % 3) * 1.5;
      const zOffset = (i / NUM_TREES) * SPREAD_Z;
      const scale = 0.85 + (i % 5) * 0.12;
      list.push({ x, zOffset, scale });
    }
    return list;
  }, []);

  // Floating dust/golden hour particles
  const particlePositions = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return positions;
  }, []);

  useFrame((_state, delta) => {
    const carZ = mutableGameState.carPosition.z;

    // Reposition trees to loop seamlessly with car
    if (treeTrunkRef.current && treeFoliageRef.current) {
      treeOffsets.forEach((item, idx) => {
        const loopZ = Math.floor((carZ - item.zOffset) / SPREAD_Z) * SPREAD_Z + item.zOffset;
        let finalZ = loopZ;
        if (finalZ < carZ - 50) finalZ += SPREAD_Z;

        // Trunk
        dummy.position.set(item.x, 2.0 * item.scale, finalZ);
        dummy.scale.set(item.scale, item.scale, item.scale);
        dummy.rotation.set(0, (idx * 0.7) % Math.PI, 0);
        dummy.updateMatrix();
        treeTrunkRef.current!.setMatrixAt(idx, dummy.matrix);

        // Foliage
        dummy.position.set(item.x, 5.0 * item.scale, finalZ);
        dummy.scale.set(item.scale * 2.2, item.scale * 2.8, item.scale * 2.2);
        dummy.updateMatrix();
        treeFoliageRef.current!.setMatrixAt(idx, dummy.matrix);
      });

      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeFoliageRef.current.instanceMatrix.needsUpdate = true;
    }

    // Gentle floating particles
    if (particlesRef.current) {
      particlesRef.current.position.z = carZ;
      particlesRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Skybox gradient & fog */}
      <color attach="background" args={[level.skyColors.top]} />
      <fog attach="fog" args={[level.skyColors.bottom, 25, 140]} />

      {/* Sun / Key Directional Light */}
      <directionalLight
        position={level.sunPosition}
        intensity={level.timeOfDay === 'night' ? 0.35 : 1.4}
        color={level.ambientColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight
        intensity={level.timeOfDay === 'night' ? 0.25 : 0.65}
        color={level.ambientColor}
      />

      {/* Instanced Tree Trunks */}
      <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, NUM_TREES]}>
        <cylinderGeometry args={[0.3, 0.45, 4.0, 6]} />
        <meshStandardMaterial color="#422006" roughness={0.9} />
      </instancedMesh>

      {/* Instanced Tree Foliage (Canopy) */}
      <instancedMesh ref={treeFoliageRef} args={[undefined, undefined, NUM_TREES]}>
        <dodecahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color={level.timeOfDay === 'golden-hour' ? '#22543d' : level.timeOfDay === 'dusk' ? '#1c4532' : '#0f291e'}
          roughness={0.8}
        />
      </instancedMesh>

      {/* Distant Lahore Architecture Silhouette (Minarets & Domes) */}
      <group position={[ROAD_CONSTANTS.ROAD_WIDTH * 0.5 + 40, 0, 0]}>
        {[-80, 0, 80, 160].map((offsetZ, i) => (
          <group key={i} position={[0, 0, offsetZ]}>
            {/* Minaret tower */}
            <mesh position={[0, 15, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 30, 8]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            {/* Dome cap */}
            <mesh position={[0, 31, 0]}>
              <sphereGeometry args={[2.2, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshBasicMaterial color="#1e293b" />
            </mesh>
            {/* Distant skyline block */}
            <mesh position={[8, 8, 15]}>
              <boxGeometry args={[14, 16, 25]} />
              <meshBasicMaterial color="#090d16" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Floating dust / ambient atmosphere particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color={level.timeOfDay === 'golden-hour' ? '#fcd34d' : '#38bdf8'}
          transparent
          opacity={0.65}
        />
      </points>
    </group>
  );
};
