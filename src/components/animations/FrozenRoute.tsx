// forcing the component's rendered output to be based on its initial state rather than current
// this fixes nextjs routing behavior with motion
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReactNode, useContext, useRef } from "react";

export default function FrozenRoute({ children }: { children: ReactNode }) {
    const context = useContext(LayoutRouterContext);
    const frozen = useRef(context).current;

    return (
        <LayoutRouterContext.Provider value={frozen}>
            {children}
        </LayoutRouterContext.Provider>
    );
}
