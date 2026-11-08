/** Turn a Clerk error into a plain sentence. Never show raw codes. */
export function friendly(error: unknown): string {
  const e = error as { code?: string; errors?: { code?: string }[] } | null;
  const code = e?.errors?.[0]?.code ?? e?.code ?? '';
  if (code.includes('code_incorrect'))
    return "That code didn't match. Double-check the email or send a new one.";
  if (code.includes('expired')) return 'That code expired. Send a new one.';
  if (code.includes('identifier_not_found'))
    return "We couldn't find an Otto account for that email.";
  if (code.includes('too_many') || code.includes('rate_limit'))
    return 'Too many tries. Wait a minute, then send a new code.';
  return 'Something went wrong. Try again in a moment.';
}
