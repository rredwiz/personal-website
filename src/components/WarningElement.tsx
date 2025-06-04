import React, { ReactNode } from "react";
import Image from "next/image";

export default function WarningElement({
    className,
}: {
    className?: ReactNode;
}) {
    return (
        <div className={`${className}`}>
            <div className="flex gap-2 justify-center items-center bg-white/5 rounded-xl p-1 px-2">
                <Image
                    src="/infobyte.svg"
                    className="w-5"
                    height={20}
                    width={20}
                    alt="info icon"
                />
                <p className="text-xs md:text-md">
                    This site is still a work in progress.
                </p>
            </div>
        </div>
    );
}
