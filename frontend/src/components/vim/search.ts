"use client";

/**
 * `/pattern`, `n`, `N`: page search drawn with the CSS Custom Highlight API,
 * so React's DOM is never modified. Smartcase like Vim: case-insensitive
 * unless the pattern has a capital letter.
 */

const ALL = "vim-search";
const CURRENT = "vim-search-current";

export function canHighlight(): boolean {
    return (
        typeof CSS !== "undefined" &&
        "highlights" in CSS &&
        typeof Highlight !== "undefined"
    );
}

function searchable(node: Node): boolean {
    const parent = node.parentElement;
    if (!parent) return false;
    // Skip decoration (line numbers, tildes, icons) and anything not rendered.
    if (parent.closest("script, style, [aria-hidden='true'], [hidden]")) {
        return false;
    }
    return parent.getClientRects().length > 0;
}

/** Ranges for every match of `pattern` under `root`. */
export function findMatches(root: Node, pattern: string): Range[] {
    if (!pattern) return [];
    const caseSensitive = /[A-Z]/.test(pattern);
    const needle = caseSensitive ? pattern : pattern.toLowerCase();
    const ranges: Range[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        if (!text.trim() || !searchable(node)) continue;
        const haystack = caseSensitive ? text : text.toLowerCase();
        for (
            let at = haystack.indexOf(needle);
            at !== -1;
            at = haystack.indexOf(needle, at + needle.length)
        ) {
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + needle.length);
            ranges.push(range);
        }
    }
    return ranges;
}

export function paintMatches(ranges: Range[], current: number): void {
    if (!canHighlight()) return;
    CSS.highlights.set(ALL, new Highlight(...ranges));
    if (ranges[current]) {
        CSS.highlights.set(CURRENT, new Highlight(ranges[current]));
    } else {
        CSS.highlights.delete(CURRENT);
    }
}

export function clearMatches(): void {
    if (!canHighlight()) return;
    CSS.highlights.delete(ALL);
    CSS.highlights.delete(CURRENT);
}

export function revealMatch(range: Range, behavior: ScrollBehavior): void {
    const rect = range.getBoundingClientRect();
    const margin = window.innerHeight * 0.3;
    if (rect.top < margin || rect.bottom > window.innerHeight - margin) {
        window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight / 2,
            behavior,
        });
    }
}
