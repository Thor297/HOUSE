/** Gemeinsamer Rückgabetyp für Server Actions, die mit useActionState
 *  verwendet werden: entweder ein Fehler, eine Erfolgsmeldung, oder
 *  nichts (initialer Zustand). */
export type ActionState = { error?: string; message?: string } | null;
