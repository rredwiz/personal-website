import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";

afterEach(() => {
    cleanup();
});

type MockImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string | { src: string };
    priority?: boolean;
    fill?: boolean;
    unoptimized?: boolean;
};

// next/image needs the Next.js runtime; a plain <img> is enough to assert on.
vi.mock("next/image", () => ({
    default: ({ src, alt, ...rest }: MockImageProps) => {
        // Next-only props would be meaningless (and warn) on a DOM element.
        delete rest.priority;
        delete rest.fill;
        delete rest.unoptimized;
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={typeof src === "string" ? src : src.src} alt={alt ?? ""} {...rest} />;
    },
}));

type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string | { pathname?: string };
    children?: ReactNode;
};

// next/link renders an <a>; the router isn't needed for these components.
vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: MockLinkProps) => (
        <a href={typeof href === "string" ? href : (href.pathname ?? "")} {...rest}>
            {children}
        </a>
    ),
}));

// jsdom has no matchMedia; motion's useReducedMotion and similar need it.
if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}
