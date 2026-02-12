console.log("Stage 1: Start");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const Game = require("./lib/game");

console.log("Stage 2: Imports done");
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log("Stage 3: App created, preparing...");
app.prepare().then(() => {
    console.log("Stage 4: Prepared");
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        // options
    });

    console.log("Stage 5: Socket.io init");
    const game = new Game(io);
    console.log("Stage 6: Game init");

    io.on("connection", (socket) => {
        // console.log("Client connected:", socket.id); // Reduce spam
        game.handleConnection(socket);
    });

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
}).catch(err => {
    console.error("Error during prepare:", err);
});
