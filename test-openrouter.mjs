/**
 * Safe OpenRouter API Verification Test for GestureKart
 * Tests connectivity to OpenRouter using .env.local without exposing your secret key.
 *
 * Usage:
 *   npm run test:ai
 *   or
 *   node test-openrouter.mjs
 */

import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('\x1b[31m[ERROR]\x1b[0m .env.local file not found in project root.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse environment variables
const keyMatch = envContent.match(/^OPENROUTER_API_KEY=(.*)$/m);
const modelMatch = envContent.match(/^OPENROUTER_MODEL=(.*)$/m);
const siteUrlMatch = envContent.match(/^SITE_URL=(.*)$/m);

const apiKey = keyMatch ? keyMatch[1].trim() : '';
const model = (modelMatch && modelMatch[1].trim()) ? modelMatch[1].trim() : 'openrouter/free';
const siteUrl = siteUrlMatch ? siteUrlMatch[1].trim() : 'http://localhost:5173';

console.log('\n======================================================');
console.log('       🚗 GESTUREKART OPENROUTER VERIFICATION         ');
console.log('======================================================');
console.log(`Configured Model: \x1b[36m${model}\x1b[0m`);
console.log(`Site Referer:     \x1b[36m${siteUrl}\x1b[0m`);

if (!apiKey) {
  console.log('Key Status:       \x1b[33m[EMPTY ON DISK]\x1b[0m');
  console.log('\n\x1b[33m[NOTICE]\x1b[0m OPENROUTER_API_KEY in .env.local is currently empty.');
  console.log('If you just pasted it in your editor, please press \x1b[1mCtrl + S\x1b[0m to save .env.local, then re-run this command:');
  console.log('  \x1b[36mnpm run test:ai\x1b[0m\n');
  console.log('\x1b[32m[FALLBACK STATUS]\x1b[0m GestureKart local rule-based fallback engine is ACTIVE and ready.');
  console.log('The simulator works 100% with full Civic Driving Scorecards even without an API key.');
  console.log('======================================================\n');
  process.exit(0);
}

// Masked preview (e.g. sk-or-v1-****************)
const maskedKey = apiKey.length > 12 
  ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`
  : '***';

console.log(`Key Status:       \x1b[32m[DETECTED]\x1b[0m (${apiKey.length} characters: ${maskedKey})`);
console.log('\nTesting live connection to OpenRouter API (https://openrouter.ai/api/v1/chat/completions)...');

try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': 'GestureKart',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an urban driving evaluator for GestureKart on Lahore Canal Road. Reply with a short JSON evaluation.',
        },
        {
          role: 'user',
          content: 'Driver completed Sector 01 with 980 points and 0 red light violations. Return a JSON object with headline and tip.',
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\x1b[31m[API RESPONSE ERROR ${response.status}]\x1b[0m: ${errorText}`);
    console.log('\n\x1b[33m[FALLBACK ACTIVE]\x1b[0m The local rule-based engine will be used automatically.');
    process.exit(1);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  console.log('\x1b[32m[SUCCESS]\x1b[0m OpenRouter responded successfully!');
  console.log(`Model Used: \x1b[36m${data.model || model}\x1b[0m`);
  console.log('Sample Civic Insights Response Preview:');
  console.log(`  ${content?.trim().replace(/\n/g, ' ')}\n`);
  console.log('======================================================');
  console.log('✓ OPENROUTER IS CONFIGURED AND OPERATIONAL FOR GESTUREKART');
  console.log('======================================================\n');
} catch (error) {
  console.error('\x1b[31m[CONNECTION ERROR]\x1b[0m:', error.message);
  console.log('\n\x1b[33m[FALLBACK ACTIVE]\x1b[0m Local rule-based engine is active and will generate scorecard insights.');
  process.exit(1);
}
