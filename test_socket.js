console.log("Start");
try {
    const { Server } = require("socket.io");
    console.log("Socket.io imported");
} catch (e) {
    console.error("Failed to import socket.io", e);
}
