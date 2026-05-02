/**
 * Universal `randomUUID` — works in browsers (modern), Node 19+, Bun, Deno
 * via the Web Crypto API. Falls back to a Math.random-based RFC4122 v4
 * generator for older runtimes (non-cryptographic).
 *
 * The lib used to import `randomUUID` from `node:crypto`, which broke
 * browser bundles (`Module "crypto" has been externalized for browser
 * compatibility`). This shim removes that build-time dependency.
 */
export function randomUUID(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === "function") {
        return c.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        const v = ch === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
