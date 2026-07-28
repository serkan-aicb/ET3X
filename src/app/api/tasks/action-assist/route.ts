import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const requestSchema = z.object({
  title: z.string().max(180).optional(),
  module: z.string().max(180).optional(),
  description: z.string().min(20).max(6_000),
  skillLevel: z.enum(['Novice', 'Skilled', 'Expert', 'Master']).optional(),
});

const aiEnvelopeSchema = z.object({
  success: z.literal(true),
  requestId: z.string(),
  data: z.object({
    titleSuggestions: z.array(z.string().min(1).max(90)).min(1).max(3),
    skillSuggestions: z.array(
      z.object({
        id: z.number().int().positive(),
        label: z.string().min(1).max(120),
        reason: z.string().min(1).max(180),
      }),
    ),
  }),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task details' }, { status: 400 });
    }

    const aiServiceUrl = process.env.T3X_AI_SERVICE_URL;
    const aiServiceApiKey = process.env.T3X_AI_SERVICE_API_KEY;
    if (!aiServiceUrl || !aiServiceApiKey) {
      return NextResponse.json({ error: 'Action assist is not configured' }, { status: 503 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, label, description, oulu_domain')
      .order('label');

    if (skillsError) {
      console.error('Action assist skills fetch error:', skillsError);
      return NextResponse.json({ error: 'Unable to load skills' }, { status: 500 });
    }

    const existingSkills = (skills ?? []).map((skill) => ({
      id: skill.id,
      label: skill.label,
      description: skill.description,
      ouluDomain: skill.oulu_domain,
    }));

    if (existingSkills.length === 0) {
      return NextResponse.json({ error: 'No skills are available for suggestions' }, { status: 400 });
    }

    const aiResponse = await fetch(`${aiServiceUrl.replace(/\/$/, '')}/v1/action-assist`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${aiServiceApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...parsed.data, existingSkills }),
    });

    if (!aiResponse.ok) {
      console.error('Action assist AI service error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
      });
      return NextResponse.json({ error: 'Action assist failed' }, { status: 502 });
    }

    const envelope = aiEnvelopeSchema.safeParse(await aiResponse.json());
    if (!envelope.success) {
      console.error('Action assist AI response validation error:', envelope.error.flatten());
      return NextResponse.json({ error: 'Action assist returned an invalid response' }, { status: 502 });
    }

    const skillById = new Map(existingSkills.map((skill) => [skill.id, skill]));
    const skillSuggestions = envelope.data.data.skillSuggestions
      .filter((suggestion) => skillById.has(suggestion.id))
      .slice(0, 12)
      .map((suggestion) => ({
        ...suggestion,
        label: skillById.get(suggestion.id)?.label ?? suggestion.label,
      }));

    return NextResponse.json({
      titleSuggestions: envelope.data.data.titleSuggestions,
      skillSuggestions,
    });
  } catch (err) {
    console.error('Action assist route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
