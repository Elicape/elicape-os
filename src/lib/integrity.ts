import { getFileSystemAdapter } from './fs/index';

export interface IntegrityReport {
  llmAlive: boolean;
  repoDefined: boolean;
  fsWritable: boolean;
  allOk: boolean;
}

export async function checkIntegrity(): Promise<IntegrityReport> {
  const adapter = getFileSystemAdapter();
  const report: IntegrityReport = {
    llmAlive: false,
    repoDefined: false,
    fsWritable: false,
    allOk: false,
  };

  // Check 1: LLM alive
  try {
    const res = await fetch('http://127.0.0.1:8080/health');
    report.llmAlive = res.ok;
  } catch { /* offline */ }

  // Check 2: Repo defined
  try {
    const content = await adapter.readFile('.elicape/active.repo');
    report.repoDefined = !!content?.trim();
  } catch { /* not found */ }

  // Check 3: FS writable
  try {
    await adapter.writeFile('/tmp/elicape_test', 'integrity');
    report.fsWritable = true;
  } catch { /* no permissions */ }

  report.allOk = report.llmAlive && report.repoDefined && report.fsWritable;
  return report;
}
