export function info(msg: string): void {
  console.log(`[pipeline] ${msg}`);
}

export function warn(msg: string): void {
  console.warn(`[pipeline] ⚠ ${msg}`);
}

export function error(msg: string, err?: unknown): void {
  if (err instanceof Error) {
    console.error(`[pipeline] ✗ ${msg}: ${err.message}`);
  } else if (err !== undefined) {
    console.error(`[pipeline] ✗ ${msg}: ${String(err)}`);
  } else {
    console.error(`[pipeline] ✗ ${msg}`);
  }
}

export function progress(done: number, total: number, label: string): void {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  console.log(`[pipeline] ${label}: ${done}/${total} (${pct}%)`);
}
