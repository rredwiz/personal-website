import { describe, expect, it } from "vitest";
import { timeAgo } from "@/lib/time";

const NOW = Date.parse("2026-10-09T12:00:00Z");

describe("timeAgo", () => {
    it.each([
        ["2026-10-09T11:59:30Z", "just now"],
        ["2026-10-09T11:55:00Z", "5 minutes ago"],
        ["2026-10-09T09:00:00Z", "3 hours ago"],
        ["2026-10-08T11:00:00Z", "yesterday"],
        ["2026-10-05T12:00:00Z", "4 days ago"],
        ["2026-07-24T02:06:00Z", "2 months ago"],
        ["2025-09-01T00:00:00Z", "last year"],
    ])("%s -> %s", (iso, expected) => {
        expect(timeAgo(iso, NOW)).toBe(expected);
    });

    it("treats future timestamps (clock skew) as just now and rejects garbage", () => {
        expect(timeAgo("2026-10-09T12:00:30Z", NOW)).toBe("just now");
        expect(timeAgo("not a date", NOW)).toBeNull();
    });
});
