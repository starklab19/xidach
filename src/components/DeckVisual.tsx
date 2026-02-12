
"use client";

import { useMemo } from "react";

export default function DeckVisual({ cardsRemaining }) {
    // Determine visuals based on cards remaining
    // 52 cards max.
    // Calculate visual thickness
    const thickness = Math.ceil(cardsRemaining / 5) * 2; // px

    return (
        <div className="relative w-24 h-36 bg-red-900 rounded-lg border-2 border-white/20 shadow-[-10px_10px_20px_rgba(0,0,0,0.5)] transform -rotate-6 transition-all duration-300">
            {/* Stack effect */}
            {Array.from({ length: Math.min(5, Math.ceil(cardsRemaining / 10)) }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full h-full bg-red-800 rounded-lg border border-white/10"
                    style={{
                        top: `-${(i + 1) * 2}px`,
                        left: `${(i + 1) * 1}px`,
                        zIndex: -i
                    }}
                />
            ))}

            {/* Top Card */}
            <div className="absolute inset-0 bg-red-600 rounded-lg border-2 border-white/50 flex items-center justify-center overflow-hidden">
                {/* Pattern */}
                <div className="opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] w-full h-full"></div>
                <div className="absolute text-5xl text-yellow-500 opacity-50">🧧</div>
                <div className="absolute bottom-2 right-2 text-white/80 text-xs font-bold">{cardsRemaining}</div>
            </div>
        </div>
    );
}
