import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_CONSTANTS, VEHICLE_PRESETS } from '@/lib/constants';
import { mutableGameState } from '../store';
import { CollisionBox } from '../systems/collision';

interface TrafficEntity {
  id: string;
  type: string;
  x: number;
  z: number;
  lane: number;
  speed: number;
  color: string;
  length: number;
  width: number;
  height: number;
}

const POOL_SIZE = 12;

export const Traffic: React.FC<{ onUpdateBoxes?: (boxes: CollisionBox[]) => void }> = ({
  onUpdateBoxes,
}) => {
  const trafficGroupRef = useRef<THREE.Group>(null);

  // Initialize pool of diverse Lahore vehicles
  const vehicles = useMemo<TrafficEntity[]>(() => {
    const list: TrafficEntity[] = [];
    const lanes = ROAD_CONSTANTS.LANE_POSITIONS;

    for (let i = 0; i < POOL_SIZE; i++) {
      const preset = VEHICLE_PRESETS[i % VEHICLE_PRESETS.length];
      const laneIdx = i % lanes.length;
      list.push({
        id: `traffic-${i}`,
        type: preset.type,
        x: lanes[laneIdx],
        z: 40 + i * 32,
        lane: laneIdx,
        speed: preset.speed * (0.85 + Math.random() * 0.3),
        color: preset.color,
        length: preset.length,
        width: preset.width,
        height: preset.height,
      });
    }
    return list;
  }, []);

  const collisionBoxes = useRef<CollisionBox[]>([]);

  useFrame((_, delta) => {
    const carZ = mutableGameState.carPosition.z;
    const lanes = ROAD_CONSTANTS.LANE_POSITIONS;

    const boxes: CollisionBox[] = [];

    vehicles.forEach((v, idx) => {
      // Traffic cars move forward along Z
      v.z += (v.speed / 3.6) * delta;

      // Recycle if too far behind car or too far ahead
      if (v.z < carZ - 25) {
        v.z = carZ + 180 + Math.random() * 60;
        v.lane = (idx + Math.floor(Math.random() * 3)) % lanes.length;
        v.x = lanes[v.lane];
      }

      boxes.push({
        id: v.id,
        type: 'traffic',
        x: v.x,
        z: v.z,
        width: v.width,
        length: v.length,
        speed: v.speed,
      });

      // Update 3D mesh position
      if (trafficGroupRef.current && trafficGroupRef.current.children[idx]) {
        const meshGroup = trafficGroupRef.current.children[idx] as THREE.Group;
        meshGroup.position.set(v.x, v.height * 0.5, v.z);
      }
    });

    collisionBoxes.current = boxes;
    onUpdateBoxes?.(boxes);
  });

  return (
    <group ref={trafficGroupRef}>
      {vehicles.map((v) => (
        <group key={v.id} position={[v.x, v.height * 0.5, v.z]}>
          {/* Rickshaw Special Geometry */}
          {v.type === 'rickshaw' ? (
            <group>
              {/* Green lower body */}
              <mesh position={[0, -0.2, 0]} castShadow>
                <boxGeometry args={[1.3, 0.6, 2.2]} />
                <meshStandardMaterial color="#16a34a" />
              </mesh>
              {/* Yellow canvas canopy */}
              <mesh position={[0, 0.4, -0.2]} castShadow>
                <boxGeometry args={[1.34, 0.65, 1.8]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
              {/* Front headlight */}
              <mesh position={[0, -0.1, 1.15]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
              {/* Rickshaw Taillights */}
              <mesh position={[-0.45, -0.15, -1.12]}>
                <boxGeometry args={[0.15, 0.1, 0.05]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
              <mesh position={[0.45, -0.15, -1.12]}>
                <boxGeometry args={[0.15, 0.1, 0.05]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          ) : v.type === 'van' ? (
            /* Suzuki Bolan / Carry "Dabba" */
            <group>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[1.45, 1.65, 3.3]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
              </mesh>
              {/* Black window band */}
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[1.47, 0.45, 2.8]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Headlights */}
              <mesh position={[-0.5, -0.1, 1.66]}>
                <boxGeometry args={[0.22, 0.15, 0.05]} />
                <meshBasicMaterial color="#fef9c3" />
              </mesh>
              <mesh position={[0.5, -0.1, 1.66]}>
                <boxGeometry args={[0.22, 0.15, 0.05]} />
                <meshBasicMaterial color="#fef9c3" />
              </mesh>
              {/* Taillights */}
              <mesh position={[-0.5, -0.1, -1.66]}>
                <boxGeometry args={[0.22, 0.15, 0.05]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
              <mesh position={[0.5, -0.1, -1.66]}>
                <boxGeometry args={[0.22, 0.15, 0.05]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          ) : v.type === 'bus' ? (
            /* Lahore Metro City Bus */
            <group>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[2.4, 2.5, 8.2]} />
                <meshStandardMaterial color="#ea580c" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2.42, 0.75, 7.8]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              {/* Front windscreen */}
              <mesh position={[0, 0.4, 4.12]}>
                <boxGeometry args={[2.2, 1.2, 0.05]} />
                <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} />
              </mesh>
            </group>
          ) : (
            /* Standard Sedan / Bike */
            <group>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[v.width, v.height * 0.7, v.length]} />
                <meshStandardMaterial color={v.color} roughness={0.3} metalness={0.5} />
              </mesh>
              <mesh position={[0, v.height * 0.3, -0.2]} castShadow>
                <boxGeometry args={[v.width * 0.85, v.height * 0.5, v.length * 0.5]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Headlights */}
              <mesh position={[-v.width * 0.35, 0, v.length * 0.51]}>
                <boxGeometry args={[0.25, 0.15, 0.05]} />
                <meshBasicMaterial color="#fef9c3" />
              </mesh>
              <mesh position={[v.width * 0.35, 0, v.length * 0.51]}>
                <boxGeometry args={[0.25, 0.15, 0.05]} />
                <meshBasicMaterial color="#fef9c3" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};
