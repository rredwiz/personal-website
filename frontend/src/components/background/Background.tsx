"use client";
import { Component, ReactNode, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import Silk from "./Silk";
import { supportsWebGL } from "@/lib/webgl";
import { COLORSCHEMES, colorscheme } from "@/components/vim/colorschemes";
import { cx } from "@/lib/cx";

/** Delay before fading the shader in, so the first paint is the flat base colour. */
const FADE_IN_DELAY_MS = 200;

/**
 * If the shader throws (GPU blocklisted, context lost at startup, ...) we keep
 * the flat background instead of taking the whole page down with it.
 */
class SilkErrorBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: unknown) {
        console.warn(
            "Animated background failed to initialise; using a flat background instead.",
            error,
        );
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

/**
 * Fixed, viewport-sized layer behind the page. <body> is `isolate`, so this
 * negative z-index layer paints above the body's own background without any
 * class juggling.
 */
export default function Background() {
    const [isVisible, setIsVisible] = useState(false);
    const [canRenderSilk, setCanRenderSilk] = useState(false);
    const reducedMotion = useReducedMotion();
    const scheme = colorscheme.useValue();

    useEffect(() => {
        // Mount the shader after the first paint, then fade it in.
        const timer = window.setTimeout(() => {
            setCanRenderSilk(supportsWebGL());
            setIsVisible(true);
        }, FADE_IN_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <div
            aria-hidden="true"
            className={cx(
                "pointer-events-none fixed inset-0 -z-10 transition-opacity duration-[1600ms] ease-out",
                isVisible ? "opacity-100" : "opacity-0",
            )}
        >
            {canRenderSilk && (
                <SilkErrorBoundary>
                    <Silk
                        speed={reducedMotion ? 0 : 4}
                        frameloop={reducedMotion ? "demand" : "always"}
                        scale={0.6}
                        color={COLORSCHEMES[scheme].silk}
                        noiseIntensity={0.12}
                        rotation={2.18}
                    />
                </SilkErrorBoundary>
            )}
        </div>
    );
}
