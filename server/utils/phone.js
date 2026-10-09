// Phone number helpers.
// Twilio only accepts numbers in international format, e.g. +919876543210.
// Users type numbers in many ways ("98765 43210", "09876543210", "+91 98765-43210"),
// so we clean them up in one place and use the result everywhere.

function normalizePhone(raw) {
  if (typeof raw !== "string") return null;

  // Read the default country code at call time so .env is already loaded.
  const defaultCode = (process.env.DEFAULT_COUNTRY_CODE || "+91").replace(/\D/g, "");

  // Remove spaces, dashes, dots and brackets.
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s) return null;

  // "0091..." -> "+91..."
  if (s.startsWith("00")) s = "+" + s.slice(2);

  if (!s.startsWith("+")) {
    // Local number. Drop leading zeros ("09876543210" -> "9876543210").
    s = s.replace(/^0+/, "");

    if (s.length === 10) {
      s = "+" + defaultCode + s; // 9876543210 -> +919876543210
    } else if (s.startsWith(defaultCode) && s.length === defaultCode.length + 10) {
      s = "+" + s; // 919876543210 -> +919876543210
    } else {
      return null;
    }
  }

  // E.164: + then 8 to 15 digits, first digit not zero.
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

// +919876543210 -> +91******3210 (safe to store in logs and history)
function maskPhone(phone) {
  if (typeof phone !== "string" || phone.length < 6) return "****";
  return phone.slice(0, 3) + "*".repeat(Math.max(phone.length - 7, 2)) + phone.slice(-4);
}

module.exports = { normalizePhone, maskPhone };
