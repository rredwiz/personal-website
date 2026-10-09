import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Social preview card, rendered once at build time.
export const alt = "Andrew Dutka, CS student & developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADLINE = "Hey, I'm Andrew.";
const ROLE = "CS Student & Developer";
const FOOTER = "andster.dev · Nova Scotia, Canada";

/**
 * Fetch just the glyphs we need from Google Fonts as TTF (what the image
 * renderer understands). Returns null on any failure so an offline build still
 * produces an image, just in the default font.
 */
async function loadGoogleFont(
    family: string,
    weight: number,
    text: string,
): Promise<ArrayBuffer | null> {
    try {
        const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
            family,
        )}:wght@${weight}&text=${encodeURIComponent(text)}`;
        const css = await (await fetch(cssUrl)).text();
        const fontUrl = css.match(
            /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
        )?.[1];
        if (!fontUrl) return null;
        const response = await fetch(fontUrl);
        return response.ok ? await response.arrayBuffer() : null;
    } catch {
        return null;
    }
}

export default async function OpengraphImage() {
    const [avatar, display, body] = await Promise.all([
        readFile(join(process.cwd(), "public/pixierou.png")),
        loadGoogleFont("JetBrains Mono", 700, HEADLINE),
        loadGoogleFont("JetBrains Mono", 400, ROLE + FOOTER),
    ]);
    const avatarSrc = `data:image/png;base64,${avatar.toString("base64")}`;
    // Fonts are subset to their own text, so use both or neither: a lone
    // subset would otherwise get picked for the glyphs it happens to contain.
    const fonts =
        display && body
            ? [
                  { name: "Display", data: display, weight: 700 as const },
                  { name: "Body", data: body, weight: 400 as const },
              ]
            : undefined;

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: 64,
                padding: "0 96px",
                backgroundColor: "#0a0c0f",
                color: "#c7cbd0",
            }}
        >
            {/* 256 px is the sprite's native size, so no smoothing. */}
            <img src={avatarSrc} width={256} height={256} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                    style={{
                        display: "flex",
                        fontSize: 76,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        fontFamily: fonts ? "Display" : undefined,
                    }}
                >
                    Hey, I&apos;m
                    {/* one monospace space: JetBrains Mono advances are 0.6em */}
                    <span style={{ color: "#ffffff", marginLeft: "0.6em" }}>
                        Andrew
                    </span>
                    .
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: 14,
                        fontSize: 42,
                        color: "#9ea4ab",
                        fontFamily: fonts ? "Body" : undefined,
                    }}
                >
                    {ROLE}
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: 44,
                        fontSize: 28,
                        color: "#80878f",
                        fontFamily: fonts ? "Body" : undefined,
                    }}
                >
                    {FOOTER}
                </div>
            </div>
        </div>,
        { ...size, fonts },
    );
}
