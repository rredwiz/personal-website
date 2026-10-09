import Image from "next/image";
import { cx } from "@/lib/cx";

/** pixierou.png is a 16×16 sprite stored at 16× (256 px). */
const SPRITE_SIZE = 16;

/**
 * The pixel-art avatar, drawn at a whole multiple of the sprite size with
 * nearest-neighbour scaling so every pixel stays crisp. Served as-is
 * (`unoptimized`): the 2.6 KB original beats any resampled variant.
 */
export default function Avatar({
    scale = 5,
    preload = false,
    className,
}: {
    scale?: 4 | 5 | 6;
    preload?: boolean;
    className?: string;
}) {
    const size = SPRITE_SIZE * scale;
    return (
        <Image
            src="/pixierou.png"
            width={size}
            height={size}
            alt="Andrew's Minecraft character"
            unoptimized
            preload={preload}
            className={cx(
                "shrink-0 [image-rendering:pixelated] drop-shadow-[0_6px_14px_rgb(0_0_0/0.5)]",
                className,
            )}
            style={{ width: size, height: size }}
        />
    );
}
