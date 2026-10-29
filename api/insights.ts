import type { VercelRequest, VercelResponse } from './_lib/types';
import { InsightsRequestSchema, InsightsResponseSchema } from './_lib/schema';
import { callOpenRouter, cleanJsonFence } from './_lib/openrouter';
import { generateRuleBasedFallback } from './_lib/fallback';
import { checkRateLimit } from './_lib/rateLimit';
import { getSystemPrompt, getUserPrompt } from './_lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const parseResult = InsightsRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input schema', details: parseResult.error.format() });
  }

  const requestData = parseResult.data;

  // If OPENROUTER_API_KEY is not configured, immediately return high-quality rule-based fallback
  const rawKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!rawKey) {
    const fallback = generateRuleBasedFallback(requestData);
    return res.status(200).json({ ...fallback, isFallback: true });
  }

  try {
    const systemPrompt = getSystemPrompt();
    const userPrompt = getUserPrompt(requestData);

    const rawResponse = await callOpenRouter(userPrompt, systemPrompt);
    const cleaned = cleanJsonFence(rawResponse);
    const parsedJson = JSON.parse(cleaned);

    const validatedResponse = InsightsResponseSchema.safeParse(parsedJson);
    if (!validatedResponse.success) {
      console.warn('Schema mismatch in OpenRouter output, falling back to rule-based engine');
      const fallback = generateRuleBasedFallback(requestData);
      return res.status(200).json({ ...fallback, isFallback: true });
    }

    return res.status(200).json({ ...validatedResponse.data, isFallback: false });
  } catch (error) {
    console.error('Error invoking OpenRouter in /api/insights:', error);
    // Graceful degradation: never fail the user experience!
    const fallback = generateRuleBasedFallback(requestData);
    return res.status(200).json({ ...fallback, isFallback: true });
  }
}
