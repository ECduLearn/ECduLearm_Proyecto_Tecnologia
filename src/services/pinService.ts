import { Exercise, PinSession } from "../models/types";

// Sin 0/O ni 1/I: se confunden al proyectar el PIN en la pizarra
const ALFABETO_PIN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarPinAula(): string {
  const valores = new Uint32Array(6);
  crypto.getRandomValues(valores);
  return Array.from(valores, (v) => ALFABETO_PIN[v % ALFABETO_PIN.length]).join("");
}

export function formatPin(rawPin: string): string {
  const chars = rawPin.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (chars.length > 3) {
    return `${chars.slice(0, 3)} ${chars.slice(3)}`;
  }
  return chars;
}

export function cleanPin(formattedPin: string): string {
  return formattedPin.replace(/\s+/g, "").trim();
}

export function isValidPin(pin: string): boolean {
  const cleaned = cleanPin(pin);
  return /^[A-Z0-9]{6}$/i.test(cleaned);
}

export async function copyPinToClipboard(pin: string): Promise<boolean> {
  const formatted = formatPin(pin);
  const shareText = `PIN de ECduLearn: ${formatted}\nEntra en: ${window.location.origin}/portal`;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareText);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    }
  } catch {
    return false;
  }
}
