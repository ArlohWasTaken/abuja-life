import { describe, it, expect, vi } from 'vitest';
import { saveNote, getUnsubmittedNotes, markNotesAsSubmitted, recordSubmission } from '../src/db/queries';

describe('db queries', () => {
  it('saveNote binds parameters and executes insert', async () => {
    const runMock = vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 42 } });
    const bindMock = vi.fn().mockReturnValue({ run: runMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });
    const mockDb = { prepare: prepareMock } as unknown as D1Database;

    const noteId = await saveNote(mockDb, {
      senderId: '12345',
      senderName: 'Chidoziem Francis',
      text: 'Completed marketplace API endpoints',
      createdAtISO: '2026-10-06T10:00:00.000Z'
    });

    expect(prepareMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notes')
    );
    expect(bindMock).toHaveBeenCalledWith(
      '12345',
      'Chidoziem Francis',
      'Completed marketplace API endpoints',
      '2026-10-06T10:00:00.000Z'
    );
    expect(noteId).toBe(42);
  });

  it('getUnsubmittedNotes binds time range and returns notes', async () => {
    const mockNotes = [
      {
        id: 1,
        sender_id: '12345',
        sender_name: 'Chidoziem',
        text: 'API done',
        created_at: '2026-10-06T10:00:00.000Z',
        submitted_at: null,
      },
    ];
    const allMock = vi.fn().mockResolvedValue({ results: mockNotes });
    const bindMock = vi.fn().mockReturnValue({ all: allMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });
    const mockDb = { prepare: prepareMock } as unknown as D1Database;

    const results = await getUnsubmittedNotes(
      mockDb,
      '2026-10-04T23:00:00.000Z',
      '2026-10-09T15:00:00.000Z'
    );

    expect(prepareMock).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, sender_id')
    );
    expect(prepareMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM notes')
    );
    expect(bindMock).toHaveBeenCalledWith(
      '2026-10-04T23:00:00.000Z',
      '2026-10-09T15:00:00.000Z'
    );
    expect(results).toEqual(mockNotes);
  });

  it('markNotesAsSubmitted executes update for given IDs', async () => {
    const runMock = vi.fn().mockResolvedValue({ success: true });
    const bindMock = vi.fn().mockReturnValue({ run: runMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });
    const mockDb = { prepare: prepareMock } as unknown as D1Database;

    await markNotesAsSubmitted(mockDb, [1, 2, 3], '2026-10-09T15:01:00.000Z');

    expect(prepareMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE notes')
    );
    expect(prepareMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id IN (?, ?, ?)')
    );
    expect(bindMock).toHaveBeenCalledWith('2026-10-09T15:01:00.000Z', 1, 2, 3);
  });

  it('recordSubmission inserts record and returns ID', async () => {
    const runMock = vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 10 } });
    const bindMock = vi.fn().mockReturnValue({ run: runMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });
    const mockDb = { prepare: prepareMock } as unknown as D1Database;

    const id = await recordSubmission(mockDb, {
      periodId: 'p-2026-10-05',
      summary: 'Bi-weekly progress on marketplace and dev portal',
      body: '<h3>Overview</h3><p>Steady work done...</p>',
      status: 'success',
      submittedAtISO: '2026-10-09T15:00:00.000Z'
    });

    expect(prepareMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO submissions')
    );
    expect(id).toBe(10);
  });
});
