import { z } from 'zod';

export const InsightsRequestSchema = z.object({
  playerName: z.string().max(50).default('Lahore Commuter'),
  score: z.number(),
  distanceDriven: z.number(),
  timeElapsed: z.number(),
  levelReached: z.number(),
  violations: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      penalty: z.number(),
      timestamp: z.number(),
      distance: z.number(),
    })
  ),
  breakdown: z.object({
    signalObedience: z.number(),
    laneDiscipline: z.number(),
    pedestrianSafety: z.number(),
    speedControl: z.number(),
  }),
});

export const InsightsResponseSchema = z.object({
  headline: z.string(),
  driverPersonality: z.string(),
  tips: z.tuple([z.string(), z.string(), z.string()]),
  closingLine: z.string(),
});

export type InsightsRequest = z.infer<typeof InsightsRequestSchema>;
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;
