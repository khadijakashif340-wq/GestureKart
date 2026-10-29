import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_CONSTANTS } from '@/lib/constants';
import { mutableGameState } from '../store';
import { CollisionBox } from '../systems/collision';

interface PedestrianData {
  id: string;
  signalId: string;
  x: number;
  z: number;
  direction: 1 | -1; // 1 = walking right, -1 = walking left
  speed: number;
  active: boolean;
}

export const Pedestrians: React.FC<{
  onUpdateBoxes?: (boxes: CollisionBox[]) => void;
}> = ({ onUpdateBoxes }) => {
  const pedGroupRef = useRef<THREE.Group>(null);

  // One or two pedestrians per active signal intersection
  const pedestrians = useMemo<PedestrianData[]>(() => {
    return [
      { id: 'ped-0', signalId: 'signal-0', x: -ROAD_CONSTANTS.ROAD_WIDTH * 0.45, z: 137, direction: 1, speed: 1.6, active: false },
      { id: 'ped-1', signalId: 'signal-1', x: ROAD_CONSTANTS.ROAD_WIDTH * 0.45, z: 417, direction: -1, speed: 1.4, active: false },
      { id: 'ped-2', signalId: 'signal-2', x: -ROAD_CONSTANTS.ROAD_WIDTH * 0.4, z: 697, direction: 1, speed: 1.5, active: false },
      { id: 'ped-3', signalId: 'signal-3', x: ROAD_CONSTANTS.ROAD_WIDTH * 0.4, z: 977, direction: -1, speed: 1.7, active: false },
    ];
  }, []);

  useFrame((state, delta) => {
    const boxes: CollisionBox[] = [];
    const signals = mutableGameState.activeSignals;

    pedestrians.forEach((ped, idx) => {
      // Find corresponding signal
      const matchingSignal = signals.find((s) => s.id === ped.signalId);
      if (matchingSignal) {
        ped.z = matchingSignal.z - 3.0; // At zebra crossing
        ped.active = matchingSignal.color === 'red';
      }

      if (ped.active) {
        // Walk across road
        ped.x += ped.direction * ped.speed * delta;
        const roadLimit = ROAD_CONSTANTS.ROAD_WIDTH * 0.48;

        if (ped.x > roadLimit) {
          ped.x = roadLimit;
          ped.direction = -1;
        } else if (ped.x < -roadLimit) {
          ped.x = -roadLimit;
          ped.direction = 1;
        }

        boxes.push({
          id: ped.id,
          type: 'pedestrian',
          x: ped.x,
          z: ped.z,
          width: 0.8,
          length: 0.8,
          speed: ped.speed,
        });

        // 3D mesh walk cycle animation
        if (pedGroupRef.current && pedGroupRef.current.children[idx]) {
          const mesh = pedGroupRef.current.children[idx] as THREE.Group;
          mesh.visible = true;
          mesh.position.set(ped.x, 0.75, ped.z);

          // Subtle walk bob
          mesh.position.y = 0.75 + Math.abs(Math.sin(state.clock.elapsedTime * 6.0)) * 0.08;
          mesh.rotation.y = ped.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      } else {
        if (pedGroupRef.current && pedGroupRef.current.children[idx]) {
          pedGroupRef.current.children[idx].visible = false;
        }
      }
    });

    onUpdateBoxes?.(boxes);
  });

  return (
    <group ref={pedGroupRef}>
      {pedestrians.map((ped) => (
        <group key={ped.id} visible={false}>
          {/* Head with traditional Peshawari / Lahori cap */}
          <mesh position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.1, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Torso / Shalwar Kameez */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.38, 0.55, 0.24]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.7} />
          </mesh>

          {/* Legs */}
          <mesh position={[-0.1, -0.32, 0]}>
            <boxGeometry args={[0.14, 0.48, 0.16]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0.1, -0.32, 0]}>
            <boxGeometry args={[0.14, 0.48, 0.16]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
