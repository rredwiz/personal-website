/**
 * Whether this browser can create a WebGL context. The animated background is a
 * three.js shader; without this check an unsupported browser (or a GPU-less
 * environment) would throw during render and blank the whole page.
 */
export function supportsWebGL(): boolean {
    if (typeof document === "undefined") return false;
    try {
        const canvas = document.createElement("canvas");
        return Boolean(
            canvas.getContext("webgl2") ??
            canvas.getContext("webgl") ??
            canvas.getContext("experimental-webgl"),
        );
    } catch {
        return false;
    }
}
