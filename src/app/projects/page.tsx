import React from "react";
import Image from "next/image";
import Nav from "@/components/navigation/Nav";

export default function ProjectsPage() {
    return (
        <main>
            <div className="flex justify-center items-center h-screen w-screen">
                <div className="flex relative m-8 flex-col md:grid md:grid-cols-3 gap-4 w-3xl">
                    <Nav className="absolute top-[-60] left-[50%] transition-opacity duration-1000 delay-1000 ease-in-out translate-x-[-50%]" />
                    <div className="flex p-4 col-span-3 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        {/* some div here */}
                    </div>
                    <div className="flex p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        {/* some div here */}
                    </div>
                    <div className="flex p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        {/* some div here */}
                    </div>
                    <div className="flex p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        {/* some div here */}
                    </div>
                </div>
            </div>
        </main>
    );
}
