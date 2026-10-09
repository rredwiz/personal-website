/**
 * The site's tiny Vim: tabs (routes), buffer names, and what each `:` command
 * does. Pure functions, so the UI in StatusLine.tsx stays thin.
 */

export interface Tab {
    href: string;
    /** Label in the tabline and the buffer name in the statusline. */
    file: string;
    /** Extra names `:e`/`:tabe` accept for this tab. */
    aliases: readonly string[];
}

export const TABS: readonly Tab[] = [
    { href: "/", file: "home.md", aliases: ["home", "~", "index", "readme"] },
    {
        href: "/projects",
        file: "projects.md",
        aliases: ["projects", "projects/", "work"],
    },
];

/** The message the command line shows when nothing else has been said. */
export const DEFAULT_MESSAGE = "This site owner is extremely cool.";

export const EXTERNAL_LINKS: Readonly<Record<string, string>> = {
    github: "https://github.com/rredwiz",
    linkedin: "https://www.linkedin.com/in/andrew-dutka-65368135a/",
    resume: "/Andrew-Dutka-Resume.pdf",
    monkeytype: "https://monkeytype.com/profile/redwiz",
};

export type CommandResult =
    | { kind: "navigate"; href: string; message: string }
    | { kind: "open"; href: string; message: string }
    | { kind: "message"; text: string; error?: boolean }
    | { kind: "keys"; enabled: boolean }
    | { kind: "help" };

export function tabIndex(pathname: string | null): number {
    if (!pathname) return -1;
    return TABS.findIndex((tab) =>
        tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    );
}

/** What the statusline calls the current page: "~/home.md", or "~/nope [New]" for a 404. */
export function bufferName(pathname: string | null): string {
    const index = tabIndex(pathname);
    if (index >= 0) return `~/${TABS[index].file}`;
    return `~${pathname ?? "/"} [New]`;
}

/** The tab `offset` steps away from the current one, wrapping like `gt`/`gT`. */
export function cycleTab(pathname: string | null, offset: number): Tab {
    const current = Math.max(tabIndex(pathname), 0);
    const next =
        (((current + offset) % TABS.length) + TABS.length) % TABS.length;
    return TABS[next];
}

function findTab(name: string): Tab | undefined {
    const wanted = name.toLowerCase().replace(/^~\//, "").replace(/^\.\//, "");
    return TABS.find(
        (tab) => tab.file === wanted || tab.aliases.includes(wanted),
    );
}

function openTab(tab: Tab): CommandResult {
    return {
        kind: "navigate",
        href: tab.href,
        message: `"~/${tab.file}" [readonly]`,
    };
}

/** Run one command line (with or without the leading ":"). `null` for an empty line. */
export function runCommand(
    raw: string,
    pathname: string | null,
): CommandResult | null {
    const input = raw.trim().replace(/^:+/, "").trim();
    if (!input) return null;
    const [command, ...rest] = input.split(/\s+/);
    const arg = rest.join(" ");

    switch (command) {
        case "q":
        case "quit":
        case "qa":
        case "qall":
        case "close":
            return {
                kind: "message",
                text: "E37: No write since last change (add ! to override)",
                error: true,
            };
        case "q!":
        case "qa!":
        case "quit!":
            return {
                kind: "message",
                text: "Nobody actually quits Vim. Try :help instead.",
            };
        case "w":
        case "write":
        case "wq":
        case "x":
        case "wq!":
            return {
                kind: "message",
                text: `"${bufferName(pathname)}" is read-only (it's a website).`,
                error: true,
            };
        case "h":
        case "help":
            return { kind: "help" };
        case "e":
        case "edit":
        case "tabe":
        case "tabedit":
        case "tabnew": {
            if (!arg) {
                return {
                    kind: "message",
                    text: "E32: No file name",
                    error: true,
                };
            }
            const tab = findTab(arg);
            return tab
                ? openTab(tab)
                : {
                      kind: "message",
                      text: `E484: Can't open file ${arg}`,
                      error: true,
                  };
        }
        case "tabn":
        case "tabnext":
            return openTab(cycleTab(pathname, 1));
        case "tabp":
        case "tabprevious":
        case "tabN":
        case "tabNext":
            return openTab(cycleTab(pathname, -1));
        case "tabfirst":
        case "tabr":
        case "tabrewind":
            return openTab(TABS[0]);
        case "tablast":
            return openTab(TABS[TABS.length - 1]);
        case "set":
            if (arg === "nokeys" || arg === "keys!") {
                return { kind: "keys", enabled: false };
            }
            if (arg === "keys") return { kind: "keys", enabled: true };
            return {
                kind: "message",
                text: `E518: Unknown option: ${arg || "(none)"}`,
                error: true,
            };
        default: {
            const tab = findTab(command);
            if (tab && !arg) return openTab(tab);
            const link = EXTERNAL_LINKS[command.toLowerCase()];
            if (link && !arg) {
                return {
                    kind: "open",
                    href: link,
                    message: `Opening ${command}…`,
                };
            }
            return {
                kind: "message",
                text: `E492: Not an editor command: ${input}`,
                error: true,
            };
        }
    }
}
