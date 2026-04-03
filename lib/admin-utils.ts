export function parseSettingValue(raw: string): unknown {
  const value = raw.trim();

  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
