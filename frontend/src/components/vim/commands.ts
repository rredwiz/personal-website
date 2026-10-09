/**
 * The site's tiny Vim: tabs (routes), buffer names, and what each `:` command
 * does, Easter eggs included. Pure functions, so the UI stays thin.
 */
import type { EggId } from "./eggs";
import {
    COLORSCHEMES,
    type ColorschemeName,
    isColorscheme,
} from "./colorschemes";

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

/** The message the status line shows when nothing else has been said. */
export const DEFAULT_MESSAGE = "This site owner is extremely cool.";

export const EXTERNAL_LINKS: Readonly<Record<string, string>> = {
    github: "https://github.com/rredwiz",
    linkedin: "https://www.linkedin.com/in/andrew-dutka-65368135a/",
    resume: "/Andrew-Dutka-Resume.pdf",
    monkeytype: "https://monkeytype.com/profile/redwiz",
};

/** Files that exist only to be refused. */
const SECRET_FILES = new Set([
    "secrets.txt",
    "secrets",
    ".env",
    "passwords.txt",
    "diary.md",
]);

export interface ToastSpec {
    title?: string;
    text?: string;
    art?: string;
    tone?: "info" | "error";
}

export type Panel = "help" | "eggs" | "explore" | "neofetch";
export type Overlay = "train" | "goodbye";

export type CommandResult =
    | { kind: "navigate"; href: string; toast?: ToastSpec; egg?: EggId }
    | { kind: "open"; href: string; toast?: ToastSpec; egg?: EggId }
    | { kind: "toast"; toast: ToastSpec; egg?: EggId }
    | { kind: "keys"; enabled: boolean }
    | { kind: "panel"; panel: Panel; egg?: EggId }
    | { kind: "overlay"; overlay: Overlay; toast?: ToastSpec; egg?: EggId }
    | { kind: "colorscheme"; name: ColorschemeName; egg?: EggId }
    | { kind: "search"; pattern: string }
    | { kind: "eggs-reset" };

export interface CommandContext {
    pathname: string | null;
    now?: Date;
    colorscheme?: ColorschemeName;
}

// ---------------------------------------------------------------------------
// Tabs and buffers
// ---------------------------------------------------------------------------

export function tabIndex(pathname: string | null): number {
    if (!pathname) return -1;
    return TABS.findIndex((tab) =>
        tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    );
}

/** What the status line calls the current page: "~/home.md", or "~/nope [New]" for a 404. */
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
    return { kind: "navigate", href: tab.href };
}

// ---------------------------------------------------------------------------
// ASCII art
// ---------------------------------------------------------------------------

export function cowsay(message: string): string {
    const text = message.trim().slice(0, 40) || "moo";
    const bar = "-".repeat(text.length + 2);
    return [
        ` ${"_".repeat(text.length + 2)}`,
        `< ${text} >`,
        ` ${bar}`,
        "        \\    (__)",
        "         \\   (oo)________",
        "             (__)        )\\",
        "               ||-----w ||",
        "               ||       ||",
    ].join("\n");
}

const SMILE = [
    "      .-''''-.",
    "    .'  _  _  '.",
    "   /   (o)(o)   \\",
    "  |   ,      ,   |",
    "  |    '----'    |",
    "   \\            /",
    "    '._      _.'",
    "       '----'",
].join("\n");

const LS = "home.md   projects.md   resume.pdf   secrets.txt";

const LS_LONG = [
    "-rw-r--r--  andrew  2.1K  home.md",
    "-rw-r--r--  andrew  1.4K  projects.md",
    "-rw-r--r--  andrew  107K  resume.pdf",
    "-rw-------  andrew   42B  secrets.txt",
].join("\n");

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const error = (text: string, title?: string): ToastSpec => ({
    tone: "error",
    text,
    title,
});
const info = (text: string, title?: string): ToastSpec => ({ text, title });

function help(topic: string): CommandResult {
    switch (topic) {
        case "":
            return { kind: "panel", panel: "help" };
        case "42":
            return {
                kind: "toast",
                toast: info(
                    "The answer to life, the universe, and everything. Vim has known for decades.",
                    ":help 42",
                ),
                egg: "help42",
            };
        case "holy-grail":
            return {
                kind: "toast",
                toast: info("You found it, Arthur!", ":help holy-grail"),
                egg: "grail",
            };
        case "uganda":
        case "iccf":
            return {
                kind: "toast",
                toast: info(
                    "Vim is charityware: its author asked users to help children in Uganda through ICCF Holland.",
                    ":help uganda",
                ),
            };
        case "eggs":
            return { kind: "panel", panel: "eggs" };
        default:
            return {
                kind: "toast",
                toast: error(`E149: Sorry, no help for ${topic}`),
            };
    }
}

function shell(line: string, context: CommandContext): CommandResult {
    const [program = "", ...args] = line.trim().split(/\s+/);
    const rest = args.join(" ");
    const out = (text: string, art?: boolean): CommandResult => ({
        kind: "toast",
        toast: art
            ? { title: `:!${line.trim()}`, art: text }
            : info(text, `:!${line.trim()}`),
    });

    switch (program) {
        case "":
            return { kind: "toast", toast: error("E471: Argument required") };
        case "ls":
        case "dir":
            return out(
                args.some((arg) => arg.startsWith("-l")) || args.includes("-la")
                    ? LS_LONG
                    : LS,
                true,
            );
        case "pwd":
            return out(
                `/home/andrew${context.pathname === "/" ? "" : (context.pathname ?? "")}`,
            );
        case "whoami":
            return out("andrew");
        case "date":
            return out((context.now ?? new Date()).toString());
        case "echo":
            return out(rest || " ");
        case "cat":
            if (SECRET_FILES.has(rest)) {
                return {
                    kind: "toast",
                    toast: error(`cat: ${rest}: Permission denied`),
                    egg: "secrets",
                };
            }
            return out(
                rest ? `Use :e ${rest} to open files in this house.` : "meow",
            );
        case "sudo":
            return {
                kind: "toast",
                toast: error(
                    "andrew is not in the sudoers file. This incident will be reported.",
                ),
                egg: "root",
            };
        case "rm":
            return {
                kind: "toast",
                toast: error(
                    `rm: refusing to remove '${args.at(-1) ?? "/"}'. Also, rude.`,
                ),
                egg: "root",
            };
        case "neofetch":
        case "fastfetch":
        case "screenfetch":
            return { kind: "panel", panel: "neofetch", egg: "neofetch" };
        case "sl":
            return {
                kind: "overlay",
                overlay: "train",
                toast: info("You meant ls. The train came anyway.", ":!sl"),
                egg: "train",
            };
        case "cowsay":
            return {
                kind: "toast",
                toast: { title: ":!cowsay", art: cowsay(rest) },
                egg: "cowsay",
            };
        case "vim":
        case "nvim":
        case "vi":
            return out("You're already in Vim. Spiritually.");
        case "emacs":
            return {
                kind: "toast",
                toast: error("/bin/sh: emacs: not on this machine. Not ever."),
                egg: "emacs",
            };
        case "exit":
        case "logout":
            return { kind: "overlay", overlay: "goodbye", egg: "quit" };
        case "clear":
            return out("Cleared. There was nothing to clear.");
        case "git":
            return out(
                args[0] === "blame"
                    ? "Every line: andrew. Every bug: also andrew."
                    : "On branch main. Nothing to commit, working tree clean.",
            );
        default:
            return {
                kind: "toast",
                toast: error(`/bin/sh: ${program}: command not found`),
            };
    }
}

function set(option: string): CommandResult {
    switch (option) {
        case "nokeys":
        case "keys!":
            return { kind: "keys", enabled: false };
        case "keys":
            return { kind: "keys", enabled: true };
        case "background=light":
        case "bg=light":
            return {
                kind: "toast",
                toast: error(
                    "E474: Invalid argument: background=light. We don't do that here.",
                ),
                egg: "light",
            };
        case "background=dark":
        case "bg=dark":
            return { kind: "toast", toast: info("Already dark. Always dark.") };
        case "number":
        case "nu":
        case "relativenumber":
        case "rnu":
            return {
                kind: "toast",
                toast: info(
                    "Line numbers are already on in the README buffers.",
                ),
            };
        case "spell":
            return {
                kind: "toast",
                toast: info("Spell check found 0 typos. Probably."),
            };
        default:
            return {
                kind: "toast",
                toast: error(`E518: Unknown option: ${option || "(none)"}`),
            };
    }
}

function edit(file: string): CommandResult {
    if (!file) return { kind: "toast", toast: error("E32: No file name") };
    if (file === "." || file === "./" || file === "~") {
        return { kind: "panel", panel: "explore", egg: "explore" };
    }
    if (SECRET_FILES.has(file)) {
        return {
            kind: "toast",
            toast: error(`E484: Can't open file ${file} (nice try)`),
            egg: "secrets",
        };
    }
    if (file === "resume.pdf")
        return { kind: "open", href: EXTERNAL_LINKS.resume };
    const tab = findTab(file);
    return tab
        ? openTab(tab)
        : { kind: "toast", toast: error(`E484: Can't open file ${file}`) };
}

/** Run one command line (with or without the leading ":"). `null` for an empty line. */
export function runCommand(
    raw: string,
    context: CommandContext,
): CommandResult | null {
    const input = raw.trim().replace(/^:+/, "").trim();
    if (!input) return null;
    if (input.startsWith("/"))
        return { kind: "search", pattern: input.slice(1) };
    if (input.startsWith("!")) return shell(input.slice(1), context);
    if (/^%?s([/#|]).*/.test(input)) {
        return {
            kind: "toast",
            toast: error("E21: Cannot make changes, 'modifiable' is off"),
            egg: "substitute",
        };
    }

    const [command, ...rest] = input.split(/\s+/);
    const arg = rest.join(" ");
    const pathname = context.pathname;

    switch (command) {
        case "q":
        case "quit":
        case "qa":
        case "qall":
        case "close":
        case "clo":
            return {
                kind: "toast",
                toast: error(
                    "E37: No write since last change (add ! to override)",
                ),
                egg: "quit",
            };
        case "q!":
        case "quit!":
        case "qa!":
        case "qall!":
        case "cq":
            return { kind: "overlay", overlay: "goodbye", egg: "quit" };
        case "w":
        case "write":
        case "up":
        case "update":
            return {
                kind: "toast",
                toast: error(
                    "E45: 'readonly' option is set (add ! to override)",
                ),
            };
        case "wq":
        case "wq!":
        case "x":
        case "xa":
        case "xit":
        case "exit":
        case "wqa":
            return {
                kind: "toast",
                toast: error(
                    `E45: "${bufferName(pathname)}" is read-only, so you're staying.`,
                ),
                egg: "quit",
            };
        case "h":
        case "help":
            return help(arg);
        case "h!":
        case "help!":
            return {
                kind: "toast",
                toast: error("E478: Don't panic!"),
                egg: "panic",
            };
        case "Ni!":
        case "Ni":
            return {
                kind: "toast",
                toast: info("Do you demand a shrubbery?", ":Ni!"),
                egg: "shrubbery",
            };
        case "smile":
            return {
                kind: "toast",
                toast: { title: ":smile", art: SMILE },
                egg: "smile",
            };
        case "e":
        case "edit":
        case "tabe":
        case "tabedit":
        case "tabnew":
            return edit(arg);
        case "Ex":
        case "Explore":
        case "Sexplore":
        case "Vexplore":
        case "Lexplore":
            return { kind: "panel", panel: "explore", egg: "explore" };
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
        case "se":
            return set(arg);
        case "colorscheme":
        case "colo": {
            if (!arg) {
                const names = Object.keys(COLORSCHEMES)
                    .map((name) =>
                        name === (context.colorscheme ?? "default")
                            ? `${name}*`
                            : name,
                    )
                    .join("  ");
                return { kind: "toast", toast: info(names, ":colorscheme") };
            }
            const name = arg.toLowerCase().replace(/[\s-]/g, "");
            const resolved =
                name === "rosepine" || name === "rosé" ? "rosepine" : name;
            return isColorscheme(resolved)
                ? { kind: "colorscheme", name: resolved, egg: "colorscheme" }
                : {
                      kind: "toast",
                      toast: error(`E185: Cannot find color scheme '${arg}'`),
                  };
        }
        case "noh":
        case "nohl":
        case "nohlsearch":
            return { kind: "search", pattern: "" };
        case "sp":
        case "split":
        case "vs":
        case "vsplit":
        case "vnew":
        case "new":
            return {
                kind: "toast",
                toast: info("Already split. That's what the cards are."),
            };
        case "version":
        case "ve":
        case "ver":
            return {
                kind: "toast",
                toast: info(
                    "Next.js 16 · React 19 · Tailwind 4 · Figtree + JetBrains Mono · Flask on Render. Vim keys included.",
                    "andster.dev",
                ),
            };
        case "eggs":
            return arg === "reset"
                ? { kind: "eggs-reset" }
                : { kind: "panel", panel: "eggs" };
        case "emacs":
            return {
                kind: "toast",
                toast: error(
                    "E492: Not an editor command: emacs (and it never will be)",
                ),
                egg: "emacs",
            };
        case "vim":
        case "nvim":
        case "vi":
            return {
                kind: "toast",
                toast: info("You're already in Vim. Spiritually."),
            };
        default: {
            const tab = findTab(command);
            if (tab && !arg) return openTab(tab);
            const link = EXTERNAL_LINKS[command.toLowerCase()];
            if (link && !arg) return { kind: "open", href: link };
            return {
                kind: "toast",
                toast: error(`E492: Not an editor command: ${input}`),
            };
        }
    }
}

/** True when Vim would have said "Not an editor command" (so a suggestion can be tried instead). */
export function isUnknownCommand(result: CommandResult | null): boolean {
    return (
        result?.kind === "toast" &&
        result.toast.tone === "error" &&
        (result.toast.text ?? "").startsWith("E492")
    );
}

// ---------------------------------------------------------------------------
// Suggestions for the command palette (the public commands only: Easter eggs
// are for finding, not for listing)
// ---------------------------------------------------------------------------

export interface Suggestion {
    command: string;
    description: string;
}

const PUBLIC_COMMANDS: readonly Suggestion[] = [
    { command: "home", description: "Open home.md" },
    { command: "projects", description: "Open projects.md" },
    { command: "github", description: "Open GitHub" },
    { command: "linkedin", description: "Open LinkedIn" },
    { command: "resume", description: "Open the résumé (PDF)" },
    { command: "monkeytype", description: "Open the Monkeytype profile" },
    { command: "colorscheme", description: "Change the colors" },
    { command: "tabnext", description: "Next tab" },
    { command: "tabprevious", description: "Previous tab" },
    { command: "help", description: "Keys and commands" },
    { command: "version", description: "What this site runs on" },
    { command: "set nokeys", description: "Turn the single-key shortcuts off" },
    { command: "q", description: "Quit. Go on, try it." },
];

function fuzzy(needle: string, haystack: string): boolean {
    let at = 0;
    for (const char of needle) {
        at = haystack.indexOf(char, at);
        if (at === -1) return false;
        at += 1;
    }
    return true;
}

export function suggestCommands(
    raw: string,
    options: { eggsFound?: number; colorscheme?: ColorschemeName } = {},
): Suggestion[] {
    const input = raw.replace(/^:+/, "").trimStart().toLowerCase();
    const scheme = /^colo(?:rscheme)?\s+(.*)$/.exec(input);
    if (scheme) {
        return Object.entries(COLORSCHEMES)
            .filter(([name]) =>
                name.startsWith(scheme[1].replace(/[\s-]/g, "")),
            )
            .map(([name, { label }]) => ({
                command: `colorscheme ${name}`,
                description:
                    name === (options.colorscheme ?? "default")
                        ? `${label} (current)`
                        : label,
            }));
    }
    const file = /^(?:e|edit|tabe|tabedit)\s+(.*)$/.exec(input);
    if (file) {
        return ["home.md", "projects.md", "resume.pdf"]
            .filter((name) => name.startsWith(file[1]))
            .map((name) => ({
                command: `e ${name}`,
                description: "Open a file",
            }));
    }
    const commands = options.eggsFound
        ? [
              ...PUBLIC_COMMANDS.slice(0, -1),
              {
                  command: "eggs",
                  description: `Easter eggs found so far (${options.eggsFound})`,
              },
              PUBLIC_COMMANDS.at(-1)!,
          ]
        : PUBLIC_COMMANDS;
    if (!input) return [...commands];
    const prefixed = commands.filter((suggestion) =>
        suggestion.command.startsWith(input),
    );
    return prefixed.length
        ? prefixed
        : commands.filter((suggestion) => fuzzy(input, suggestion.command));
}
