const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 365 * 24 * 60 * 60],
    ["month", 30 * 24 * 60 * 60],
    ["week", 7 * 24 * 60 * 60],
    ["day", 24 * 60 * 60],
    ["hour", 60 * 60],
    ["minute", 60],
];

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "just now", "5 minutes ago", "yesterday", "2 months ago"...; `null` for unparseable input. */
export function timeAgo(iso: string, now: number = Date.now()): string | null {
    const then = Date.parse(iso);
    if (Number.isNaN(then)) return null;
    const seconds = Math.max(0, Math.round((now - then) / 1000));
    for (const [unit, size] of UNITS) {
        if (seconds >= size) {
            return relative.format(-Math.floor(seconds / size), unit);
        }
    }
    return "just now";
}
