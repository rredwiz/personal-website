"use client";
import { Component, ReactNode, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import Silk from "./Silk";
import { supportsWebGL } from "@/lib/webgl";
import { BASE_COLOR } from "@/lib/theme";

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

export default function Background({ children }: { children?: ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);
    const [transitionEnabled, setTransitionEnabled] = useState(false);
    const [canRenderSilk, setCanRenderSilk] = useState(false);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        // Wait for the first paint before mounting the shader and enabling the
        // opacity transition, so the canvas fades in rather than flashing.
        const timer = window.setTimeout(() => {
            // The <body> background would otherwise paint over this z-[-1] layer.
            document.body.classList.remove("bg-[#232323]");
            setCanRenderSilk(supportsWebGL());
            setTransitionEnabled(true);
            setIsVisible(true);
        }, FADE_IN_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <div
            className={`${isVisible ? "opacity-100" : "opacity-0"} ${
                transitionEnabled ? "transition-opacity" : "transition-none"
            } min-w-screen absolute inset-0 z-[-1] duration-2000 ease-in-out`}
            aria-hidden="true"
        >
            {children}
            {canRenderSilk && (
                <SilkErrorBoundary>
                    <Silk
                        speed={reducedMotion ? 0 : 5}
                        frameloop={reducedMotion ? "demand" : "always"}
                        scale={0.6}
                        color={BASE_COLOR}
                        noiseIntensity={0.1}
                        rotation={2.18}
                    />
                </SilkErrorBoundary>
            )}
        </div>
    );
}
