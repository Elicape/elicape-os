/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFileSystemAdapter } from './fs/index';
import { loadGraph, getBootChecks, BootCheck } from './GraphLoader';
import { getActiveRepo } from './repo/activeRepo';
import { APP_NAME } from './constants';

export interface IntegrityCheckResult {
  id: string;
  passed: boolean;
  message: string;
  on_fail: string;
}

export interface IntegrityReport {
  allOk: boolean;
  checks: IntegrityCheckResult[];
  failedCritical: IntegrityCheckResult[];
  hasDegraded: boolean;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
}

async function tauriInvoke(command: string, args?: Record<string, unknown>): Promise<any> {
  if (!isTauri()) throw new Error('Not in Tauri');
  return (window as any).__TAURI__.core.invoke(command, args);
}

export async function runIntegrityChecks(): Promise<IntegrityReport> {
  const graph = await loadGraph();
  const adapter = getFileSystemAdapter();
  const checks: IntegrityCheckResult[] = [];
  const failedCritical: IntegrityCheckResult[] = [];

  if (!graph || !graph.boot?.order) {
    const llmCheck = await checkHealth(undefined, 'degrade');
    checks.push(llmCheck);
    if (!llmCheck.passed && llmCheck.on_fail === 'abort') failedCritical.push(llmCheck);

    const repoCheck = await checkRepoExists();
    checks.push(repoCheck);
    if (!repoCheck.passed && repoCheck.on_fail === 'abort') failedCritical.push(repoCheck);

    const fsCheck = await checkFsWrite();
    checks.push(fsCheck);
    if (!fsCheck.passed && fsCheck.on_fail === 'abort') failedCritical.push(fsCheck);

    const hasDegraded = checks.some(c => !c.passed && c.on_fail === 'degrade');
    return { allOk: failedCritical.length === 0, checks, failedCritical, hasDegraded };
  }

  const bootChecks = getBootChecks(graph);
  for (const bootCheck of bootChecks) {
    let result: IntegrityCheckResult;

    switch (bootCheck.type) {
      case 'healthcheck':
        result = await checkHealth(bootCheck);
        break;
      case 'file_exists':
        if (bootCheck.path?.includes('active.repo')) {
          result = await checkRepoExists(bootCheck);
        } else {
          result = await checkFileExists(bootCheck, adapter);
        }
        break;
      case 'write_test':
        result = await checkFsWrite(bootCheck);
        break;
      case 'ui':
        result = { id: bootCheck.id || 'load_ui', passed: true, message: 'UI ready', on_fail: 'ignore' };
        break;
      default:
        result = { id: bootCheck.id || 'unknown', passed: false, message: `Unknown check type: ${bootCheck.type}`, on_fail: 'abort' };
    }

    checks.push(result);
    if (!result.passed && result.on_fail === 'abort') {
      failedCritical.push(result);
    }
  }

  const hasDegraded = checks.some(c => !c.passed && c.on_fail === 'degrade');
  return { allOk: failedCritical.length === 0, checks, failedCritical, hasDegraded };
}

async function checkHealth(check?: BootCheck, defaultOnFail?: string): Promise<IntegrityCheckResult> {
  const id = check?.id || 'check_llm_health';
  const endpoint = check?.endpoint || 'http://127.0.0.1:8080/health';
  const on_fail = check?.on_fail || defaultOnFail || 'abort';
  const message = check?.message || 'llama-server no responde';

  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        return { id, passed: true, message: 'LLM saludable en :8080', on_fail };
      }
    } catch {
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  return { id, passed: false, message, on_fail };
}

async function checkRepoExists(check?: BootCheck): Promise<IntegrityCheckResult> {
  const id = check?.id || 'check_active_repo';
  const on_fail = check?.on_fail || 'degrade';
  const message = check?.message || 'No hay repo activo';
  try {
    const repoPath = await getActiveRepo();
    if (repoPath) {
      return { id, passed: true, message: `Repo: ${repoPath}`, on_fail };
    }
    return { id, passed: false, message, on_fail };
  } catch {
    return { id, passed: false, message, on_fail };
  }
}

async function checkFileExists(check: BootCheck, adapter: any): Promise<IntegrityCheckResult> {
  const id = check?.id || 'check_file_exists';
  const path = check?.path || '';
  const on_fail = check?.on_fail || 'degrade';
  const message = check?.message || `Archivo no encontrado: ${path}`;
  try {
    await adapter.readFile(path);
    return { id, passed: true, message: `Existe: ${path}`, on_fail };
  } catch {
    return { id, passed: false, message, on_fail };
  }
}

async function checkFsWrite(check?: BootCheck): Promise<IntegrityCheckResult> {
  const id = check?.id || 'check_fs_write';
  const path = check?.path;
  const on_fail = check?.on_fail || 'abort';
  const message = check?.message || 'Sin permisos de escritura';

  try {
    if (isTauri()) {
      const result = await tauriInvoke('test_fs_write');
      return { id, passed: true, message: `FS writable (native): ${result}`, on_fail };
    }
  } catch {
  }

  const safePath = path || `/${APP_NAME}_test_write`;
  try {
    const adapter = getFileSystemAdapter();
    await adapter.writeFile(safePath, 'integrity');
    return { id, passed: true, message: 'FS writable', on_fail };
  } catch {
    return { id, passed: false, message, on_fail };
  }
}
