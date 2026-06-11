export type TestRunRecord = {
  id: string;
  testName: string;
  passed: boolean;
  createdAt: string;
};

const runs = new Map<string, TestRunRecord>();

export function saveTestRun(record: Omit<TestRunRecord, "id" | "createdAt">): TestRunRecord {
  const id = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const stored: TestRunRecord = {
    id,
    createdAt: new Date().toISOString(),
    ...record,
  };

  runs.set(id, stored);
  return stored;
}

export function listTestRuns(): TestRunRecord[] {
  return [...runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
