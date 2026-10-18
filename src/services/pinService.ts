import { Exercise, PinSession } from "../models/types";

export function formatPin(rawPin: string): string {
  const digits = rawPin.replace(/\D/g, "").slice(0, 6);
  if (digits.length > 3) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return digits;
}

export function cleanPin(formattedPin: string): string {
  return formattedPin.replace(/\s+/g, "").trim();
}

export function isValidPin(pin: string): boolean {
  const cleaned = cleanPin(pin);
  return /^\d{6}$/.test(cleaned);
}

export async function copyPinToClipboard(pin: string): Promise<boolean> {
  const formatted = formatPin(pin);
  const shareText = `PIN de ECduLearm: ${formatted}\nEnlace directo: https://ecdulearm.edu.ec/s/${cleanPin(pin)}`;
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
