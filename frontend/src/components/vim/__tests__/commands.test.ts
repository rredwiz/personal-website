import { describe, expect, it } from "vitest";
import {
    DEFAULT_MESSAGE,
    bufferName,
    cycleTab,
    runCommand,
    tabIndex,
} from "@/components/vim/commands";

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

describe("runCommand", () => {
    it("ignores empty lines", () => {
        expect(runCommand("", "/")).toBeNull();
        expect(runCommand(":  ", "/")).toBeNull();
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
        expect(runCommand(input, "/")).toMatchObject({
            kind: "navigate",
            href,
        });
    });

    it("opens profile links", () => {
        expect(runCommand("github", "/")).toMatchObject({
            kind: "open",
            href: "https://github.com/rredwiz",
        });
        expect(runCommand("resume", "/")).toMatchObject({
            kind: "open",
            href: "/Andrew-Dutka-Resume.pdf",
        });
    });

    it("answers like Vim", () => {
        expect(runCommand("q", "/")).toMatchObject({
            kind: "message",
            error: true,
            text: expect.stringMatching(/^E37/),
        });
        expect(runCommand("q!", "/")).toMatchObject({ kind: "message" });
        expect(runCommand("wq", "/projects")).toMatchObject({
            text: expect.stringContaining("~/projects.md"),
        });
        expect(runCommand("e", "/")).toMatchObject({
            text: "E32: No file name",
        });
        expect(runCommand("e secrets.txt", "/")).toMatchObject({
            text: "E484: Can't open file secrets.txt",
        });
        expect(runCommand("frobnicate now", "/")).toMatchObject({
            text: "E492: Not an editor command: frobnicate now",
        });
        expect(runCommand("help", "/")).toEqual({ kind: "help" });
    });

    it("turns the single-key shortcuts on and off", () => {
        expect(runCommand("set nokeys", "/")).toEqual({
            kind: "keys",
            enabled: false,
        });
        expect(runCommand("set keys", "/")).toEqual({
            kind: "keys",
            enabled: true,
        });
        expect(runCommand("set wrap", "/")).toMatchObject({
            text: "E518: Unknown option: wrap",
        });
    });

    it("keeps the joke as the resting message", () => {
        expect(DEFAULT_MESSAGE).toBe("This site owner is extremely cool.");
    });
});
