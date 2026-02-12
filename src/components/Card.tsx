import React from 'react';

const Card = ({ suit, rank, hidden = false }: any) => {
    if (hidden) {
        return (
            <div className="w-16 h-24 bg-red-700 rounded-lg border-2 border-white shadow-lg flex items-center justify-center transform hover:-translate-y-1 transition-transform">
                <div className="text-white text-3xl opacity-20">?</div>
            </div>
        );
    }

    const isRed = suit === '♥' || suit === '♦';

    return (
        <div className="w-16 h-24 bg-white rounded-lg border border-gray-200 shadow-md flex flex-col justify-between p-1 select-none transform hover:-translate-y-2 transition-transform">
            <div className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
                {rank}
            </div>
            <div className={`text-2xl text-center ${isRed ? 'text-red-600' : 'text-black'}`}>
                {suit}
            </div>
            <div className={`text-sm font-bold transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
                {rank}
            </div>
        </div>
    );
};

export default Card;
