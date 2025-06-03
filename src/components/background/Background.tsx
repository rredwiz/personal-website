"use client";
import Silk from "./Silk";
import { useEffect, useState } from "react";

export default function Background() {
    const [isVisible, setIsVisible] = useState(false);
    const [transitionState, setTransition] = useState(false);

    useEffect(() => {
        // waiting for browser to load before setting transition properties
        setTimeout(() => {
            document.body.classList.remove("bg-[#232323]");
            setTransition(true);
            setIsVisible(true);
        }, 200);
    }, []);
    return (
        <div
            className={`${isVisible ? "opacity-100" : "opacity-0"} ${
                transitionState ? "transition-opacity" : "transition-none"
            } h-screen w-screen absolute inset-0 z-[-1] duration-2000 ease-in-out`}
        >
            <Silk
                speed={5}
                scale={0.6}
                color="#232323" //121212 dark
                noiseIntensity={0.1}
                rotation={2.18}
            />
        </div>
    );
}
