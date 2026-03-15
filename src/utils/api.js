import { getApiKey } from './storage';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export const callClaude = async (systemPrompt, userMessage) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.content[0].text;
};

export const parseActivitiesWithAI = async (text, initiatives) => {
  const platformsMap = Object.fromEntries(
    initiatives.map((i) => [i.name, i.platforms || []])
  );
  const typesMap = Object.fromEntries(
    initiatives.map((i) => [i.name, i.activityTypes || []])
  );

  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `You are a data parser for an initiative tracker. Given natural language input about daily work activities, extract structured activity entries.

Available initiatives: ${JSON.stringify(initiatives.map((i) => ({ id: i.id, name: i.name, status: i.status })))}
Available platforms per initiative: ${JSON.stringify(platformsMap)}
Available activity types per initiative: ${JSON.stringify(typesMap)}
Today's date: ${today}

Return ONLY a valid JSON array (no markdown, no explanation):
[{
  "initiativeId": "matched initiative ID",
  "initiativeName": "for display",
  "date": "YYYY-MM-DD",
  "platform": "best match or new platform name",
  "activityType": "best match or new activity type",
  "quantity": number,
  "responseCount": number,
  "conversionCount": number,
  "notes": "brief relevant context"
}]

Rules:
- Fuzzy match to existing initiatives by name/context
- Default date to today (${today}) if not specified
- Infer platform and activity type from context
- quantity = actions taken (posts made, emails sent, people contacted)
- responseCount = people who replied/showed interest
- conversionCount = people who committed/signed up/booked
- Extract every distinct activity group mentioned
- If multiple platforms are mentioned for one initiative, create separate entries
- quantity must be >= 1`;

  const raw = await callClaude(systemPrompt, text);

  // Extract JSON array from response
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse AI response as JSON array');
  return JSON.parse(match[0]);
};
