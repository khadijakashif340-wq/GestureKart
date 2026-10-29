import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_CONSTANTS } from '@/lib/constants';
import { mutableGameState } from '../store';

const CHUNK_LEN = ROAD_CONSTANTS.CHUNK_LENGTH;
const NUM_CHUNKS = ROAD_CONSTANTS.ACTIVE_CHUNKS;

export const Road: React.FC = () => {
  const roadChunksRef = useRef<THREE.Group[]>([]);
  const dashesRef = useRef<THREE.InstancedMesh>(null);
  const lampPostsRef = useRef<THREE.InstancedMesh>(null);

  // Instanced dashed lane lines: 2 lane dividers on 3-lane road
  // Each chunk has several dashes
  const dashesPerChunk = 20;
  const totalDashes = NUM_CHUNKS * dashesPerChunk * 2;

  // Lamp posts along road median/bank
  const lampsPerChunk = 4;
  const totalLamps = NUM_CHUNKS * lampsPerChunk;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const carZ = mutableGameState.carPosition.z;

    // Road chunk positioning & recycling
    roadChunksRef.current.forEach((chunk, i) => {
      if (!chunk) return;
      const baseZ = Math.floor(carZ / CHUNK_LEN) * CHUNK_LEN;
      let targetZ = baseZ + (i - 1) * CHUNK_LEN;
      if (targetZ < carZ - CHUNK_LEN) {
        targetZ += NUM_CHUNKS * CHUNK_LEN;
      }
      chunk.position.z = targetZ;
    });

    // Update instanced lane dashes
    if (dashesRef.current) {
      let instanceIdx = 0;
      roadChunksRef.current.forEach((chunk) => {
        if (!chunk) return;
        const chunkZ = chunk.position.z;
        const dashStep = CHUNK_LEN / dashesPerChunk;

        // Dividers between lanes at x = -1.8 and x = +1.8
        [-1.8, 1.8].forEach((laneDividerX) => {
          for (let d = 0; d < dashesPerChunk; d++) {
            if (instanceIdx < totalDashes) {
              const z = chunkZ + d * dashStep;
              dummy.position.set(laneDividerX, 0.02, z);
              dummy.scale.set(0.18, 1, 3.2);
              dummy.rotation.set(0, 0, 0);
              dummy.updateMatrix();
              dashesRef.current!.setMatrixAt(instanceIdx, dummy.matrix);
              instanceIdx++;
            }
          }
        });
      });
      dashesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update instanced lamp posts along right median
    if (lampPostsRef.current) {
      let lampIdx = 0;
      roadChunksRef.current.forEach((chunk) => {
        if (!chunk) return;
        const chunkZ = chunk.position.z;
        const lampStep = CHUNK_LEN / lampsPerChunk;

        for (let l = 0; l < lampsPerChunk; l++) {
          if (lampIdx < totalLamps) {
            const z = chunkZ + l * lampStep;
            dummy.position.set(ROAD_CONSTANTS.ROAD_WIDTH * 0.5 + 0.5, 0, z);
            dummy.scale.set(1, 1, 1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            lampPostsRef.current!.setMatrixAt(lampIdx, dummy.matrix);
            lampIdx++;
          }
        }
      });
      lampPostsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Road Chunks */}
      {Array.from({ length: NUM_CHUNKS }).map((_, idx) => (
        <group
          key={idx}
          ref={(el) => {
            if (el) roadChunksRef.current[idx] = el;
          }}
        >
          {/* Main Asphalt Surface */}
          <mesh position={[0, 0, CHUNK_LEN * 0.5]} receiveShadow>
            <planeGeometry args={[ROAD_CONSTANTS.ROAD_WIDTH, CHUNK_LEN]} />
            <meshStandardMaterial color="#1a202c" roughness={0.85} metalness={0.15} />
          </mesh>

          {/* Road Left Solid Yellow Edge Line (facing canal) */}
          <mesh position={[-ROAD_CONSTANTS.ROAD_WIDTH * 0.5 + 0.1, 0.02, CHUNK_LEN * 0.5]}>
            <planeGeometry args={[0.2, CHUNK_LEN]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>

          {/* Road Right Solid White Edge Line */}
          <mesh position={[ROAD_CONSTANTS.ROAD_WIDTH * 0.5 - 0.1, 0.02, CHUNK_LEN * 0.5]}>
            <planeGeometry args={[0.2, CHUNK_LEN]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>

          {/* Median Curb on Right */}
          <mesh position={[ROAD_CONSTANTS.ROAD_WIDTH * 0.5 + 0.6, 0.2, CHUNK_LEN * 0.5]}>
            <boxGeometry args={[1.2, 0.4, CHUNK_LEN]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>

          {/* Canal Embankment Barrier on Left */}
          <mesh position={[ROAD_CONSTANTS.CANAL_X + 4.5, 0.35, CHUNK_LEN * 0.5]}>
            <boxGeometry args={[0.4, 0.7, CHUNK_LEN]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>

          {/* Green verge between road and canal */}
          <mesh position={[-8.5, 0.05, CHUNK_LEN * 0.5]} receiveShadow>
            <planeGeometry args={[5.0, CHUNK_LEN]} />
            <meshStandardMaterial color="#2d4a22" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Instanced Dashed Lane Lines */}
      <instancedMesh ref={dashesRef} args={[undefined, undefined, totalDashes]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>

      {/* Instanced Lamp Posts */}
      <instancedMesh ref={lampPostsRef} args={[undefined, undefined, totalLamps]}>
        <boxGeometry args={[0.18, 6.0, 0.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
      </instancedMesh>
    </group>
  );
};
