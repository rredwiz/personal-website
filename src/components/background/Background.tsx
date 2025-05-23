import Silk from "./Silk";

export default function Background() {
    return (
        <div className="h-screen w-screen absolute inset-0 z-[-1]">
            <Silk
                speed={5}
                scale={0.6}
                color="#232323" //121212 dark
                noiseIntensity={0.2}
                rotation={2.18}
            />
        </div>
    );
}
