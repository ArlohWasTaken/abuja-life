import type { Note } from '../types';

export interface SaveNoteInput {
  senderId: string;
  senderName: string;
  text: string;
  createdAtISO?: string;
}

export interface RecordSubmissionInput {
  periodId: string;
  summary: string;
  body: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  submittedAtISO?: string;
}

/**
 * Inserts a new note into the notes table and returns its generated ID.
 */
export async function saveNote(db: D1Database, input: SaveNoteInput): Promise<number> {
  const createdAt = input.createdAtISO ?? new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO notes (sender_id, sender_name, text, created_at)
     VALUES (?, ?, ?, ?)`
  );
  const result = await stmt.bind(input.senderId, input.senderName, input.text, createdAt).run();
  return (result.meta as any)?.last_row_id ?? 0;
}

/**
 * Retrieves all notes created within a given time range that haven't been submitted yet.
 */
export async function getUnsubmittedNotes(
  db: D1Database,
  startISO: string,
  endISO: string
): Promise<Note[]> {
  const stmt = db.prepare(
    `SELECT id, sender_id, sender_name, text, created_at, submitted_at
     FROM notes
     WHERE created_at >= ? AND created_at <= ? AND submitted_at IS NULL
     ORDER BY created_at ASC`
  );
  const { results } = await stmt.bind(startISO, endISO).all<Note>();
  return results ?? [];
}

/**
 * Marks a list of note IDs as submitted.
 */
export async function markNotesAsSubmitted(
  db: D1Database,
  noteIds: number[],
  submittedAtISO = new Date().toISOString()
): Promise<void> {
  if (noteIds.length === 0) return;

  const placeholders = noteIds.map(() => '?').join(', ');
  const stmt = db.prepare(
    `UPDATE notes
     SET submitted_at = ?
     WHERE id IN (${placeholders})`
  );
  await stmt.bind(submittedAtISO, ...noteIds).run();
}

/**
 * Records a report submission attempt in the submissions table.
 */
export async function recordSubmission(
  db: D1Database,
  input: RecordSubmissionInput
): Promise<number> {
  const submittedAt = input.submittedAtISO ?? new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO submissions (period_id, summary, body, status, error_message, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const result = await stmt
    .bind(
      input.periodId,
      input.summary,
      input.body,
      input.status,
      input.errorMessage ?? null,
      submittedAt
    )
    .run();
  return (result.meta as any)?.last_row_id ?? 0;
}
