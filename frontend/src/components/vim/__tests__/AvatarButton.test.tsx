import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AvatarButton from "@/components/vim/AvatarButton";
import { KONAMI_EVENT } from "@/components/vim/events";
import { foundEggs, resetEggs } from "@/components/vim/eggs";

describe("AvatarButton", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        window.localStorage.clear();
        resetEggs();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("talks back and unlocks an egg after five pokes", () => {
        render(<AvatarButton />);
        const avatar = screen.getByRole("button", {
            name: "Poke Andrew's avatar",
        });
        for (let poke = 1; poke <= 3; poke++) fireEvent.click(avatar);
        expect(screen.getByRole("status")).toHaveTextContent("hi!");
        fireEvent.click(avatar);
        fireEvent.click(avatar);
        expect(foundEggs.get()).toContain("avatar");
        act(() => {
            vi.advanceTimersByTime(2500);
        });
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("spins for the Konami code", () => {
        const { container } = render(<AvatarButton />);
        act(() => {
            window.dispatchEvent(new Event(KONAMI_EVENT));
        });
        expect(container.querySelector(".rotate-\\[360deg\\]")).not.toBeNull();
        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(container.querySelector(".rotate-\\[360deg\\]")).toBeNull();
    });
});
