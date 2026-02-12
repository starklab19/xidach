"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import PlayerSpot from "@/components/PlayerSpot";
import BankruptcyModal from "@/components/BankruptcyModal";
import DeckVisual from "@/components/DeckVisual";
import { useRef } from "react";

let socket: any;

export default function Home() {
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState<any>(null);
    const [players, setPlayers] = useState<any>({});
    const [myId, setMyId] = useState<any>(null);
    const [enteredName, setEnteredName] = useState("");
    const [isInGame, setIsInGame] = useState(false);
    const [betAmount, setBetAmount] = useState(100);

    const [flyingCards, setFlyingCards] = useState<any[]>([]);
    const prevPlayersRef = useRef({});

    useEffect(() => {
        // Only init socket once
        if (!socket) {
            socket = io();
        }

        socket.on("connect", () => {
            setConnected(true);
            setMyId(socket.id);
        });

        socket.on("gameState", (state: any) => {
            setGameState(state);
        });

        socket.on("playerUpdate", (p: any) => {
            setPlayers(prev => {
                prevPlayersRef.current = prev;
                return p;
            });
        });

        socket.on("error", (msg: any) => {
            alert(msg);
        });

        return () => {
            socket.off("connect");
            socket.off("gameState");
            socket.off("playerUpdate");
            socket.off("error");
        };
    }, []);

    // Animation Effect
    useEffect(() => {
        const prevPlayers = prevPlayersRef.current;
        if (!prevPlayers) return;

        Object.keys(players).forEach(pid => {
            const oldHand = prevPlayers[pid]?.hand || [];
            const newHand = players[pid]?.hand || [];

            if (newHand.length > oldHand.length) {
                // New card added! Trigger animation
                const deckEl = document.getElementById("deck-spot");
                const playerEl = document.getElementById(`player-spot-${pid}`);

                if (deckEl && playerEl) {
                    const deckRect = deckEl.getBoundingClientRect();
                    const playerRect = playerEl.getBoundingClientRect();

                    const newCard = {
                        id: Date.now() + Math.random(),
                        startX: deckRect.left,
                        startY: deckRect.top,
                        endX: playerRect.left + playerRect.width / 2 - 20, // Center-ish
                        endY: playerRect.top + playerRect.height / 2 - 30,
                    };

                    setFlyingCards(prev => [...prev, newCard]);

                    // Remove after animation
                    setTimeout(() => {
                        setFlyingCards(prev => prev.filter(c => c.id !== newCard.id));
                    }, 600);
                }
            }
        });
    }, [players]);

    const handleJoin = () => {
        if (!enteredName.trim()) return;
        socket.emit("join", { name: enteredName });
        setIsInGame(true);
    };

    const handleBet = () => {
        if (betAmount > myPlayer.tokens) {
            alert("Không đủ tiền má ơi! Bớt lại đi!");
            return;
        }
        socket.emit("bet", parseInt(betAmount));
    };

    const handleStart = () => {
        socket.emit("startRound");
    };

    const handleDeal = () => {
        socket.emit("deal");
    };

    const handleHit = () => {
        socket.emit("hit");
    };

    const handleStand = () => {
        socket.emit("stand");
    };

    const handleCheck = (targetId: any) => {
        socket.emit("dealerCheck", targetId);
    };

    const handleSetTurn = (targetId: any) => {
        socket.emit("setTurn", targetId);
    }

    const handleBorrow = (amount: any) => {
        socket.emit("borrow", amount);
    };

    const handleReplace = (name: any) => {
        socket.emit("replacePlayer", name);
    };

    const handleTransfer = (targetId: any) => {
        socket.emit("transferDealer", targetId);
    };

    const handleSetMode = (mode: any) => {
        socket.emit("setDealerMode", mode);
    };

    // Derived state
    const myPlayer = players[myId];
    const isDealer = myPlayer?.isDealer;
    const dealerId = gameState?.dealerId;
    const dealer = players[dealerId];
    const otherPlayers = Object.values(players).filter((p: any) => !p.isDealer);
    const actingPlayerId = gameState?.actingPlayerId;
    const dealerMode = gameState?.dealerMode || "FIXED";

    // Leaderboard Data
    const sortedPlayers = Object.values(players).sort((a: any, b: any) => b.tokens - a.tokens);

    if (!isInGame) {
        return (
            <main className="min-h-screen bg-red-800 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-yellow-500">
                    <h1 className="text-4xl font-black text-red-600 mb-2">🧧 XÌ DÁCH TẾT 🧧</h1>
                    <p className="text-gray-500 mb-6 font-bold">SÒNG BÀI HOÀNG GIA</p>

                    <input
                        type="text"
                        value={enteredName}
                        onChange={(e: any) => setEnteredName(e.target.value)}
                        placeholder="Tên của bạn..."
                        className="w-full text-lg p-3 border-2 border-red-100 rounded-xl mb-4 focus:outline-none focus:border-red-500 text-center text-black font-bold"
                    />

                    <button
                        onClick={handleJoin}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-transform active:scale-95 border-2 border-yellow-400"
                    >
                        🧧 VÀO SÒNG NGAY
                    </button>
                    <p className="mt-4 text-xs text-red-400">Chúc mừng năm mới - Tiền vào như nước!</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 text-white overflow-hidden flex flex-col relative">
            {/* Header */}
            <header className="p-4 flex justify-between items-center bg-black/40 backdrop-blur-sm border-b border-yellow-500/30">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">🧧</span>
                    <h1 className="text-xl font-bold text-yellow-500">SÒNG XÌ DÁCH</h1>
                </div>
                <div className="flex gap-4">
                    <div className="bg-black/60 px-4 py-2 rounded-full border border-yellow-500/50 flex items-center gap-2">
                        <span className="text-gray-300 text-xs uppercase">Your Tokens</span>
                        <span className="text-yellow-400 font-bold">{myPlayer?.tokens?.toLocaleString()}</span>
                    </div>
                    <div className="bg-black/60 px-4 py-2 rounded-full border border-yellow-500/50 flex items-center gap-2">
                        <span className="text-gray-300 text-xs uppercase">Phase</span>
                        <span className="text-yellow-400 font-bold uppercase">{gameState?.phase === 'playing' ? 'Đang Chơi' : gameState?.phase === 'betting' ? 'Đặt Cược' : gameState?.phase === 'payout' ? 'Kết Thúc' : 'Chờ...'}</span>
                    </div>
                </div>
            </header>

            {/* Game Area */}
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-8 pb-32">
                {/* Dealer Area */}
                <div className="w-full flex justify-center py-4 relative group">
                    {dealer ? (
                        <>
                            <div className={`transition-all duration-300 ${actingPlayerId === dealer.id ? 'scale-110 ring-4 ring-yellow-400 rounded-xl' : ''}`}>
                                <PlayerSpot
                                    player={dealer}
                                    isMe={dealer?.id === myId}
                                    isDealer={true}
                                    id={`player-spot-${dealer.id}`}
                                />
                            </div>

                            {/* Dealer self-activate logic if needed - usually handled by logic, but dealer can click themselves to act? */}
                            {isDealer && gameState?.phase === 'playing' && actingPlayerId !== dealer.id && (
                                <button
                                    onClick={() => handleSetTurn(dealer.id)}
                                    className="absolute -right-24 top-1/2 -translate-y-1/2 bg-yellow-600 px-3 py-1 rounded text-xs font-bold shadow-lg animate-pulse"
                                >
                                    👈 Tới lượt mình
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-white/50 animate-pulse">Đang đợi nhà cái...</div>
                    )}
                </div>

                {/* Players Grid */}
                <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4 max-w-7xl">
                    {otherPlayers.map((p: any) => (
                        <div key={p.id} className={`relative group transition-all duration-300 ${actingPlayerId === p.id ? 'scale-105 z-10' : 'opacity-90'}`}>
                            <div className={actingPlayerId === p.id ? 'ring-4 ring-green-500 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''}>
                                <PlayerSpot
                                    player={p}
                                    isMe={p.id === myId}
                                    id={`player-spot-${p.id}`}
                                />
                            </div>

                            {/* Visual Indicator for Turn */}
                            {actingPlayerId === p.id && (
                                <div className="absolute -top-4 w-full text-center">
                                    <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce shadow-lg">ĐANG BỐC...</span>
                                </div>
                            )}

                            {/* Dealer Actions on Players */}
                            {isDealer && gameState?.phase === 'playing' && (
                                <div className="absolute bottom-20 left-0 w-full flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    {!p.revealed && (
                                        <button
                                            onClick={() => handleCheck(p.id)}
                                            className="bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg"
                                        >
                                            👁 XÉT
                                        </button>
                                    )}
                                    {/* Invite to play */}
                                    {p.status === 'waiting_turn' && actingPlayerId !== p.id && (
                                        <button
                                            onClick={() => handleSetTurn(p.id)}
                                            className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg"
                                        >
                                            🫴 MỜI
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- OVERLAYS & MODALS --- */}

            {/* BETTING MODAL (Only for Players during 'betting' phase) */}
            {!isDealer && gameState?.phase === 'betting' && myPlayer?.status !== 'ready' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-red-800 to-red-900 border-4 border-yellow-500 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                        <h2 className="text-3xl font-black text-yellow-400 mb-2">ĐẶT CƯỢC</h2>
                        <p className="text-white/80 mb-2">Bạn có: <span className="text-yellow-400 font-bold">{myPlayer?.tokens?.toLocaleString()}</span></p>

                        <div className="flex items-center justify-center gap-4 mb-4">
                            <button onClick={() => setBetAmount(curr => Math.max(0, parseInt(curr) - 100))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-2xl font-bold text-white">-</button>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e: any) => setBetAmount(e.target.value)}
                                className="w-32 bg-black/30 border-2 border-yellow-500/50 rounded-xl px-2 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-500"
                            />
                            <button onClick={() => setBetAmount(curr => parseInt(curr) + 100)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-2xl font-bold text-white">+</button>
                        </div>

                        {/* Max Bet Button */}
                        <button
                            onClick={() => setBetAmount(myPlayer?.tokens || 0)}
                            className="text-xs text-yellow-300 underline mb-6 hover:text-yellow-100"
                        >
                            Cược tất cả (All-in)
                        </button>

                        {parseInt(betAmount) > (myPlayer?.tokens || 0) && (
                            <p className="text-red-400 text-sm font-bold mb-4 animate-pulse">⚠ Không đủ tiền!</p>
                        )}

                        <button
                            onClick={handleBet}
                            disabled={parseInt(betAmount) > (myPlayer?.tokens || 0)}
                            className={`w-full font-black py-4 rounded-xl text-xl shadow-lg transform transition-transform active:scale-95 ${parseInt(betAmount) > (myPlayer?.tokens || 0) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
                        >
                            XÁC NHẬN CƯỢC
                        </button>
                    </div>
                </div>
            )}

            {/* BANKRUPTCY / EX-DEALER MODAL */}
            {(myPlayer?.status === 'bankrupt' || myPlayer?.status === 'ex_dealer') && (
                <BankruptcyModal
                    player={myPlayer}
                    isDealer={isDealer}
                    players={players}
                    onBorrow={handleBorrow}
                    onReplace={handleReplace}
                    onTransfer={handleTransfer}
                />
            )}

            {/* PAYOUT POPUP (End Game) */}
            {gameState?.phase === 'payout' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white text-black p-8 rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-red-600 relative overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 left-0 w-full h-4 bg-red-600"></div>
                        <h2 className="text-4xl font-black text-red-600 text-center mb-6">🏁 KẾT THÚC VÁN 🏁</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-xl mb-4 border-b-2 border-red-100 pb-2">Kết Quả Ván Này</h3>
                                <div className="space-y-2 max-h-60 overflow-auto">
                                    {/* Sort results: Winners first */}
                                    {Object.values(players).filter((p: any) => !p.isDealer).sort((a: any, b: any) => b.tokens - a.tokens).map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center p-2 rounded bg-gray-50">
                                            <span className="font-bold">{p.name}</span>
                                            <span className={`font-bold ${p.status.includes('win') ? 'text-green-600' : p.status.includes('lose') ? 'text-red-500' : 'text-gray-500'}`}>
                                                {p.status.includes('win') ? `+${p.bet}` : p.status.includes('lose') ? `-${p.bet}` : '0'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl mb-4 border-b-2 border-yellow-200 pb-2 text-yellow-600">🏆 Bảng Xếp Hạng</h3>
                                <div className="space-y-2">
                                    {sortedPlayers.slice(0, 5).map((p: any, idx) => (
                                        <div key={p.id} className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <span className={`font-bold w-6 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-300'}`}>#{idx + 1}</span>
                                                <span>{p.name}</span>
                                            </div>
                                            <span className="font-mono">{p.tokens.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {isDealer ? (
                            <button
                                onClick={handleStart}
                                className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg animate-pulse"
                            >
                                CHIA VÁN MỚI 🎲
                            </button>
                        ) : (
                            <div className="mt-8 text-center text-gray-500 italic">Đang chờ nhà cái bắt đầu ván mới...</div>
                        )}
                    </div>
                </div>
            )}


            {/* Controls Bar (Only shows when playing) */}
            <div className="bg-black/80 backdrop-blur-md border-t border-white/10 p-4 pb-8 flex justify-center gap-4 fixed bottom-0 w-full z-40">

                {/* DEALER CONTROLS */}
                {isDealer && (
                    <>
                        {gameState?.phase === 'waiting' && <span className="text-white/50 animate-pulse">Đang chờ người chơi... (Nút start ở popup hoặc header)</span>}
                        {gameState?.phase === 'waiting' && <button onClick={handleStart} className="btn-primary bg-yellow-600">BẮT ĐẦU NGAY</button>}

                        {gameState?.phase === 'betting' && (
                            <button onClick={handleDeal} className="btn-primary bg-red-600 animate-pulse">CHIA BÀI NGAY (Đóng cược)</button>
                        )}

                        {gameState?.phase === 'playing' && (
                            <>
                                <div className="flex flex-col items-center mr-8 border-r border-white/20 pr-8">
                                    <span className="text-xs text-gray-400 mb-1">Điều khiển</span>
                                    {actingPlayerId === myId ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleHit} className="btn-action bg-green-600">BỐC THÊM</button>
                                            <button onClick={handleStand} className="btn-action bg-blue-600">DẰN BÀI</button>
                                        </div>
                                    ) : (
                                        <span className="text-yellow-500 text-sm font-bold">
                                            {actingPlayerId ? 'Đang đợi người chơi khác...' : 'Hãy chọn người chơi (Mời)'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    <span className="text-white/50 text-xs">Hover vào người chơi để MỜI hoặc XÉT</span>
                                </div>

                                {/* Dealer Settings Button (Icon) */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:block">
                                    {/* Simple toggle for now */}
                                    {gameState?.phase === 'waiting' && (
                                        <div className="flex flex-col gap-1 bg-black/50 p-2 rounded">
                                            <span className="text-[10px] text-gray-400">Chế độ cái:</span>
                                            <button
                                                onClick={() => handleSetMode(dealerMode === 'FIXED' ? 'ROTATE_3' : 'FIXED')}
                                                className={`text-xs px-2 py-1 rounded border ${dealerMode === 'FIXED' ? 'bg-red-900 border-red-500' : 'bg-blue-900 border-blue-500'}`}
                                            >
                                                {dealerMode === 'FIXED' ? '🔒 Cố định' : '🔄 Xoay vòng (3 ván)'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* PLAYER CONTROLS */}
                {!isDealer && (
                    <>
                        {/* Controls handled in Betting Modal for betting phase */}
                        {gameState?.phase === 'betting' && myPlayer?.status === 'ready' && (
                            <div className="text-yellow-500 font-bold bg-black/50 px-4 py-2 rounded-full">Đã đặt {myPlayer.bet} 🪙 - Chờ chia bài...</div>
                        )}

                        {gameState?.phase === 'playing' && (
                            <>
                                {actingPlayerId === myId ? (
                                    <>
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-600 text-white font-bold px-4 py-1 rounded-full animate-bounce">Đến lượt bạn!</div>
                                        <button onClick={handleHit} className="btn-action bg-green-600">BỐC THÊM</button>
                                        <button onClick={handleStand} className="btn-action bg-blue-600">DẰN BÀI</button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <span className="text-white/50 italic">
                                            {myPlayer?.status === 'waiting_turn' ? 'Chờ cái gọi tên...' :
                                                myPlayer?.status === 'standing' ? 'Đã dằn bài. Chờ kết quả.' :
                                                    myPlayer?.status.startsWith('settled') ? 'Đã xong.' : 'Đang đợi...'}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Deck Visual - Bottom Right or Right Center */}
            {isInGame && (
                <div id="deck-spot" className="fixed bottom-32 right-8 z-30 transition-transform hover:scale-105">
                    {/* Only show if we have cards info */}
                    <DeckVisual cardsRemaining={gameState?.cardsRemaining || 52} />
                </div>
            )}

            {/* Flying Cards Layer */}
            {flyingCards.map(card => (
                <div
                    key={card.id}
                    className="fixed z-50 w-12 h-16 bg-red-600 rounded border border-white shadow-lg pointer-events-none"
                    style={{
                        left: card.startX,
                        top: card.startY,
                        "--tx": `${card.endX - card.startX}px`,
                        "--ty": `${card.endY - card.startY}px`,
                        animation: "flyCard 0.6s ease-out forwards"
                    } as any}
                >
                    {/* Inner pattern */}
                    <div className="w-full h-full opacity-20 bg-black/20"></div>

                    <div className="w-full h-full bg-red-600 rounded border-2 border-white/50">
                    </div>
                </div>
            ))}

            <style jsx>{`
                @keyframes flyCard {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0.5) rotate(360deg); opacity: 0; }
                }
                .btn-primary {
                    @apply px-8 py-3 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-95;
                }
                .btn-action {
                    @apply px-6 py-3 rounded-xl font-bold text-white shadow-lg border-b-4 border-black/20 transform transition-all active:translate-y-1 active:border-b-0;
                }
            `}</style>
        </main >
    );
}
