import { mutableGameState, useGameStore } from '../store';
import { SCORING_RULES, ROAD_CONSTANTS } from '@/lib/constants';
import { ViolationRecord, PositiveEventRecord, SignalState } from '@/types';
import { audioEngine } from '@/audio/audioEngine';
import { voiceCoach } from '@/audio/voiceCoach';

let speedingDuration = 0;
let straddleDuration = 0;
let previousLane = 0;

export function evaluateRules(
  delta: number,
  nowSec: number,
  activeSignals: SignalState[]
): void {
  const store = useGameStore.getState();
  const carX = mutableGameState.carPosition.x;
  const carZ = mutableGameState.carPosition.z;
  const speed = mutableGameState.carSpeed;
  const speedLimit = mutableGameState.currentSpeedLimit;
  const isBraking = mutableGameState.isBraking;

  // 1. SIGNAL & RED-LIGHT CHECKS
  for (const sig of activeSignals) {
    const distToLine = sig.stopLineZ - carZ;

    // Approaching red signal voice cue
    if (sig.color === 'red' && distToLine > 15 && distToLine < 45 && !sig.passed) {
      voiceCoach.speak('Red signal approaching. Raise your right hand to stop at the line.');
    }

    // Check for PERFECT STOP:
    // Car stopped (speed < 4 km/h) before stop line (within 12m) while signal is red
    if (
      sig.color === 'red' &&
      !sig.passed &&
      !sig.perfectStopAwarded &&
      distToLine > 0 &&
      distToLine < 10 &&
      speed < 4 &&
      isBraking
    ) {
      sig.perfectStopAwarded = true;
      audioEngine.playSuccess();
      const reactionTime = Math.round(180 + Math.random() * 120);

      const event: PositiveEventRecord = {
        id: `stop-${Date.now()}`,
        title: 'Perfect Stop on Red',
        bonus: SCORING_RULES.PERFECT_STOP_BONUS,
        timestamp: nowSec,
        distance: Math.round(mutableGameState.distanceTraveled),
        reactionTimeMs: reactionTime,
        scoreOutOf100: 98,
      };

      store.addPositiveEvent(event);
      store.setActiveToast({
        id: event.id,
        type: 'bonus',
        title: 'PERFECT STOP! +50',
        text: `Stopped smoothly at line • Reaction ${reactionTime}ms`,
        value: 50,
      });

      voiceCoach.speak('Perfect stop! Excellent signal discipline.', true);
    }

    // Check for RED-LIGHT VIOLATION:
    // Car crossed the stop line while signal is red
    if (sig.color === 'red' && !sig.passed && !sig.violated && distToLine < -1.5 && distToLine > -18) {
      sig.violated = true;
      sig.passed = true;
      audioEngine.playPenalty();

      const violation: ViolationRecord = {
        id: `red-${Date.now()}`,
        type: 'red-light',
        title: 'Red-Light Violation',
        description: 'Failed to halt behind stop line at red traffic signal',
        penalty: SCORING_RULES.RED_LIGHT_PENALTY,
        timestamp: nowSec,
        distance: Math.round(mutableGameState.distanceTraveled),
        speedAtEvent: Math.round(speed),
        ruleReference: 'Motor Vehicle Safety: Halting at Red Signals is Mandatory',
      };

      store.addViolation(violation);
      store.setActiveToast({
        id: violation.id,
        type: 'violation',
        title: 'RED LIGHT VIOLATION',
        text: 'Crossing on red carries severe penalties (-150)',
        value: -SCORING_RULES.RED_LIGHT_PENALTY,
      });

      voiceCoach.speak('Red light violation! Crossing on red causes severe accidents.', true);
    }

    if (distToLine < -20) {
      sig.passed = true;
    }
  }

  // 2. SPEEDING CHECK
  if (speed > speedLimit + 5) {
    speedingDuration += delta;
    if (speedingDuration > 1.2) {
      speedingDuration = 0;
      audioEngine.playPenalty();

      const violation: ViolationRecord = {
        id: `spd-${Date.now()}`,
        type: 'speeding',
        title: 'Speed Limit Exceeded',
        description: `Traveling at ${Math.round(speed)} km/h in a ${speedLimit} km/h zone`,
        penalty: SCORING_RULES.SPEEDING_PENALTY_PER_SEC,
        timestamp: nowSec,
        distance: Math.round(mutableGameState.distanceTraveled),
        speedAtEvent: Math.round(speed),
        ruleReference: 'Speed Regulation: Canal Road Speed Restrictions Apply',
      };

      store.addViolation(violation);
      store.setActiveToast({
        id: violation.id,
        type: 'violation',
        title: 'SPEED LIMIT EXCEEDED',
        text: `${Math.round(speed)} km/h in ${speedLimit} km/h zone (-5)`,
        value: -5,
      });

      voiceCoach.speak('Speed limit exceeded. Bring your hands closer to slow down.');
    }
  } else {
    speedingDuration = Math.max(0, speedingDuration - delta);
  }

  // 3. LANE DISCIPLINE & STRADDLING CHECK
  // Road lanes: Left (-3.6), Center (0), Right (+3.6)
  // Half lane width = 1.8. Distance to closest lane center:
  const lanePositions = ROAD_CONSTANTS.LANE_POSITIONS;
  let minLaneDist = 999;
  let closestLaneIdx = 1;

  for (let i = 0; i < lanePositions.length; i++) {
    const d = Math.abs(carX - lanePositions[i]);
    if (d < minLaneDist) {
      minLaneDist = d;
      closestLaneIdx = i - 1; // -1, 0, 1
    }
  }

  // If car is straddling near the lane dashed line (> 0.9m from lane center)
  if (minLaneDist > 0.95 && speed > 20) {
    straddleDuration += delta;
    if (straddleDuration > 2.0) {
      straddleDuration = 0;
      audioEngine.playPenalty();

      const violation: ViolationRecord = {
        id: `straddle-${Date.now()}`,
        type: 'lane-straddle',
        title: 'Lane Straddling',
        description: 'Driving between marked lanes without deliberate lane transition',
        penalty: SCORING_RULES.LANE_STRADDLE_PENALTY_PER_SEC,
        timestamp: nowSec,
        distance: Math.round(mutableGameState.distanceTraveled),
        speedAtEvent: Math.round(speed),
        ruleReference: 'Lane Discipline: Maintain Central Lane Alignment',
      };

      store.addViolation(violation);
      store.setActiveToast({
        id: violation.id,
        type: 'violation',
        title: 'LANE STRADDLING',
        text: 'Driving between lanes disrupts traffic flow (-10)',
        value: -10,
      });

      voiceCoach.speak('Keep your car centered inside the lane.');
    }
  } else {
    straddleDuration = Math.max(0, straddleDuration - delta);
  }

  // 4. CLEAN LANE CHANGE BONUS
  if (closestLaneIdx !== previousLane) {
    const laneDiff = closestLaneIdx - previousLane;
    const requiredIndicator = laneDiff > 0 ? 'right' : 'left';

    // If indicator was matching or player cleanly shifted
    if (mutableGameState.indicatorState === requiredIndicator || Math.abs(laneDiff) === 1) {
      audioEngine.playSuccess();

      const event: PositiveEventRecord = {
        id: `lane-${Date.now()}`,
        title: 'Clean Lane Change',
        bonus: SCORING_RULES.CLEAN_LANE_CHANGE_BONUS,
        timestamp: nowSec,
        distance: Math.round(mutableGameState.distanceTraveled),
        scoreOutOf100: 95,
      };

      store.addPositiveEvent(event);
      store.setActiveToast({
        id: event.id,
        type: 'bonus',
        title: 'LANE DISCIPLINE +25',
        text: 'Clean deliberate lane transition',
        value: 25,
      });
    }

    previousLane = closestLaneIdx;
    mutableGameState.currentLane = closestLaneIdx;
  }
}
