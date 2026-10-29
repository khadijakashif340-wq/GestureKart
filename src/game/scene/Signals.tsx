import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_CONSTANTS } from '@/lib/constants';
import { mutableGameState } from '../store';
import { SignalState, SignalColor } from '@/types';

interface GantryData {
  id: string;
  z: number;
  stopLineZ: number;
  cycleTime: number; // Current timer in cycle
  color: SignalColor;
  passed: boolean;
  violated: boolean;
  perfectStopAwarded: boolean;
}

const NUM_SIGNALS = 4;
const SIGNAL_SPACING = 280;

export const Signals: React.FC = () => {
  const signalGantries = useMemo<GantryData[]>(() => {
    const list: GantryData[] = [];
    for (let i = 0; i < NUM_SIGNALS; i++) {
      const z = 140 + i * SIGNAL_SPACING;
      list.push({
        id: `signal-${i}`,
        z,
        stopLineZ: z - 6,
        cycleTime: i * 7.5, // Stagger cycles
        color: 'green',
        passed: false,
        violated: false,
        perfectStopAwarded: false,
      });
    }
    return list;
  }, []);

  const signalMeshesRef = useRef<THREE.Group[]>([]);

  useFrame((_, delta) => {
    const carZ = mutableGameState.carPosition.z;
    const activeStates: SignalState[] = [];

    signalGantries.forEach((sig, idx) => {
      // Cycle logic: 14s Green -> 3.5s Yellow -> 10s Red (Total 27.5s)
      sig.cycleTime = (sig.cycleTime + delta) % 27.5;

      if (sig.cycleTime < 14.0) {
        sig.color = 'green';
      } else if (sig.cycleTime < 17.5) {
        sig.color = 'yellow';
      } else {
        sig.color = 'red';
      }

      // Recycle gantry ahead when car drives past
      if (sig.z < carZ - 30) {
        sig.z += NUM_SIGNALS * SIGNAL_SPACING;
        sig.stopLineZ = sig.z - 6;
        sig.passed = false;
        sig.violated = false;
        sig.perfectStopAwarded = false;
      }

      activeStates.push({
        id: sig.id,
        z: sig.z,
        stopLineZ: sig.stopLineZ,
        color: sig.color,
        timeInState: sig.cycleTime,
        passed: sig.passed,
        violated: sig.violated,
        perfectStopAwarded: sig.perfectStopAwarded,
      });

      // Update 3D gantry position
      const group = signalMeshesRef.current[idx];
      if (group) {
        group.position.z = sig.z;
      }
    });

    mutableGameState.activeSignals = activeStates;
  });

  return (
    <group>
      {signalGantries.map((sig, idx) => (
        <group
          key={sig.id}
          ref={(el) => {
            if (el) signalMeshesRef.current[idx] = el;
          }}
          position={[0, 0, sig.z]}
        >
          {/* Overhead Gantry Structure */}
          {/* Left Vertical Post */}
          <mesh position={[-ROAD_CONSTANTS.ROAD_WIDTH * 0.5 - 0.4, 3.5, 0]}>
            <boxGeometry args={[0.3, 7.0, 0.3]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Right Vertical Post */}
          <mesh position={[ROAD_CONSTANTS.ROAD_WIDTH * 0.5 + 0.4, 3.5, 0]}>
            <boxGeometry args={[0.3, 7.0, 0.3]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Horizontal Overhead Truss Beam */}
          <mesh position={[0, 6.8, 0]}>
            <boxGeometry args={[ROAD_CONSTANTS.ROAD_WIDTH + 1.2, 0.4, 0.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
          </mesh>

          {/* Signal Heads over each of the 3 lanes */}
          {ROAD_CONSTANTS.LANE_POSITIONS.map((laneX, lIdx) => (
            <group key={lIdx} position={[laneX, 5.8, 0]}>
              {/* Signal housing box */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.65, 1.4, 0.35]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>

              {/* Red Light Bulb */}
              <mesh position={[0, 0.42, 0.18]}>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial
                  color={sig.color === 'red' ? '#ef4444' : '#3f1111'}
                  emissive={sig.color === 'red' ? '#ef4444' : '#000000'}
                  emissiveIntensity={sig.color === 'red' ? 3.5 : 0}
                />
              </mesh>

              {/* Yellow Light Bulb */}
              <mesh position={[0, 0, 0.18]}>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial
                  color={sig.color === 'yellow' ? '#f59e0b' : '#3b2505'}
                  emissive={sig.color === 'yellow' ? '#f59e0b' : '#000000'}
                  emissiveIntensity={sig.color === 'yellow' ? 3.5 : 0}
                />
              </mesh>

              {/* Green Light Bulb */}
              <mesh position={[0, -0.42, 0.18]}>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial
                  color={sig.color === 'green' ? '#10b981' : '#062d1f'}
                  emissive={sig.color === 'green' ? '#10b981' : '#000000'}
                  emissiveIntensity={sig.color === 'green' ? 3.5 : 0}
                />
              </mesh>
            </group>
          ))}

          {/* Solid White Stop Line on Road (6m before gantry) */}
          <mesh position={[0, 0.03, -6.0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_CONSTANTS.ROAD_WIDTH, 0.65]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Zebra Crossing Stripes between stop line and gantry */}
          <group position={[0, 0.02, -3.0]}>
            {Array.from({ length: 14 }).map((_, zIdx) => {
              const stripeX = -ROAD_CONSTANTS.ROAD_WIDTH * 0.46 + zIdx * (ROAD_CONSTANTS.ROAD_WIDTH / 14);
              return (
                <mesh key={zIdx} position={[stripeX, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.5, 4.2]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              );
            })}
          </group>
        </group>
      ))}
    </group>
  );
};
