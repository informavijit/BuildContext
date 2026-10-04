const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Generic Secret Key/Token/Password', pattern: /(?:api[_-]?key|secret|password|passwd|auth[_-]?token|bearer|access[_-]?token|private[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9_\-.~+/=]{8,})["']?/gi },
  { name: 'AWS Access Key', pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: 'AWS Secret Key', pattern: /aws_secret_access_key\s*=\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi },
  { name: 'GitHub Token', pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g },
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g },
  { name: 'Private Key Block', pattern: /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP)? PRIVATE KEY-----[\s\S]+?-----END (?:RSA|OPENSSH|DSA|EC|PGP)? PRIVATE KEY-----/g },
  { name: 'Database Connection String', pattern: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|mssql|oracle|redis):\/\/[^:\s]+:([^@\s]+)@[^\s]+/gi },
  { name: 'Generic Password In Connection String', pattern: /(?:Password|Pwd|Secret)=([^;'"\s]+)/gi },
  { name: 'Email Address', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g }
];

export function redactText(text: string): string {
  let redacted = text;
  for (const { pattern } of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      if (match.includes('=')) {
        const parts = match.split('=');
        return `${parts[0]}=[REDACTED]`;
      }
      if (match.includes(':')) {
        const parts = match.split(':');
        return `${parts[0]}: [REDACTED]`;
      }
      return '[REDACTED]';
    });
  }
  return redacted;
}

export function redactConfigValues(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redactConfigValues);
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = redactConfigValues(value);
    } else {
      result[key] = '[CONFIG_KEY_PRESENT]';
    }
  }
  return result;
}
