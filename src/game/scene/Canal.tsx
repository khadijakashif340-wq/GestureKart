import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_CONSTANTS } from '@/lib/constants';
import { mutableGameState } from '../store';

const CANAL_LEN = ROAD_CONSTANTS.CHUNK_LENGTH * 3;

export const Canal: React.FC = () => {
  const waterMeshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Custom procedural animated canal water shader
  const waterShader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color('#0c2f24') }, // Deep emerald canal water
        uSurfaceColor: { value: new THREE.Color('#14b8a6') }, // Teal highlights
        uOpacity: { value: 0.92 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Layered sine wave displacement
          float wave1 = sin(pos.y * 0.15 + uTime * 2.2) * 0.08;
          float wave2 = cos(pos.x * 0.4 + uTime * 1.5) * 0.05;
          float wave3 = sin((pos.x + pos.y) * 0.2 + uTime * 3.0) * 0.04;

          pos.z += wave1 + wave2 + wave3;
          vElevation = pos.z;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeepColor;
        uniform vec3 uSurfaceColor;
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          // Color mixing based on wave height
          float mixStrength = (vElevation + 0.15) * 3.0;
          vec3 color = mix(uDeepColor, uSurfaceColor, clamp(mixStrength, 0.0, 1.0));

          // Subtle sun sparkle
          float sparkle = pow(clamp(sin(vUv.y * 80.0 + vElevation * 20.0), 0.0, 1.0), 8.0) * 0.25;
          color += vec3(sparkle);

          gl_FragColor = vec4(color, uOpacity);
        }
      `,
    };
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }

    // Keep canal centered around car's Z coordinate
    if (waterMeshRef.current) {
      const carZ = mutableGameState.carPosition.z;
      const step = 60;
      waterMeshRef.current.position.z = Math.floor(carZ / step) * step;
    }
  });

  return (
    <group position={[ROAD_CONSTANTS.CANAL_X, ROAD_CONSTANTS.CANAL_WATER_Y, 0]}>
      {/* Animated Canal Water Surface */}
      <mesh
        ref={waterMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROAD_CONSTANTS.CANAL_WIDTH, CANAL_LEN, 32, 64]} />
        <shaderMaterial
          ref={materialRef}
          args={[waterShader]}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Canal Stone Embankment Walls */}
      {/* Outer bank */}
      <mesh position={[-ROAD_CONSTANTS.CANAL_WIDTH * 0.5 - 0.4, 0.8, 0]}>
        <boxGeometry args={[0.8, 2.2, CANAL_LEN]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* Inner bank (road side) */}
      <mesh position={[ROAD_CONSTANTS.CANAL_WIDTH * 0.5 + 0.4, 0.8, 0]}>
        <boxGeometry args={[0.8, 2.2, CANAL_LEN]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Canal Bed Floor */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_CONSTANTS.CANAL_WIDTH, CANAL_LEN]} />
        <meshStandardMaterial color="#0f172a" roughness={1.0} />
      </mesh>
    </group>
  );
};
