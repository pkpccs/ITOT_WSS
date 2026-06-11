export class SessionManager {
    activeSessionId = null;
    setSession(sessionId) {
        this.activeSessionId = sessionId;
    }
    getSession() {
        return this.activeSessionId;
    }
}
