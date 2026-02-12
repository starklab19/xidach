"use client";

import { useState } from "react";

export default function BankruptcyModal({ player, isDealer, onBorrow, onReplace, onTransfer, players }: any) {
    const [borrowAmount, setBorrowAmount] = useState(1000);
    const [newName, setNewName] = useState("");
    const [mode, setMode] = useState("CHOICE"); // CHOICE, BORROW, REPLACE

    // For Dealer specific
    const [transferTargetId, setTransferTargetId] = useState("");

    const otherPlayers = Object.values(players).filter((p: any) => !p.isDealer);

    // If ex_dealer, show specific choice
    if (mode === "CHOICE" && player.status === 'ex_dealer') {
        return (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                <div className="bg-blue-900 border-4 border-yellow-500 p-8 rounded-2xl max-w-md w-full text-center text-white">
                    <h2 className="text-3xl font-black text-yellow-500 mb-4">👑 ĐÃ NHƯỢNG QUYỀN</h2>
                    <p className="mb-6">Bạn đã chuyển giao quyền làm cái via. Giờ tính sao?</p>

                    <div className="grid gap-4">
                        <button
                            onClick={() => setMode("BORROW")}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                        >
                            🤑 VAY TIỀN CHƠI TIẾP
                        </button>

                        <button
                            onClick={() => setMode("REPLACE")}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-xl"
                        >
                            👋 RỜI BÀN (CHO NGƯỜI KHÁC VÀO)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === "CHOICE") {
        return (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                <div className="bg-red-900 border-4 border-yellow-500 p-8 rounded-2xl max-w-md w-full text-center text-white">
                    <h2 className="text-3xl font-black text-yellow-500 mb-4">💸 PHÁ SẢN RỒI! 💸</h2>
                    <p className="mb-6">Hết tiền rồi cưng ơi! Giờ tính sao?</p>

                    <div className="grid gap-4">
                        <button
                            onClick={() => setMode("BORROW")}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                        >
                            🤑 VAY TIỀN CHƠI TIẾP
                        </button>

                        {isDealer ? (
                            <button
                                onClick={() => setMode("TRANSFER")}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
                            >
                                👑 NHƯỢNG QUYỀN LÀM CÁI
                            </button>
                        ) : (
                            <button
                                onClick={() => setMode("REPLACE")}
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-xl"
                            >
                                👤 ĐỔI NGƯỜI CHƠI MỚI
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (mode === "BORROW") {
        return (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                <div className="bg-green-900 border-4 border-white p-8 rounded-2xl max-w-md w-full text-center text-white">
                    <h2 className="text-2xl font-black mb-4">VAY NÓNG</h2>
                    <p className="mb-4">Nhập số tiền muốn vay:</p>
                    <input
                        type="number"
                        value={borrowAmount}
                        onChange={(e: any) => setBorrowAmount(e.target.value)}
                        className="w-full bg-black/30 border border-white/50 rounded p-2 mb-4 text-center text-xl"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setMode("CHOICE")} className="flex-1 bg-gray-600 py-2 rounded">Quay lại</button>
                        <button
                            onClick={() => onBorrow(borrowAmount)}
                            className="flex-1 bg-yellow-500 text-black font-bold py-2 rounded"
                        >
                            XÁC NHẬN
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === "REPLACE") {
        return (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                <div className="bg-gray-900 border-4 border-white p-8 rounded-2xl max-w-md w-full text-center text-white">
                    <h2 className="text-2xl font-black mb-4">NGƯỜI CHƠI MỚI</h2>
                    <p className="mb-4">Nhập tên người chơi thay thế:</p>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Tên mới..."
                        className="w-full bg-black/30 border border-white/50 rounded p-2 mb-4 text-center text-xl"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setMode("CHOICE")} className="flex-1 bg-gray-600 py-2 rounded">Quay lại</button>
                        <button
                            onClick={() => onReplace(newName)}
                            className="flex-1 bg-purple-500 text-white font-bold py-2 rounded"
                        >
                            THAY THẾ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === "TRANSFER" && isDealer) {
        return (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                <div className="bg-blue-900 border-4 border-white p-8 rounded-2xl max-w-md w-full text-center text-white">
                    <h2 className="text-2xl font-black mb-4">NHƯỢNG QUYỀN</h2>
                    <p className="mb-4">Chọn người làm cái mới:</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {otherPlayers.map((p: any) => (
                            <button
                                key={p.id}
                                onClick={() => setTransferTargetId(p.id)}
                                className={`p-2 rounded border ${transferTargetId === p.id ? 'bg-yellow-500 text-black border-yellow-500' : 'border-white/20 hover:bg-white/10'}`}
                            >
                                {p.name} ({p.tokens})
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setMode("CHOICE")} className="flex-1 bg-gray-600 py-2 rounded">Quay lại</button>
                        <button
                            onClick={() => onTransfer(transferTargetId)}
                            disabled={!transferTargetId}
                            className="flex-1 bg-blue-500 text-white font-bold py-2 rounded disabled:opacity-50"
                        >
                            CHUYỂN GIAO
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
