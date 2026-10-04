import { describe, it, expect } from 'vitest';
import { redactText, redactConfigValues } from '../../src/util/redact';

describe('Secret Redaction Engine', () => {
  it('should redact secret API keys, tokens, and credentials', () => {
    const rawText = 'api_key="sk-1234567890abcdef1234567890abcdef" and password: "SuperSecretPassword123!"';
    const redacted = redactText(rawText);

    expect(redacted).not.toContain('sk-1234567890abcdef1234567890abcdef');
    expect(redacted).not.toContain('SuperSecretPassword123!');
    expect(redacted).toContain('[REDACTED]');
  });

  it('should redact email addresses', () => {
    const text = 'Author: developer@example.com';
    const redacted = redactText(text);
    expect(redacted).not.toContain('developer@example.com');
  });

  it('should redact JSON config values keeping keys intact', () => {
    const config = {
      Database: {
        ConnectionString: 'Server=myServerAddress;Database=myDataBase;Uid=myUsername;Pwd=myPassword;',
        Port: 5432
      }
    };

    const redacted = redactConfigValues(config) as any;
    expect(redacted.Database.ConnectionString).toBe('[CONFIG_KEY_PRESENT]');
    expect(redacted.Database.Port).toBe('[CONFIG_KEY_PRESENT]');
  });
});
