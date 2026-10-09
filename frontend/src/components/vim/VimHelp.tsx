"use client";

const KEYS: ReadonlyArray<[string, string]> = [
    ["j / k", "scroll down / up"],
    ["gg / G", "top / bottom"],
    ["gt / gT", "next / previous tab"],
    [":", "command line"],
    ["?", "this help"],
    ["Esc", "close"],
];

const COMMANDS: ReadonlyArray<[string, string]> = [
    [":home  :projects", "open a tab"],
    [":github  :linkedin", "open a profile"],
    [":resume", "open the resume"],
    [":set nokeys", "turn the keys off"],
    [":q", "go on, try it"],
];

function Rows({ rows }: { rows: ReadonlyArray<[string, string]> }) {
    return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1">
            {rows.map(([keys, what]) => (
                <div key={keys} className="contents">
                    <dt className="text-ink">{keys}</dt>
                    <dd className="text-ink-muted">{what}</dd>
                </div>
            ))}
        </dl>
    );
}

/** The `:help` / `?` panel, floating above the statusline. */
export default function VimHelp({
    keysEnabled,
    onToggleKeys,
    onClose,
}: {
    keysEnabled: boolean;
    onToggleKeys: () => void;
    onClose: () => void;
}) {
    return (
        <section
            aria-label="Keyboard help"
            className="absolute right-3 bottom-full mb-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-line bg-surface p-4 shadow-card backdrop-blur-md"
        >
            <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-ink">help.txt</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-ink-faint transition-colors hover:text-ink"
                >
                    :close
                </button>
            </div>
            <p className="mb-1.5 text-ink-faint">NORMAL</p>
            <Rows rows={KEYS} />
            <p className="mt-3 mb-1.5 text-ink-faint">COMMANDS</p>
            <Rows rows={COMMANDS} />
            <button
                type="button"
                onClick={onToggleKeys}
                aria-pressed={keysEnabled}
                className="mt-4 w-full rounded-lg border border-line px-3 py-1.5 text-left text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
                Single-key shortcuts: {keysEnabled ? "on" : "off"} (click to
                turn {keysEnabled ? "off" : "on"})
            </button>
        </section>
    );
}
