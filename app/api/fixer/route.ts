import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const notion = new Client({ auth: process.env.NOTION_API_KEY! });

const FIXER_SYSTEM_PROMPT = `You are FIXER, the configuration agent for TradiePilot.
Tradie wants to change something about how their system works.

TRADIE CONFIG FIELDS YOU CAN UPDATE:
- "Tone" → casual / professional / friendly (controls message tone for this tradie only)
- "Service Area" → suburbs this tradie works in
- "Min Job Value" → minimum $ value this tradie accepts
- "Services" → list of services this tradie offers
- "Business Name" → this tradie's business name
- "Tradie Name" → tradie's first name

RULES:
- Changes ONLY apply to the tradie making the request — never affects other tradies
- Keep confirmations casual and brief
- If ambiguous, ask ONE clarifying question

Return JSON:
{
  "action": "update_config" | "clarify",
  "field": "exact field name",
  "value": "new value",
  "confirmation": "what to tell the tradie (1 sentence, casual)",
  "clarification": "question if action is clarify"
}`;

export async function POST(request: NextRequest) {
  try {
    const { message, tradieConfigId } = await request.json();

    if (!tradieConfigId) {
      return NextResponse.json({
        success: false,
        reply: "Can't update config — no tradie ID found.",
      });
    }

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: FIXER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Tradie (${tradieConfigId}) says: "${message}"` }],
    });

    const rawText = claudeResponse.content?.[0]?.type === 'text'
      ? claudeResponse.content[0].text?.trim() || '' : '';

    let fixerResult: any;
    try {
      const jsonMatch = rawText?.match(/\{[\s\S]*\}/);
      fixerResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return NextResponse.json({
        success: false,
        reply: "Couldn't parse that. Try again.",
      });
    }

    if (fixerResult.action === 'clarify') {
      return NextResponse.json({
        success: true,
        reply: fixerResult.clarification,
      });
    }

    // Find THIS tradie's config record only
    const configSearch = await notion.databases.query({
      database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
      filter: {
        property: 'Tradie Config ID',
        rich_text: { equals: tradieConfigId },
      },
      page_size: 1,
    });

    if (configSearch.results.length === 0) {
      return NextResponse.json({
        success: false,
        reply: "Couldn't find your config. Ask Benny.",
      });
    }

    const configPageId = configSearch.results[0].id;
    const field = fixerResult.field;
    const value = fixerResult.value;

    const propertyUpdate: any = {};
    if (value === 'true' || value === 'false') {
      propertyUpdate[field] = { checkbox: value === 'true' };
    } else {
      propertyUpdate[field] = { rich_text: [{ text: { content: value } }] };
    }

    await notion.pages.update({
      page_id: configPageId,
      properties: propertyUpdate,
    });

    console.log(`FIXER: [${tradieConfigId}] Updated "${field}" → "${value}"`);

    return NextResponse.json({
      success: true,
      reply: fixerResult.confirmation,
      action: 'update_config',
      field,
      value,
    });

  } catch (error: any) {
    console.error('FIXER error:', error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
