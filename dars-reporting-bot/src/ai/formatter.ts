import type { Note } from '../types';

export interface FormattedReport {
  summary: string;
  body: string;
}

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `You are an executive assistant for a directorate lead at the Babcock University Computer Club (BUCC).
Your task is to synthesize raw weekly activity notes into a polished bi-weekly director report for DARS.

Output MUST be valid JSON with this exact schema:
{
  "summary": "One-line executive summary of key achievements (at least 15 characters, max 120 characters)",
  "body": "<h3>Overview</h3><p>...</p><h3>Activities</h3><ul><li>...</li></ul><h3>Challenges</h3><p>...</p><h3>Next Period</h3><p>...</p>"
}

Strict Rules:
1. Plain text inside 'body' must be at least 80 characters.
2. Formatted strictly with the four h3 sections: Overview, Activities (as ul/li bullet list), Challenges, Next Period.
3. Ground all points strictly in the provided notes; do not invent tasks or metrics.
4. If notes do not mention challenges, state 'No major blockers encountered during this period.'
5. Output purely valid JSON, no introductory or concluding chat text.`;

/**
 * Strips HTML tags to count actual plain text length.
 */
function plainTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length;
}

/**
 * Extracts and parses a JSON object from text that may contain markdown or surrounding text.
 */
function parseJsonFromText(rawText: string): any {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Builds a deterministic fallback report from raw notes if the AI call fails or gives invalid output.
 */
export function buildFallbackReport(notes: Note[]): FormattedReport {
  const items = notes.map((n) => `<li>${n.text}</li>`).join('');
  const summary =
    notes.length > 0
      ? `Completed weekly Directorate activities (${notes.length} logged tasks)`
      : 'Weekly progress and activity updates for the Directorate';

  const body = `<h3>Overview</h3><p>During this reporting period, the Directorate continued execution of key objectives and scheduled tasks.</p><h3>Activities</h3><ul>${items || '<li>General operational tasks and team coordination conducted.</li>'}</ul><h3>Challenges</h3><p>No major blockers encountered during this period.</p><h3>Next Period</h3><p>Continue scheduled tasks and planned development milestones.</p>`;

  return { summary, body };
}

/**
 * Uses Cloudflare Workers AI to synthesize notes into a DARS-compliant report.
 * Falls back to buildFallbackReport on any parsing or network error.
 */
export async function formatReportFromNotes(
  ai: any,
  notes: Note[],
  model = DEFAULT_MODEL
): Promise<FormattedReport> {
  if (notes.length === 0) {
    return buildFallbackReport(notes);
  }

  const notesList = notes
    .map((n, i) => `${i + 1}. [${n.sender_name}]: ${n.text}`)
    .join('\n');

  try {
    const aiResponse = await ai.run(model, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Here are the raw team notes for this week:\n\n${notesList}\n\nSynthesize these into the required JSON report format.`,
        },
      ],
    });

    const rawContent: string =
      typeof aiResponse === 'string'
        ? aiResponse
        : aiResponse?.response || aiResponse?.result || JSON.stringify(aiResponse);

    const parsed = parseJsonFromText(rawContent);

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const body = typeof parsed.body === 'string' ? parsed.body.trim() : '';

    // Validate DARS constraints
    const hasRequiredHeadings =
      body.includes('<h3>Overview</h3>') &&
      body.includes('<h3>Activities</h3>') &&
      body.includes('<h3>Challenges</h3>') &&
      body.includes('<h3>Next Period</h3>');

    if (summary.length >= 10 && plainTextLength(body) >= 40 && hasRequiredHeadings) {
      return { summary, body };
    }

    // If validation fails, use fallback
    return buildFallbackReport(notes);
  } catch (err) {
    // Graceful fallback on network, quota, or parsing error
    return buildFallbackReport(notes);
  }
}
