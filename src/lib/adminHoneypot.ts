/** Example password from .env.example — honeypot for automated credential stuffing. */
export const ADMIN_HONEYPOT_PASSWORD = "Sup3rS3cr3tP4ssw0rd!";

export const HONEYPOT_IMAGES = [
  "/honeypot/butcher-1.png",
  "/honeypot/butcher-2.jpg",
  "/honeypot/butcher-3.jpg",
] as const;

export function pickRandomHoneypotImage(): (typeof HONEYPOT_IMAGES)[number] {
  return HONEYPOT_IMAGES[Math.floor(Math.random() * HONEYPOT_IMAGES.length)]!;
}
