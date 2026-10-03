import { describe, it, expect, vi } from 'vitest';
import { formatReportFromNotes, buildFallbackReport } from '../src/ai/formatter';
import type { Note } from '../src/types';

describe('ai formatter', () => {
  const sampleNotes: Note[] = [
    {
      id: 1,
      sender_id: '123',
      sender_name: 'Kensey',
      text: 'Met with frontend team to coordinate marketplace UI redesign.',
      created_at: '2026-10-06T10:00:00.000Z',
      submitted_at: null,
    },
    {
      id: 2,
      sender_id: '456',
      sender_name: 'Chidoziem',
      text: 'Completed authentication session bugfix and tested reporting endpoints.',
      created_at: '2026-10-07T14:00:00.000Z',
      submitted_at: null,
    },
  ];

  it('parses valid JSON response from AI', async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue({
        response: JSON.stringify({
          summary: 'Marketplace UI aligned, authentication session bugfix completed and verified.',
          body: '<h3>Overview</h3><p>Steady engineering progress was achieved this week across frontend and backend modules.</p><h3>Activities</h3><ul><li>Met with frontend team to coordinate marketplace UI redesign.</li><li>Completed authentication session bugfix and tested reporting endpoints.</li></ul><h3>Challenges</h3><p>No major blockers encountered during this period.</p><h3>Next Period</h3><p>Continue production readiness testing and monitor platform stability.</p>',
        }),
      }),
    };

    const result = await formatReportFromNotes(mockAi, sampleNotes);

    expect(result.summary.length).toBeGreaterThanOrEqual(10);
    expect(result.body).toContain('<h3>Overview</h3>');
    expect(result.body).toContain('<h3>Activities</h3>');
    expect(result.body).toContain('<h3>Challenges</h3>');
    expect(result.body).toContain('<h3>Next Period</h3>');
    expect(mockAi.run).toHaveBeenCalledTimes(1);
  });

  it('extracts JSON when wrapped in markdown code blocks', async () => {
    const rawMarkdown = `\`\`\`json
{
  "summary": "Completed core integrations and resolved session issues.",
  "body": "<h3>Overview</h3><p>Key milestones in marketplace and authentication reached.</p><h3>Activities</h3><ul><li>Resolved session issue</li></ul><h3>Challenges</h3><p>None.</p><h3>Next Period</h3><p>Deploy.</p>"
}
\`\`\``;

    const mockAi = {
      run: vi.fn().mockResolvedValue({
        response: rawMarkdown,
      }),
    };

    const result = await formatReportFromNotes(mockAi, sampleNotes);

    expect(result.summary).toBe('Completed core integrations and resolved session issues.');
    expect(result.body).toContain('<h3>Overview</h3>');
  });

  it('uses fallback generator when AI throws an error', async () => {
    const mockAi = {
      run: vi.fn().mockRejectedValue(new Error('Cloudflare AI quota or network error')),
    };

    const result = await formatReportFromNotes(mockAi, sampleNotes);

    expect(result.summary.length).toBeGreaterThanOrEqual(10);
    expect(result.body).toContain('<h3>Overview</h3>');
    expect(result.body).toContain('<h3>Activities</h3>');
    expect(result.body).toContain('<h3>Challenges</h3>');
    expect(result.body).toContain('<h3>Next Period</h3>');
    expect(result.body).toContain('Met with frontend team');
    expect(result.body).toContain('Completed authentication session bugfix');
  });

  it('buildFallbackReport produces valid plain text length >= 40 chars', () => {
    const result = buildFallbackReport(sampleNotes);
    const plainText = result.body.replace(/<[^>]*>/g, '').trim();

    expect(result.summary.length).toBeGreaterThanOrEqual(10);
    expect(plainText.length).toBeGreaterThanOrEqual(40);
  });
});
