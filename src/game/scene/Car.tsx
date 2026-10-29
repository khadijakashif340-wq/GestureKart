import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mutableGameState } from '../store';
import { lerp } from '@/lib/utils';

export const Car: React.FC = () => {
  const carGroupRef = useRef<THREE.Group>(null);
  const chassisRef = useRef<THREE.Group>(null);
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Mesh>(null);
  const rearRightWheelRef = useRef<THREE.Mesh>(null);

  const brakeLightMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftBlinkerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const rightBlinkerMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Reusable materials
  const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.29, 12);
  rimGeo.rotateZ(Math.PI / 2);

  useFrame((_, delta) => {
    if (!carGroupRef.current) return;

    const state = mutableGameState;
    const speed = state.carSpeed;
    const steer = state.steeringTilt; // -1 to 1

    // Update car root position in world
    carGroupRef.current.position.set(state.carPosition.x, state.carPosition.y, state.carPosition.z);

    // Chassis body roll (lean into turns + slight suspension bounce)
    if (chassisRef.current) {
      const targetRoll = -steer * 0.09;
      chassisRef.current.rotation.z = lerp(chassisRef.current.rotation.z, targetRoll, delta * 12);
      chassisRef.current.rotation.y = lerp(chassisRef.current.rotation.y, steer * 0.05, delta * 12);

      // Suspension bounce decay
      state.suspensionBounce = lerp(state.suspensionBounce, 0, delta * 6);
      const roadVibe = Math.sin(state.carPosition.z * 1.5) * 0.008 * (speed / 50);
      chassisRef.current.position.y = 0.42 + state.suspensionBounce + roadVibe;
    }

    // Wheel spin rotation proportional to speed
    state.wheelRotation += (speed * 0.04) * delta * 20;

    // Front wheels steering angle
    const targetWheelTurn = steer * 0.42;
    if (frontLeftWheelRef.current && frontRightWheelRef.current) {
      frontLeftWheelRef.current.rotation.y = targetWheelTurn;
      frontRightWheelRef.current.rotation.y = targetWheelTurn;
      frontLeftWheelRef.current.children.forEach((c) => (c.rotation.x = state.wheelRotation));
      frontRightWheelRef.current.children.forEach((c) => (c.rotation.x = state.wheelRotation));
    }

    if (rearLeftWheelRef.current && rearRightWheelRef.current) {
      rearLeftWheelRef.current.rotation.x = state.wheelRotation;
      rearRightWheelRef.current.rotation.x = state.wheelRotation;
    }

    // Brake lights glow
    if (brakeLightMatRef.current) {
      const isBraking = state.isBraking;
      brakeLightMatRef.current.emissiveIntensity = isBraking ? 2.8 : 0.6;
    }

    // Indicator blinker blinking (every 350ms)
    const blinkOn = Math.floor(performance.now() / 320) % 2 === 0;
    if (leftBlinkerMatRef.current) {
      leftBlinkerMatRef.current.color.set(
        state.indicatorState === 'left' && blinkOn ? '#f59e0b' : '#334155'
      );
    }
    if (rightBlinkerMatRef.current) {
      rightBlinkerMatRef.current.color.set(
        state.indicatorState === 'right' && blinkOn ? '#f59e0b' : '#334155'
      );
    }
  });

  return (
    <group ref={carGroupRef}>
      {/* Dynamic Chassis */}
      <group ref={chassisRef} position={[0, 0.42, 0]}>
        {/* Main Body Lower */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.76, 0.45, 4.1]} />
          <meshStandardMaterial
            color="#0ea5e9"
            metalness={0.85}
            roughness={0.2}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Cockpit / Roof */}
        <mesh position={[0, 0.42, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.42, 0.44, 2.1]} />
          <meshStandardMaterial
            color="#0a0d14"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Windshield Front */}
        <mesh position={[0, 0.38, 0.95]} rotation={[0.42, 0, 0]}>
          <planeGeometry args={[1.36, 0.52]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.5}
            roughness={0.1}
          />
        </mesh>

        {/* Rear Windshield */}
        <mesh position={[0, 0.38, -1.35]} rotation={[-0.42, Math.PI, 0]}>
          <planeGeometry args={[1.36, 0.52]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.5}
            roughness={0.1}
          />
        </mesh>

        {/* Front Headlights */}
        <mesh position={[-0.65, 0.05, 2.06]}>
          <boxGeometry args={[0.3, 0.14, 0.05]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#e0f2fe"
            emissiveIntensity={2.5}
          />
        </mesh>
        <mesh position={[0.65, 0.05, 2.06]}>
          <boxGeometry args={[0.3, 0.14, 0.05]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#e0f2fe"
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Headlight volumetric light beam cones */}
        <mesh position={[-0.65, 0.05, 5.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 1.4, 6.0, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0.65, 0.05, 5.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 1.4, 6.0, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rear Taillights / Brake Lights */}
        <mesh position={[-0.65, 0.06, -2.06]}>
          <boxGeometry args={[0.34, 0.15, 0.05]} />
          <meshStandardMaterial
            ref={brakeLightMatRef}
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0.65, 0.06, -2.06]}>
          <boxGeometry args={[0.34, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Turn Indicator Blinkers */}
        <mesh position={[-0.89, 0.05, 1.6]}>
          <boxGeometry args={[0.04, 0.08, 0.2]} />
          <meshBasicMaterial ref={leftBlinkerMatRef} color="#334155" />
        </mesh>
        <mesh position={[0.89, 0.05, 1.6]}>
          <boxGeometry args={[0.04, 0.08, 0.2]} />
          <meshBasicMaterial ref={rightBlinkerMatRef} color="#334155" />
        </mesh>

        {/* Rear Spoiler */}
        <mesh position={[0, 0.38, -1.95]}>
          <boxGeometry args={[1.65, 0.06, 0.3]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.6, 0.24, -1.95]}>
          <boxGeometry args={[0.06, 0.24, 0.15]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.6, 0.24, -1.95]}>
          <boxGeometry args={[0.06, 0.24, 0.15]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* 4 Wheels */}
      {/* Front Left Wheel with steering pivot */}
      <group ref={frontLeftWheelRef} position={[-0.92, 0.36, 1.25]}>
        <mesh geometry={tireGeo}>
          <meshStandardMaterial color="#111827" roughness={0.95} />
        </mesh>
        <mesh geometry={rimGeo}>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Front Right Wheel with steering pivot */}
      <group ref={frontRightWheelRef} position={[0.92, 0.36, 1.25]}>
        <mesh geometry={tireGeo}>
          <meshStandardMaterial color="#111827" roughness={0.95} />
        </mesh>
        <mesh geometry={rimGeo}>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear Left Wheel */}
      <mesh ref={rearLeftWheelRef} position={[-0.92, 0.36, -1.35]} geometry={tireGeo}>
        <meshStandardMaterial color="#111827" roughness={0.95} />
      </mesh>

      {/* Rear Right Wheel */}
      <mesh ref={rearRightWheelRef} position={[0.92, 0.36, -1.35]} geometry={tireGeo}>
        <meshStandardMaterial color="#111827" roughness={0.95} />
      </mesh>
    </group>
  );
};
