export interface AiConsentStatus {
  consentedWorkspaces: Set<string>;
}

export class ConsentManager {
  private consented = new Set<string>();

  public hasConsent(workspacePath: string): boolean {
    return this.consented.has(workspacePath);
  }

  public grantConsent(workspacePath: string): void {
    this.consented.add(workspacePath);
  }
}
