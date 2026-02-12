
class Deck {
    constructor() {
        this.cards = [];
        this.suits = ["♠", "♣", "♦", "♥"];
        this.ranks = [
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "J",
            "Q",
            "K",
            "A",
        ];
        this.refresh();
    }

    refresh() {
        this.cards = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                this.cards.push({ suit, rank, value: this.getValue(rank) });
            }
        }
        this.shuffle();
    }

    getValue(rank) {
        if (["J", "Q", "K"].includes(rank)) return 10;
        if (rank === "A") return 11; // Special handling elsewhere for A (1, 10, 11)
        return parseInt(rank);
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }
}

class Player {
    constructor(id, name, tokens = 1000) {
        this.id = id;
        this.name = name;
        this.tokens = tokens;
        this.hand = [];
        this.bet = 0;
        this.isDealer = false; // Only one dealer
        this.status = "waiting"; // waiting, betting, playing, standing, busted, blackjack
        this.revealed = false; // For dealer to check
    }

    resetHand() {
        this.hand = [];
        this.bet = 0;
        this.revealed = false;
        if (this.tokens <= 0) {
            this.status = "bankrupt";
        } else {
            this.status = "waiting";
        }
    }

    getScore() {
        let score = 0;
        let aces = 0;
        for (let card of this.hand) {
            score += card.value;
            if (card.rank === "A") aces++;
        }

        // Adjust for Aces
        // Xì dách logic needed?
        // Standard rule: A is 11, 10, or 1.
        // If score > 21 and aces > 0, treat A as 1.
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    getHandType() {
        // Logic for Xì Bàng (2 Aces), Xì Dách (Ace + 10/J/Q/K), Ngũ Linh (5 cards <= 21)
        if (this.hand.length === 2) {
            const hasAce = this.hand.some(c => c.rank === 'A');
            const faceCards = ['10', 'J', 'Q', 'K'];
            const hasFace = this.hand.some(c => faceCards.includes(c.rank));
            const aceCount = this.hand.filter(c => c.rank === 'A').length;

            if (aceCount === 2) return "XI_BANG"; // AA
            if (hasAce && hasFace) return "XI_DACH"; // A + 10/J/Q/K
        }

        if (this.hand.length === 5 && this.getScore() <= 21) return "NGU_LINH";

        const score = this.getScore();
        if (score > 21) return "BUST"; // Quắc
        return "NORMAL";
    }
}

class Game {
    constructor(io) {
        this.io = io;
        this.players = {}; // id -> Player
        this.dealerId = null;
        this.deck = new Deck();
        this.phase = "waiting"; // waiting, betting, dealing, playing, dealer_turn, payout
        this.actingPlayerId = null;
        this.playerOrder = []; // List of player IDs to maintain order
        this.roundCount = 0;
        this.dealerMode = "FIXED"; // FIXED, ROTATE_3
    }

    handleConnection(socket) {
        socket.emit("gameState", this.getState());

        socket.on("join", ({ name, tokens }) => {
            if (this.players[socket.id]) return; // Already joined?

            const isFirst = Object.keys(this.players).length === 0;
            const player = new Player(socket.id, name, tokens || 1000);

            if (isFirst) {
                player.isDealer = true;
                this.dealerId = socket.id;
            }

            this.players[socket.id] = player;
            this.playerOrder.push(socket.id);

            this.io.emit("playerUpdate", this.getPublicPlayers());
        });

        socket.on("bet", (amount) => {
            if (this.phase !== "betting") return;
            const player = this.players[socket.id];
            if (!player || player.isDealer) return;

            if (amount > player.tokens) return; // Validate
            player.bet = amount;
            player.status = "ready";

            this.io.emit("playerUpdate", this.getPublicPlayers());
        });

        socket.on("startRound", () => {
            if (this.phase !== "waiting" && this.phase !== "payout") return;
            const player = this.players[socket.id];
            if (!player || !player.isDealer) return;

            // Check if there are any players (even bankrupt)
            const otherPlayers = Object.values(this.players).filter(p => !p.isDealer);
            if (otherPlayers.length === 0) {
                this.io.emit("error", "Cần ít nhất 1 người chơi để bắt đầu!");
                return;
            }

            this.deck.refresh();

            // Reset hands
            Object.values(this.players).forEach(p => p.resetHand());

            this.phase = "betting";
            this.roundCount++;

            // Check Rotation
            if (this.dealerMode === 'ROTATE_3' && this.roundCount > 0 && this.roundCount % 3 === 0) {
                // Time to rotate dealer?
                // Let's just notify for now, or auto rotate?
                // Auto rotate to next player
                const currentDealerIndex = this.playerOrder.indexOf(this.dealerId);
                const nextIndex = (currentDealerIndex + 1) % this.playerOrder.length;
                const nextDealerId = this.playerOrder[nextIndex];

                this.players[this.dealerId].isDealer = false;
                this.dealerId = nextDealerId;
                this.players[this.dealerId].isDealer = true;
            }

            this.io.emit("gameState", this.getState());
        });

        socket.on("deal", () => {
            if (this.phase !== "betting") return;
            const player = this.players[socket.id];
            if (!player || !player.isDealer) return;

            // Check if players have bet? Or just deal to those who bet?
            // For speed, just deal.

            this.phase = "playing";

            // Deal 2 cards each
            for (let i = 0; i < 2; i++) {
                this.playerOrder.forEach(pid => {
                    this.players[pid].hand.push(this.deck.deal());
                });
            }

            // --- AUTO WIN CHECKS ---
            const dealer = this.players[this.dealerId];
            const dealerSpecial = dealer.getHandType();

            // 1. If Dealer has Xì Dách / Xì Bàng -> End Game Immediately
            if (dealerSpecial === "XI_DACH" || dealerSpecial === "XI_BANG") {
                this.phase = "payout";
                Object.values(this.players).forEach(p => {
                    if (p.id !== this.dealerId) {
                        p.revealed = true; // Show all hands
                        this.settleOne(dealer, p);
                    }
                });
                this.io.emit("gameState", this.getState());
                this.io.emit("playerUpdate", this.getPublicPlayers());
                return;
            }

            // 2. If Player has Xì Dách / Xì Bàng (and Dealer doesn't) -> Player wins immediately
            Object.values(this.players).forEach(p => {
                if (p.id !== this.dealerId) {
                    const pSpecial = p.getHandType();
                    if (pSpecial === "XI_DACH" || pSpecial === "XI_BANG") {
                        p.revealed = true; // Reveal player's hand
                        this.settleOne(dealer, p); // Settle immediately
                    }
                }
            });

            // Set all non-dealer players to waiting_turn
            Object.values(this.players).forEach(p => {
                if (!p.isDealer) {
                    if (!p.status.startsWith('settled')) {
                        p.status = "waiting_turn";
                    }
                } else {
                    p.status = "playing";
                }
            });

            // this.nextTurn(); // Removed: Dealer invites first player manually
        });

        socket.on("setTurn", (targetId) => {
            if (this.phase !== "playing") return;
            const dealer = this.players[socket.id];
            if (!dealer || !dealer.isDealer) return;

            const target = this.players[targetId];
            if (!target) return;

            // De-activate current actor if any?
            if (this.actingPlayerId && this.players[this.actingPlayerId]) {
                // Should we force stand them? Or just switch focus?
                // Xì Dách: usually you finish one by one.
                // Let's just switch focus.
            }

            this.actingPlayerId = targetId;
            target.status = "acting";
            this.io.emit("gameState", this.getState());
            this.io.emit("playerUpdate", this.getPublicPlayers());
        });

        // --- NEW FEATURES Handlers ---
        socket.on("borrow", (amount) => {
            const player = this.players[socket.id];
            if (!player) return;
            player.tokens += parseInt(amount);

            // If they were bankrupt or ex-dealer, restore status based on phase
            if (player.status === 'bankrupt' || player.status === 'ex_dealer') {
                if (this.phase === 'playing' || this.phase === 'payout') {
                    // They finished this round (lost/transferred), so keep them settled or waiting
                    // If ex_dealer, they are just a player now, should wait for next round
                    player.status = 'waiting';
                } else {
                    player.status = 'waiting';
                }
            }
            this.io.emit("playerUpdate", this.getPublicPlayers());
        });

        socket.on("replacePlayer", (newName) => {
            const player = this.players[socket.id];
            if (!player) return;
            // logic: reset stats, new name
            player.name = newName;
            player.tokens = 1000;
            player.bet = 0;
            player.hand = [];
            player.status = 'waiting';
            this.io.emit("playerUpdate", this.getPublicPlayers());
        });

        socket.on("transferDealer", (targetId) => {
            const sender = this.players[socket.id];
            if (!sender || !sender.isDealer) return;

            const target = this.players[targetId];
            if (!target) return;

            sender.isDealer = false;
            sender.status = 'ex_dealer'; // Mark as ex-dealer to prompt them
            target.isDealer = true;
            this.dealerId = targetId;

            this.io.emit("gameState", this.getState());
            this.io.emit("playerUpdate", this.getPublicPlayers());
        });

        socket.on("setDealerMode", (mode) => {
            const sender = this.players[socket.id];
            if (!sender || !sender.isDealer) return;
            this.dealerMode = mode;
            this.io.emit("gameState", this.getState());
        });

        socket.on("hit", () => {
            if (this.phase !== "playing") return;
            const player = this.players[socket.id];
            if (!player) return;

            // Turn check
            if (!player.isDealer) {
                if (this.actingPlayerId !== socket.id) return;
            } else {
                // Dealer can hit whenever? Or only when actingPlayerId is self or null?
                // Let's restrict Dealer to only hit when they select themselves or it's implicitly their turn.
                // User said "cái sẽ bốc sau cùng" (dealer hits last).
                // So dealer should select themselves to hit.
                if (this.actingPlayerId !== socket.id) return;
            }

            // Logic limits: typically max 5 cards
            if (player.hand.length >= 5) return;

            // Cannot hit if busted or >= 21? Xì dách specific nuances. 
            // Allow hit if < 21.
            if (player.getScore() >= 21) return;

            player.hand.push(this.deck.deal());

            // Auto check bust
            if (player.getScore() > 21) {
                player.status = "busted";
                this.nextTurn();
                return;
            }

            // Auto stand if 5 cards (Ngũ Linh limit)
            if (player.hand.length === 5) {
                player.status = "standing";
                this.nextTurn();
                return;
            }

            this.io.emit("playerUpdate", this.getPublicPlayers());
            this.io.emit("gameState", this.getState());
        });

        socket.on("stand", () => {
            if (this.phase !== "playing") return;
            const player = this.players[socket.id];
            if (!player) return;

            if (this.actingPlayerId !== socket.id) return;

            player.status = "standing";
            this.nextTurn();
        });

        socket.on("dealerCheck", (targetPlayerId) => {
            // Dealer reveals a player's hand and settles immediately or at end?
            // Xì dách: Dealer can check anyone any time after they have dealt enough?
            // Usually dealer plays their hand, then checks/compares.
            // Or dealer can "Xét" indivudal players.

            if (this.phase !== "playing") return;
            const sender = this.players[socket.id];
            if (!sender || !sender.isDealer) return;

            const target = this.players[targetPlayerId];
            if (!target) return;

            target.revealed = true;
            target.revealed = true;
            this.settleOne(this.players[this.dealerId], target);

            // Check if all players (except dealer) are settled
            const allSettled = this.playerOrder
                .filter(id => id !== this.dealerId)
                .every(id => {
                    const status = this.players[id].status;
                    return status.startsWith('settled') || status === 'standing' || status === 'busted'; // 'standing' might imply waiting for check? 
                    // Actually, if they are standing, dealer needs to check them.
                    // So we only end if everyone is SETTLED.
                    // Wait, dealer checks one by one.
                    // So we check if everyone is settled.
                    return status.startsWith('settled');
                });

            // Actually, if dealer checks someone, they become 'settled - ...'
            // So if all non-dealer players are settled, end round.
            // ONLY check players who actually have cards (ignore spectators/replaced players)
            const playingPlayers = this.playerOrder.filter(id => id !== this.dealerId && this.players[id].hand.length > 0);
            const allDone = playingPlayers.every(id => {
                const s = this.players[id].status;
                return s.startsWith('settled') || s === 'bankrupt';
            });

            if (allDone && playingPlayers.length > 0) {
                this.phase = "payout";
                this.io.emit("gameState", this.getState());
            } else if (allDone && playingPlayers.length === 0) {
                // If no players?
                this.phase = "payout";
                this.io.emit("gameState", this.getState());
            }

            this.io.emit("playerUpdate", this.getPublicPlayers());
        });



        socket.on("disconnect", () => {
            delete this.players[socket.id];
            this.playerOrder = this.playerOrder.filter(id => id !== socket.id);
            if (socket.id === this.dealerId) {
                // Assign new dealer? Or reset game.
                this.dealerId = this.playerOrder[0] || null;
                if (this.dealerId) this.players[this.dealerId].isDealer = true;
            }
            this.io.emit("playerUpdate", this.getPublicPlayers());
        });
    }

    settleOne(dealer, player) {
        if (player.status === "settled") return;

        const dealerScore = dealer.getScore();
        const playerScore = player.getScore();
        // Simplified win logic for now - needs full Xì Dách rules (Special hands first)

        const dealerSpecial = dealer.getHandType();
        const playerSpecial = player.getHandType();

        let win = false;

        // Compare Logic
        // 1. Special Hands Priority
        // Xi Bang > Xi Dach > Ngu Linh > Normal
        const rank = { "XI_BANG": 4, "XI_DACH": 3, "NGU_LINH": 2, "NORMAL": 1, "BUST": 0 };

        if (rank[playerSpecial] > rank[dealerSpecial]) win = true;
        else if (rank[playerSpecial] < rank[dealerSpecial]) win = false;
        else {
            // Same rank, compare scores if Normal/Ngu Linh
            if (playerSpecial === "NORMAL" || playerSpecial === "NGU_LINH") {
                if (playerScore > dealerScore) win = true;
                else if (playerScore < dealerScore) win = false;
                else win = false; // Draw = Dealer wins or push? Usually Push. Let's say Dealer wins ties for simplicity or Push.
                // Let's implement Push?
                if (playerScore === dealerScore) {
                    player.status = "settled - draw";
                    return;
                }
            }
        }

        // BUST handling
        if (playerSpecial === "BUST" && dealerSpecial === "BUST") {
            // Who busts more? Or usually dealer wins if player busts.
            win = false;
        }

        if (win) {
            player.tokens += player.bet;
            dealer.tokens -= player.bet;
            player.status = "settled - win";
        } else {
            player.tokens -= player.bet;
            dealer.tokens += player.bet;
            player.status = "settled - lose";
        }

        // Bankruptcy Check
        if (player.tokens <= 0) player.status = "bankrupt";
        if (dealer.tokens <= 0) dealer.status = "bankrupt";
    }

    nextTurn() {
        if (this.phase !== 'playing') return;

        // Find next waiting player in order
        const nextPlayerId = this.playerOrder.find(pid => {
            const p = this.players[pid];
            return !p.isDealer && p.status === 'waiting_turn';
        });

        if (nextPlayerId) {
            this.actingPlayerId = nextPlayerId;
            this.players[nextPlayerId].status = 'acting';
        } else {
            // No one waiting, Dealer's turn
            this.actingPlayerId = this.dealerId;
        }

        this.io.emit("gameState", this.getState());
        this.io.emit("playerUpdate", this.getPublicPlayers());
    }

    getState() {
        return {
            phase: this.phase,
            dealerId: this.dealerId,
            actingPlayerId: this.actingPlayerId,
            dealerMode: this.dealerMode,
            roundCount: this.roundCount,
            cardsRemaining: this.deck.cards.length
        };
    }

    getPublicPlayers() {
        // Hide hands of others unless revealed?
        // For now send everything for simplicity, frontend hides it.
        // Security wise: Should filter.
        return this.players;
    }
}

module.exports = Game;
