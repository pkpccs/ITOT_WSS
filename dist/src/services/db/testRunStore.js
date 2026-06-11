const runs = new Map();
export function saveTestRun(record) {
    const id = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const stored = {
        id,
        createdAt: new Date().toISOString(),
        ...record,
    };
    runs.set(id, stored);
    return stored;
}
export function listTestRuns() {
    return [...runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
