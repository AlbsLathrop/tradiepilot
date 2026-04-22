import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

const FIXER_SYSTEM_PROMPT = `You are FIXER, the configuration agent for TradiePilot.
Joey wants to change something about how his system works.
Your job is to:
1. Understand what he wants to change
2. Map it to the correct Tradie Config field
3. Return the exact update to make

TRADIE CONFIG FIELDS YOU CAN UPDATE:
- "Tone" (text): casual / professional / friendly — controls message tone
- "Service Area" (text): suburbs Joey works in
- "Min Job Value" (text): minimum $ value Joey accepts
- "Services" (text): list of services offered
- "Business Name" (text): tradie's business name
- "Tradie Name" (text): Joey's first name
- "Suppress DAY_DONE" (checkbox): if true, skip day done messages
- "Suppress ON_THE_WAY" (checkbox): if true, skip on the way messages
- "LUNA Prompt" (text): full prompt override for lead qualification
- "Follow Up Day 1 Message" (text): custom Day 1 CHASE message
- "Follow Up Day 5 Message" (text): custom Day 5 CHASE message
- "Review Request Message" (text): custom ANCHOR review request SMS

RULES:
- Only update fields that are clearly requested
- Never update LUNA Prompt unless Joey explicitly says to change qualification rules
- If the request is ambiguous, ask one clarifying question
- Keep confirmations brief and casual

Always return valid JSON:
{
  "action": "update_config" | "clarify",
  "field": "exact field name from list above",
  "value": "new value as string (use 'true'/'false' for checkboxes)",
  "confirmation": "what to tell Joey (1 sentence, casual)",
  "clarification": "question to ask if action is clarify"
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, tradieConfigId } = body;

    if (!message) {
      return NextResponse.json({ error: 'No message' }, { status: 400 });
    }

    // Call Claude (FIXER)
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: FIXER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Joey says: "${message}"` }],
    });

    const rawText = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text.trim() : '';

    let fixerResult: any;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      fixerResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return NextResponse.json({
        success: false,
        reply: "Couldn't parse that config change. Try again.",
      });
    }

    // If clarification needed, just return the question
    if (fixerResult.action === 'clarify') {
      return NextResponse.json({
        success: true,
        reply: fixerResult.clarification,
        action: 'clarify',
      });
    }

    // Find Tradie Config record
    const configId = tradieConfigId || 'joey-tradie';

    const configSearch = await notion.databases.query({
      database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: configId },
      },
      page_size: 1,
    });

    if (configSearch.results.length === 0) {
      return NextResponse.json({
        success: false,
        reply: "Couldn't find your config. Ask Benny to check.",
      });
    }

    const configPageId = configSearch.results[0].id;

    // Build the property update based on field type
    let propertyUpdate: any = {};
    const field = fixerResult.field;
    const value = fixerResult.value;

    // Determine property type and format accordingly
    if (value === 'true' || value === 'false') {
      // Checkbox field
      propertyUpdate[field] = { checkbox: value === 'true' };
    } else {
      // Text field
      propertyUpdate[field] = {
        rich_text: [{ text: { content: value } }],
      };
    }

    // Update Notion Tradie Config
    await notion.pages.update({
      page_id: configPageId,
      properties: propertyUpdate,
    });

    console.log(`FIXER: Updated "${field}" → "${value}" for ${configId}`);

    return NextResponse.json({
      success: true,
      reply: fixerResult.confirmation,
      action: 'update_config',
      field,
      value,
    });

  } catch (error: any) {
    console.error('FIXER error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
