
const io = require("socket.io-client");

const URL = "http://localhost:3000";

async function testExDealer() {
    console.log("Starting Ex-Dealer Logic Test...");

    const socket1 = io(URL, { forceNew: true });

    let gameState = null;
    socket1.on("gameState", (s) => {
        gameState = s;
        // console.log("GameState received:", s);
    });

    await new Promise((resolve) => socket1.on("connect", resolve));
    console.log("Socket1 connected");

    // Force Reset
    console.log("Forcing server reset...");
    socket1.emit("forceReset");
    await new Promise(r => setTimeout(r, 1000));

    // Wait for initial gamestate
    await waitForCondition(() => gameState !== null, 2000, "Initial GameState");
    console.log("Initial GameState:", JSON.stringify(gameState, null, 2));

    if (gameState.dealerId) {
        console.log("WARNING: There is already a dealer:", gameState.dealerId);
        // If there is a dealer, maybe we can't test properly unless we become dealer.
        // We can force transfer if we knew the socket, but we don't.
        // We have to restart the server if this is a ghost.
    } else {
        console.log("No dealer currently.");
    }

    const socket2 = io(URL, { forceNew: true });
    await new Promise((resolve) => socket2.on("connect", resolve));
    console.log("Socket2 connected");

    let players = {};
    const updateHandler = (p) => players = p;
    socket1.on("playerUpdate", updateHandler);
    socket2.on("playerUpdate", updateHandler);

    const id1 = socket1.id;
    const id2 = socket2.id;

    // Join
    socket1.emit("join", { name: "Dealer" });
    socket2.emit("join", { name: "Player" });

    // Wait for players to be populated
    await waitForCondition(() => players[id1] && players[id2], 2000, "Join players");
    console.log("Joined. Players state:", JSON.stringify(players, null, 2));

    let dealerId = null;
    if (players[id1].isDealer) dealerId = id1;
    else if (players[id2].isDealer) dealerId = id2;

    // If no dealer found among us, but gameState has dealerId, then it's someone else.
    if (!dealerId) {
        console.error("No dealer found among test sockets!");
        if (gameState.dealerId) {
            console.error("Ghost dealer exists ID:", gameState.dealerId);
        }
        process.exit(1);
    }

    // ... (Rest of the test logic, but let's just see if we get here first)

    const playerId = dealerId === id1 ? id2 : id1;
    const dealerSocket = dealerId === id1 ? socket1 : socket2;

    // Transfer dealership
    console.log("Transferring dealership...");
    dealerSocket.emit("transferDealer", playerId);

    // Wait for old dealer status to be 'ex_dealer'
    await waitForCondition(() => {
        if (!players[dealerId]) return false;
        return players[dealerId].status === 'ex_dealer';
    }, 3000, "Status ex_dealer");

    console.log("✅ Old dealer status is correctly 'ex_dealer'");

    // Test BORROW
    console.log("Testing BORROW option for Ex-Dealer...");
    const initialTokens = players[dealerId].tokens;
    dealerSocket.emit("borrow", 1000);

    // Wait for tokens to increase
    await waitForCondition(() => players[dealerId].tokens === initialTokens + 1000, 2000, "Borrow tokens");
    console.log("✅ Tokens increased correctly");

    console.log("🎉 BASIC TESTS PASSED");
    socket1.close();
    socket2.close();
    process.exit(0);
}

async function waitForCondition(predicate, timeout, label) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (predicate()) return true;
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for: ${label}`);
}

testExDealer().catch(e => {
    console.error(e);
    process.exit(1);
});
