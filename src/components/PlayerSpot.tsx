import React from 'react';
import Card from './Card';

const PlayerSpot = ({ player, isMe, onAction, id, isDealer }: any) => {
    const { name, tokens, hand, bet, status, revealed } = player;

    // Status badge color
    const getStatusColor = (s) => {
        switch (s) {
            case 'waiting': return 'bg-gray-500';
            case 'ready': return 'bg-yellow-500'; // Bet placed
            case 'playing': return 'bg-green-500';
            case 'standing': return 'bg-blue-600';
            case 'settled - win': return 'bg-yellow-400 text-black border-2 border-yellow-200';
            case 'settled - lose': return 'bg-gray-800 text-white';
            case 'settled - draw': return 'bg-gray-400';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div id={id} className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${isMe ? 'bg-red-900/40 border-2 border-yellow-400' : 'bg-black/30 border border-white/10'} ${isDealer ? 'scale-110 mb-8' : ''}`}>
            {/* Role / Status Badge */}
            <div className={`absolute -top-3 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${isDealer ? 'bg-yellow-500 text-black' : getStatusColor(status)}`}>
                {isDealer ? 'Nhà Cái' : status}
            </div>

            {/* Name & Tokens */}
            <div className="text-center mb-2">
                <div className="font-bold text-white text-lg drop-shadow-md">{name} {isMe && '(Bạn)'}</div>
                <div className="text-yellow-300 font-mono text-sm flex items-center justify-center gap-1">
                    <span>🪙</span> {tokens.toLocaleString()}
                </div>
                {!isDealer && bet > 0 && (
                    <div className="text-xs text-green-400 mt-1">Cược: {bet.toLocaleString()}</div>
                )}
            </div>

            {/* Cards Area */}
            <div className="flex gap-[-2rem] items-center justify-center h-28 w-full">
                <div className="flex gap-2 relative">
                    {hand.map((card, idx) => (
                        <div key={idx} className={`transform ${idx > 0 ? '-ml-8' : ''} hover:z-10 transition-all`}>
                            {/* Hide if not me, not revealed, and not dealer (or dealer hidden logic) 
                        Actually server sends everything for now, so we hide here if needed.
                        For now assume open hand for "me" and closed for others unless revealed.
                        Wait, Xì dách: everyone sees their own cards. 
                        Dealer sees their own. Others see backs.
                    */}
                            <Card
                                suit={card.suit}
                                rank={card.rank}
                                hidden={!isMe && !revealed && !player.isDealer && status !== 'settled - win' && status !== 'settled - lose' && status !== 'settled - draw'}
                            // Simplified visibility logic: 
                            // If it's me -> show
                            // If it's settled -> show
                            // If it's revealed -> show
                            // If it's dealer -> hide until settled or specific logic? 
                            //   Actually dealer has one up one down usually? Or fully hidden? 
                            //   In VN Xì dách, dealer holds cards hidden.
                            />
                        </div>
                    ))}
                    {hand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/20 text-xs">Trống</div>}
                </div>
            </div>
        </div>
    );
};

export default PlayerSpot;
