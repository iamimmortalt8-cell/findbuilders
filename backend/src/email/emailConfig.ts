/**
 * Master switch for the entire FindBuilders email subsystem.
 *
 * STRICT boolean parser: ONLY the exact value `true` (case-sensitive,
 * surrounding whitespace trimmed) enables email. Everything else disables it:
 *
 *   "true"  -> enabled
 *   "false", "FALSE", "True", "TRUE", "0", "1", "", "yes", undefined,
 *   missing  -> disabled
 *
 * DEFAULT when EMAIL_ENABLED is missing: DISABLED (fail-safe — email can
 * never be sent accidentally, e.g. in production before a verified domain
 * exists).
 */
export function isEmailEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return String(env.EMAIL_ENABLED ?? '').trim() === 'true';
}
