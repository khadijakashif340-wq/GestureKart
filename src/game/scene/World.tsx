import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Road } from './Road';
import { Canal } from './Canal';
import { Environment } from './Environment';
import { Car } from './Car';
import { Traffic } from './Traffic';
import { Pedestrians } from './Pedestrians';
import { Signals } from './Signals';
import { Effects } from './Effects';
import { mutableGameState, useGameStore } from '../store';
import { checkCollisions, CollisionBox } from '../systems/collision';
import { evaluateRules } from '../systems/rules';
import { audioEngine } from '@/audio/audioEngine';
import { clamp, lerp } from '@/lib/utils';
import { ROAD_CONSTANTS, SCORING_RULES, LEVELS } from '@/lib/constants';

const CameraController: React.FC<{ isIntro?: boolean }> = ({ isIntro }) => {
  const { camera } = useThree();
  const currentFov = useRef(55);
  const lookTarget = useRef(new THREE.Vector3(0, 0.8, 12));

  useFrame((_, delta) => {
    const state = mutableGameState;
    const carX = state.carPosition.x;
    const carZ = state.carPosition.z;
    const speed = state.carSpeed;

    if (isIntro) {
      // Cinematic slow drift during landing screen
      const time = performance.now() * 0.0004;
      camera.position.set(Math.sin(time) * 4, 3.2, carZ - 9);
      lookTarget.current.set(0, 0.9, carZ + 15);
      camera.lookAt(lookTarget.current);
      return;
    }

    // Dynamic FOV widening with speed
    const targetFov = 55 + (speed / 95) * 16;
    currentFov.current = lerp(currentFov.current, targetFov, delta * 4);
    if ('fov' in camera) {
      (camera as THREE.PerspectiveCamera).fov = currentFov.current;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    // Spring chase camera
    const targetCamX = carX * 0.65;
    const targetCamY = 2.4 + (speed / 100) * 0.4;
    const targetCamZ = carZ - 6.4;

    camera.position.x = lerp(camera.position.x, targetCamX, delta * 9);
    camera.position.y = lerp(camera.position.y, targetCamY, delta * 7);
    camera.position.z = lerp(camera.position.z, targetCamZ, delta * 12);

    // Look ahead point
    lookTarget.current.x = lerp(lookTarget.current.x, carX * 0.35, delta * 9);
    lookTarget.current.y = 0.9;
    lookTarget.current.z = lerp(lookTarget.current.z, carZ + 14.0, delta * 12);

    camera.lookAt(lookTarget.current);
  });

  return null;
};

const SimulationLoop: React.FC = () => {
  const trafficBoxesRef = useRef<CollisionBox[]>([]);
  const pedestrianBoxesRef = useRef<CollisionBox[]>([]);
  const lateralVelocityRef = useRef(0);
  const lastScoreSync = useRef(0);
  const store = useGameStore();

  useFrame((state, delta) => {
    const isPlaying = store.screen === 'playing';
    const mState = mutableGameState;

    if (isPlaying) {
      // Emergency Brake Deceleration & Speed Dynamics
      if (mState.isBraking) {
        if (mState.carSpeed > 0) {
          mState.carSpeed = Math.max(0, mState.carSpeed - delta * 58);
        } else if (mState.carSpeed < 0) {
          mState.carSpeed = Math.min(0, mState.carSpeed + delta * 58);
        }
      } else {
        const targetSpeed = mState.recentTelemetry[0]?.speedTarget ?? 50;
        // Fast responsive acceleration after stopping or reversing
        const accelRate = Math.abs(mState.carSpeed) < 25 ? 48 : 30;
        mState.carSpeed = lerp(mState.carSpeed, targetSpeed, delta * (accelRate / 10));
      }

      // Lateral Steering with smooth automotive inertia and controlled speed
      const steer = mState.recentTelemetry[0]?.steer ?? 0;
      mState.steeringTilt = steer;

      // Silky smooth lateral rate: ~3.3 m/s (takes ~1.1-1.4s to smoothly glide across a 3.6m lane)
      const speedFactor = Math.max(0.65, Math.min(1.0, Math.abs(mState.carSpeed) / 20));
      const targetLateralVelocity = steer * 3.3 * speedFactor;

      // Smoothly accelerate and decelerate lateral motion with gentle automotive damping
      lateralVelocityRef.current = lerp(lateralVelocityRef.current, targetLateralVelocity, delta * 4.6);

      const lateralMove = lateralVelocityRef.current * delta;
      mState.carPosition.x = clamp(
        mState.carPosition.x + lateralMove,
        -ROAD_CONSTANTS.ROAD_WIDTH * 0.46,
        ROAD_CONSTANTS.ROAD_WIDTH * 0.46
      );

      // Forward / Reverse Longitudinal Movement
      const forwardMove = (mState.carSpeed / 3.6) * delta;
      mState.carPosition.z += forwardMove;
      if (forwardMove > 0) {
        mState.distanceTraveled += forwardMove;
      }

      // Invulnerability timer decay
      if (mState.invulnerabilityTimer > 0) {
        mState.invulnerabilityTimer = Math.max(0, mState.invulnerabilityTimer - delta);
      }

      // Check collisions with vehicles and pedestrians
      const collisionResult = checkCollisions(
        trafficBoxesRef.current,
        pedestrianBoxesRef.current,
        state.clock.elapsedTime
      );

      if (collisionResult.hasCollision) {
        const penalty =
          collisionResult.type === 'pedestrian'
            ? SCORING_RULES.PEDESTRIAN_HIT_PENALTY
            : SCORING_RULES.COLLISION_PENALTY;

        store.addViolation({
          id: `col-${Date.now()}`,
          type: 'collision',
          title: collisionResult.type === 'pedestrian' ? 'Pedestrian Collision' : 'Vehicle Collision',
          description:
            collisionResult.type === 'pedestrian'
              ? 'Failed to yield to pedestrian on crossing (-200)'
              : 'Failed to maintain safe vehicle spacing (-75)',
          penalty,
          timestamp: Math.round(state.clock.elapsedTime),
          distance: Math.round(mState.distanceTraveled),
          speedAtEvent: Math.round(mState.carSpeed),
          ruleReference: 'Traffic Collision: Hazardous Driving Infraction',
        });

        store.setActiveToast({
          id: `toast-${Date.now()}`,
          type: 'violation',
          title: collisionResult.type === 'pedestrian' ? 'PEDESTRIAN COLLISION' : 'COLLISION IMPACT',
          text: `Severe impact penalty (-${penalty})`,
          value: -penalty,
        });
      }

      // Evaluate Traffic Rules (Signals, Speeding, Lane Straddling)
      evaluateRules(delta, state.clock.elapsedTime, mState.activeSignals);

      // Clean drive combo increment every 200m
      const targetCombo = Math.min(
        SCORING_RULES.MAX_COMBO,
        1.0 + Math.floor(mState.distanceTraveled / SCORING_RULES.COMBO_DISTANCE_INTERVAL) * 0.5
      );
      if (store.combo !== targetCombo) {
        store.setCombo(targetCombo);
      }

      // Synchronize distance to React state periodically (every 250ms, NOT every frame)
      if (state.clock.elapsedTime - lastScoreSync.current > 0.25) {
        lastScoreSync.current = state.clock.elapsedTime;
        store.setDistance(Math.round(mState.distanceTraveled));

        // Check level completion or point depletion
        const targetDist = LEVELS[store.currentLevelIndex]?.targetDistance ?? 1200;
        if (store.score <= 0 || mState.distanceTraveled >= targetDist) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gesturekart:end-run'));
          }
        }
      }

      // Audio engine pitch
      audioEngine.updateEnginePitch(mState.carSpeed, mState.isBraking);
    } else {
      lateralVelocityRef.current = 0;
      // Idle engine during landing / pause
      audioEngine.updateEnginePitch(0, false);
    }
  });

  return (
    <>
      <Traffic onUpdateBoxes={(b) => (trafficBoxesRef.current = b)} />
      <Pedestrians onUpdateBoxes={(p) => (pedestrianBoxesRef.current = p)} />
    </>
  );
};

export const World: React.FC = () => {
  const screen = useGameStore((s) => s.screen);
  const quality = useGameStore((s) => s.settings.graphicsQuality);
  const isIntro = screen === 'landing' || screen === 'how-it-works';

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows={quality !== 'low'}
        dpr={quality === 'high' ? [1, 1.75] : quality === 'medium' ? [1, 1.4] : 1}
        camera={{ position: [0, 2.8, -7], fov: 55, near: 0.1, far: 250 }}
        gl={{
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
        }}
      >
        <CameraController isIntro={isIntro} />
        <Environment />
        <Road />
        <Canal />
        <Signals />
        <Car />
        <Effects />
        <SimulationLoop />

        {/* Postprocessing effects (Bloom & Vignette) */}
        {quality !== 'low' && (
          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={0.82}
              luminanceSmoothing={0.3}
              intensity={0.65}
            />
            <Vignette eskil={false} offset={0.15} darkness={0.6} />
            <ChromaticAberration
              offset={new THREE.Vector2(0.0006, 0.0006)}
              radialModulation={false}
              modulationOffset={0}
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};
