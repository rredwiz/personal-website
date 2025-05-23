import Background from "./components/background/Background";
import ImageIcon from "./assets/images/ImageIcon.png";
import location from "./assets/images/location-icon.svg";

function App() {
    return (
        <>
            <div className="flex justify-center items-center w-full h-screen">
                <Background />
                <div className="grid grid-cols-3 gap-4 w-3xl">
                    <div className="text-2xl text-white p-4 col-span-1 bg-black/25 h-50 rounded-xl shadow-md border border-gray-500/25">
                        <img
                            src={ImageIcon}
                            className="mb-2 rounded-full w-20"
                        />
                        Hey, I'm <span className="font-semibold">Andrew</span>!
                        <p className="text-sm text-gray-400">
                            CS Student & Developer
                        </p>
                        <div className="flex mt-2 gap-1">
                            <img src={location} className="w-4" />
                            <p className="text-sm text-gray-400">
                                Nova Scotia, Canada
                            </p>
                        </div>
                    </div>
                    <div className="font-inter p-4 col-span-2 bg-black/25 h-50 rounded-xl shadow-md border border-gray-500/25"></div>
                </div>
            </div>
        </>
    );
}

export default App;
