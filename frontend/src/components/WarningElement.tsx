import Image from "next/image";

export default function WarningElement({ className }: { className?: string }) {
    return (
        <div className={className}>
            <div className="flex gap-2 justify-center items-center bg-white/5 rounded-xl p-1 px-2">
                <Image
                    src="/infobyte.svg"
                    className="w-5"
                    height={20}
                    width={20}
                    alt=""
                    aria-hidden="true"
                />
                <p className="text-xs">This site owner is extremely cool.</p>
            </div>
        </div>
    );
}
