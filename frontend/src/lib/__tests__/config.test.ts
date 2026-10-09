import { afterEach, describe, expect, it, vi } from "vitest";

async function loadConfig(envValue: string | undefined) {
    vi.resetModules();
    if (envValue === undefined) {
        vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "");
    } else {
        vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", envValue);
    }
    return import("@/lib/config");
}

describe("backend config", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("defaults to the deployed Render backend", async () => {
        const { BACKEND_URL, backendUrl } = await loadConfig(undefined);
        expect(BACKEND_URL).toBe(
            "https://personal-website-backend-7zk8.onrender.com",
        );
        expect(backendUrl("/lastfm")).toBe(
            "https://personal-website-backend-7zk8.onrender.com/lastfm",
        );
    });

    it("uses NEXT_PUBLIC_BACKEND_URL when set and tolerates trailing slashes", async () => {
        const { backendUrl } = await loadConfig("http://127.0.0.1:5000///");
        expect(backendUrl("/monkeytype")).toBe(
            "http://127.0.0.1:5000/monkeytype",
        );
        expect(backendUrl("monkeytype")).toBe(
            "http://127.0.0.1:5000/monkeytype",
        );
    });

    it("ignores a whitespace-only override", async () => {
        const { BACKEND_URL } = await loadConfig("   ");
        expect(BACKEND_URL).toBe(
            "https://personal-website-backend-7zk8.onrender.com",
        );
    });
});
