import { mutableGameState } from '../store';
import { audioEngine } from '@/audio/audioEngine';
import { voiceCoach } from '@/audio/voiceCoach';
import { ROAD_CONSTANTS } from '@/lib/constants';

export interface CollisionBox {
  id: string;
  type: 'traffic' | 'pedestrian' | 'obstacle';
  x: number;
  z: number;
  width: number;
  length: number;
  speed: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  type?: 'traffic' | 'pedestrian' | 'obstacle';
  targetId?: string;
}

export function checkCollisions(
  trafficBoxes: CollisionBox[],
  pedestrianBoxes: CollisionBox[],
  now: number
): CollisionResult {
  const carX = mutableGameState.carPosition.x;
  const carZ = mutableGameState.carPosition.z;
  const carWidth = 1.8;
  const carLength = 4.2;

  // Invulnerability window check
  if (mutableGameState.invulnerabilityTimer > 0) {
    return { hasCollision: false };
  }

  // 1. Check Pedestrians
  for (const ped of pedestrianBoxes) {
    const dx = Math.abs(carX - ped.x);
    const dz = Math.abs(carZ - ped.z);

    if (dx < (carWidth + ped.width) * 0.5 && dz < (carLength + ped.length) * 0.5) {
      triggerCollisionResponse('pedestrian', now);
      return { hasCollision: true, type: 'pedestrian', targetId: ped.id };
    }
  }

  // 2. Check Traffic Vehicles
  for (const vehicle of trafficBoxes) {
    const dx = Math.abs(carX - vehicle.x);
    const dz = Math.abs(carZ - vehicle.z);

    if (dx < (carWidth + vehicle.width) * 0.48 && dz < (carLength + vehicle.length) * 0.48) {
      triggerCollisionResponse('traffic', now);
      return { hasCollision: true, type: 'traffic', targetId: vehicle.id };
    }
  }

  // 3. Check Canal boundary
  if (carX < ROAD_CONSTANTS.CANAL_X + 2.0) {
    triggerCollisionResponse('obstacle', now);
    mutableGameState.carPosition.x = ROAD_CONSTANTS.CANAL_X + 2.2;
    return { hasCollision: true, type: 'obstacle', targetId: 'canal-verge' };
  }

  return { hasCollision: false };
}

function triggerCollisionResponse(type: 'traffic' | 'pedestrian' | 'obstacle', _now: number): void {
  // Sound
  audioEngine.playCrash();

  // Speed loss
  mutableGameState.carSpeed = Math.max(10, mutableGameState.carSpeed * 0.4);

  // Suspension shake
  mutableGameState.suspensionBounce = 0.45;

  // Invulnerability window for 1.8 seconds
  mutableGameState.invulnerabilityTimer = 1.8;

  if (type === 'pedestrian') {
    voiceCoach.speak('Caution! Pedestrian collision. Yield at all pedestrian crossings!', true);
  } else {
    voiceCoach.speak('Collision impact! Maintain safe following distance.', true);
  }
}
