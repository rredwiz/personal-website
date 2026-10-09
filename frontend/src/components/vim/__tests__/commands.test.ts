import { describe, expect, it } from "vitest";
import {
    DEFAULT_MESSAGE,
    bufferName,
    cowsay,
    cycleTab,
    isUnknownCommand,
    runCommand,
    suggestCommands,
    tabIndex,
} from "@/components/vim/commands";

const home = { pathname: "/" };

describe("tabs and buffer names", () => {
    it("maps routes to tabs and names unknown paths like a new file", () => {
        expect(tabIndex("/")).toBe(0);
        expect(tabIndex("/projects")).toBe(1);
        expect(tabIndex("/projects/x")).toBe(1);
        expect(tabIndex("/nope")).toBe(-1);
        expect(bufferName("/")).toBe("~/home.md");
        expect(bufferName("/projects")).toBe("~/projects.md");
        expect(bufferName("/nope")).toBe("~/nope [New]");
    });

    it("cycles tabs in both directions, wrapping around", () => {
        expect(cycleTab("/", 1).href).toBe("/projects");
        expect(cycleTab("/projects", 1).href).toBe("/");
        expect(cycleTab("/", -1).href).toBe("/projects");
        expect(cycleTab("/nope", 1).href).toBe("/projects");
    });
});

describe("runCommand: the everyday ones", () => {
    it("ignores empty lines", () => {
        expect(runCommand("", home)).toBeNull();
        expect(runCommand(":  ", home)).toBeNull();
    });

    it.each([
        ["projects", "/projects"],
        [":projects", "/projects"],
        ["e projects.md", "/projects"],
        ["tabe ~/home.md", "/"],
        ["home", "/"],
        ["tabn", "/projects"],
        ["tabp", "/projects"],
        ["tabfirst", "/"],
        ["tablast", "/projects"],
    ])(":%s from home navigates to %s", (input, href) => {
        expect(runCommand(input, home)).toMatchObject({
            kind: "navigate",
            href,
        });
    });

    it("opens profile links and the résumé", () => {
        expect(runCommand("github", home)).toMatchObject({
            kind: "open",
            href: "https://github.com/rredwiz",
        });
        expect(runCommand("e resume.pdf", home)).toMatchObject({
            kind: "open",
            href: "/Andrew-Dutka-Resume.pdf",
        });
    });

    it("changes and lists colorschemes", () => {
        expect(runCommand("colorscheme gruvbox", home)).toEqual({
            kind: "colorscheme",
            name: "gruvbox",
            egg: "colorscheme",
        });
        expect(runCommand("colo rose-pine", home)).toMatchObject({
            name: "rosepine",
        });
        expect(
            runCommand("colo", { ...home, colorscheme: "nord" }),
        ).toMatchObject({
            kind: "toast",
            toast: { text: expect.stringContaining("nord*") },
        });
        expect(runCommand("colo vaporwave", home)).toMatchObject({
            toast: { text: "E185: Cannot find color scheme 'vaporwave'" },
        });
    });

    it("searches and clears searches", () => {
        expect(runCommand("/student", home)).toEqual({
            kind: "search",
            pattern: "student",
        });
        expect(runCommand("noh", home)).toEqual({
            kind: "search",
            pattern: "",
        });
    });

    it("turns the single-key shortcuts on and off", () => {
        expect(runCommand("set nokeys", home)).toEqual({
            kind: "keys",
            enabled: false,
        });
        expect(runCommand("set keys", home)).toEqual({
            kind: "keys",
            enabled: true,
        });
        expect(runCommand("set wrap", home)).toMatchObject({
            toast: { text: "E518: Unknown option: wrap" },
        });
    });

    it("reports unknown commands the way Vim does", () => {
        const result = runCommand("frobnicate now", home);
        expect(result).toMatchObject({
            toast: { text: "E492: Not an editor command: frobnicate now" },
        });
        expect(isUnknownCommand(result)).toBe(true);
        expect(isUnknownCommand(runCommand("q", home))).toBe(false);
    });

    it("keeps the joke as the resting message", () => {
        expect(DEFAULT_MESSAGE).toBe("This site owner is extremely cool.");
    });
});

describe("runCommand: Easter eggs", () => {
    it.each([
        ["q", "quit", "E37"],
        ["wq", "quit", "E45"],
        ["help!", "panic", "E478: Don't panic!"],
        ["%s/foo/bar/g", "substitute", "E21"],
        ["s#a#b#", "substitute", "E21"],
        ["e secrets.txt", "secrets", "E484"],
        ["!cat .env", "secrets", "Permission denied"],
        ["!sudo rm -rf /", "root", "sudoers"],
        ["!rm -rf /", "root", "rude"],
        ["set background=light", "light", "E474"],
        ["emacs", "emacs", "E492"],
    ])(":%s unlocks %s with an error toast", (input, egg, text) => {
        expect(runCommand(input, home)).toMatchObject({
            kind: "toast",
            egg,
            toast: { tone: "error", text: expect.stringContaining(text) },
        });
    });

    it.each([
        ["help 42", "help42"],
        ["help holy-grail", "grail"],
        ["Ni!", "shrubbery"],
        ["smile", "smile"],
        ["!cowsay hello", "cowsay"],
    ])(":%s unlocks %s", (input, egg) => {
        expect(runCommand(input, home)).toMatchObject({ kind: "toast", egg });
    });

    it("opens panels and overlays", () => {
        expect(runCommand("Ex", home)).toEqual({
            kind: "panel",
            panel: "explore",
            egg: "explore",
        });
        expect(runCommand("e .", home)).toMatchObject({ panel: "explore" });
        expect(runCommand("!neofetch", home)).toEqual({
            kind: "panel",
            panel: "neofetch",
            egg: "neofetch",
        });
        expect(runCommand("q!", home)).toEqual({
            kind: "overlay",
            overlay: "goodbye",
            egg: "quit",
        });
        expect(runCommand("!sl", home)).toMatchObject({
            kind: "overlay",
            overlay: "train",
            egg: "train",
        });
        expect(runCommand("eggs", home)).toEqual({
            kind: "panel",
            panel: "eggs",
        });
        expect(runCommand("eggs reset", home)).toEqual({
            kind: "eggs-reset",
        });
    });

    it("has a small, honest shell", () => {
        expect(runCommand("!whoami", home)).toMatchObject({
            toast: { text: "andrew" },
        });
        expect(runCommand("!pwd", { pathname: "/projects" })).toMatchObject({
            toast: { text: "/home/andrew/projects" },
        });
        expect(runCommand("!ls", home)).toMatchObject({
            toast: { art: expect.stringContaining("secrets.txt") },
        });
        expect(
            runCommand("!date", {
                pathname: "/",
                now: new Date("2026-10-09T12:00:00Z"),
            }),
        ).toMatchObject({ toast: { text: expect.stringContaining("2026") } });
        expect(runCommand("!fortune", home)).toMatchObject({
            toast: { text: "/bin/sh: fortune: command not found" },
        });
        expect(runCommand("!", home)).toMatchObject({
            toast: { text: "E471: Argument required" },
        });
    });

    it("draws a cow that fits its message", () => {
        const art = cowsay("moo moo");
        expect(art).toContain("< moo moo >");
        expect(art.split("\n")[0]).toBe(` ${"_".repeat(9)}`);
        expect(cowsay("")).toContain("< moo >");
    });
});

describe("suggestCommands", () => {
    it("lists public commands and filters by prefix, then fuzzily", () => {
        expect(suggestCommands("").map((s) => s.command)).toContain("projects");
        expect(suggestCommands("proj").map((s) => s.command)).toEqual([
            "projects",
        ]);
        expect(suggestCommands("lnkdn").map((s) => s.command)).toEqual([
            "linkedin",
        ]);
    });

    it("keeps the Easter eggs secret", () => {
        const all = suggestCommands("").map((s) => s.command);
        for (const secret of ["smile", "Ni!", "Ex", "eggs", "!sl"]) {
            expect(all).not.toContain(secret);
        }
    });

    it("offers :eggs once one has been found", () => {
        expect(
            suggestCommands("", { eggsFound: 3 }).map((s) => s.command),
        ).toContain("eggs");
    });

    it("completes colorschemes and files", () => {
        expect(
            suggestCommands("colo g", { colorscheme: "default" }).map(
                (s) => s.command,
            ),
        ).toEqual(["colorscheme gruvbox"]);
        expect(
            suggestCommands("colorscheme ", { colorscheme: "nord" }).find(
                (s) => s.command === "colorscheme nord",
            )?.description,
        ).toContain("(current)");
        expect(suggestCommands("e pro").map((s) => s.command)).toEqual([
            "e projects.md",
        ]);
    });
});
