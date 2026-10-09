/** Join class names, skipping falsy values: `cx("a", cond && "b")`. */
export function cx(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(" ");
}
