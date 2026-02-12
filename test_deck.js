
const io = require("socket.io-client");

const URL = "http://localhost:3000";

async function testDeckCount() {
    console.log("Testing Deck Count...");

    const socket = io(URL, { forceNew: true });

    let gameState = null;
    socket.on("gameState", (s) => {
        gameState = s;
    });

    await new Promise((resolve) => socket.on("connect", resolve));
    console.log("Connected");

    // Wait for gameState
    const start = Date.now();
    while (!gameState && Date.now() - start < 3000) {
        await new Promise(r => setTimeout(r, 100));
    }

    if (!gameState) {
        console.error("No gamestate received");
        process.exit(1);
    }

    console.log("Cards Remaining:", gameState.cardsRemaining);

    if (typeof gameState.cardsRemaining === 'number') {
        console.log("✅ cardsRemaining is a number");
    } else {
        console.error("❌ cardsRemaining is missing or invalid");
        process.exit(1);
    }

    socket.close();
    process.exit(0);
}

testDeckCount().catch(e => console.error(e));
