/** Server-only: pass into AuthForm from login/signup pages. */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
}
