export class SessionManager {
  private activeSessionId: string | null = null;

  setSession(sessionId: string) {
    this.activeSessionId = sessionId;
  }

  getSession() {
    return this.activeSessionId;
  }
}
