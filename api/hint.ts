import type { VercelRequest, VercelResponse } from './_lib/types';
import { callOpenRouter, cleanJsonFence } from './_lib/openrouter';
import { checkRateLimit } from './_lib/rateLimit';
import { getHintPrompt, getHintSystemPrompt } from './_lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 30, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { recentInfraction, speed, lane } = req.body || {};

  const rawKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!rawKey) {
    // Immediate fallback hints
    let fallbackHint = 'Maintain centered lane discipline along the canal.';
    if (recentInfraction === 'red-light') fallbackHint = 'Raise your right hand to halt before red signals.';
    else if (recentInfraction === 'speeding') fallbackHint = 'Bring your hands closer to decelerate smoothly.';
    else if (recentInfraction === 'collision') fallbackHint = 'Leave 3 seconds spacing behind leading traffic.';

    return res.status(200).json({ hint: fallbackHint, isFallback: true });
  }

  try {
    const prompt = getHintPrompt(recentInfraction, speed, lane);
    const systemPrompt = getHintSystemPrompt();

    const raw = await callOpenRouter(prompt, systemPrompt);
    const cleaned = cleanJsonFence(raw);
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({ hint: parsed.hint || 'Stay centered in your lane.', isFallback: false });
  } catch (error) {
    return res.status(200).json({ hint: 'Keep a safe following distance on Canal Road.', isFallback: true });
  }
}
