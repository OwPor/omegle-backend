const { addUser, removeUser, getUser, getUsers, addUnpairedUser, getUnpairedUsers, removeUnpairedUser } = require("./users")

module.exports = function (server) {
    const io = require("socket.io")(server, {
        cors: {
            "Access-Control-Allow-Origin": process.env.FRONTEND_URL
        }
    });

    io.on('connection', (socket) => {
        console.log(`⚡: ${socket.id} user just connected!`)

        socket.on("new-online-user", (userId, callback) => {
            try {
                const { error } = addUser(userId, socket.id);
                if (error) return callback(error);
                
                const onlineUsers = getUsers();
                io.emit("get-online-users", onlineUsers);
                callback();
            } catch (error) {
                console.error('Error in new-online-user:', error);
                callback('Internal server error');
            }
        });

        socket.on("pairing-user", (userId, callback) => {
            try {
                const { error } = addUnpairedUser(userId);
                if (error) return callback(error);

                const unpairedUsers = getUnpairedUsers();
                if (unpairedUsers.length < 2) return callback();

                const user = getUser(userId);
                const user2 = getUser(unpairedUsers[0]);

                if (!user || !user2) return callback('Users not found');

                io.to(user.socketId).emit("user-paired", user2.userId);
                io.to(user2.socketId).emit("user-paired", user.userId);
                
                removeUnpairedUser(user2.userId);
                removeUnpairedUser(user.userId);
                callback();
            } catch (error) {
                console.error('Error in pairing-user:', error);
                callback('Pairing failed');
            }
        });

        socket.on("send-message", (receiver, message, callback) => {
            try {
                const user = getUser(receiver);
                if (!user || !user.socketId) {
                    return callback('User not found');
                }

                io.to(user.socketId).emit("send-message", message);
                io.to(socket.id).emit("receive-message", message);
                callback();
            } catch (error) {
                console.error('Error in send-message:', error);
                callback('Message sending failed');
            }
        });

        socket.on("chat-close", (receiver, callback) => {
            try {
                const user = getUser(receiver);
                if (!user || !user.socketId) {
                    return callback('User not connected');
                }

                io.to(user.socketId).emit("chat-close");
                callback();
            } catch (error) {
                console.error('Error in chat-close:', error);
                callback('Chat close failed');
            }
        });

        socket.on("typing", (userId) => {
            try {
                const user = getUser(userId);
                if (!user || !user.socketId) {
                    return socket.emit("typing-error", {
                        message: "Connection interrupted. Please refresh the page."
                    });
                }
                io.to(user.socketId).emit("typing");
            } catch (error) {
                console.error('Error in typing:', error);
            }
        });

        socket.on("typing stop", (userId) => {
            try {
                const user = getUser(userId);
                if (!user || !user.socketId) {
                    return socket.emit("typing-error", {
                        message: "Connection interrupted. Please refresh the page."
                    });
                }
                io.to(user.socketId).emit("typing stop");
            } catch (error) {
                console.error('Error in typing stop:', error);
            }
        });

        const handleUserDisconnect = () => {
            try {
                const user = removeUser(socket.id);
                if (user) {
                    removeUnpairedUser(user.userId);
                    const onlineUsers = getUsers();
                    io.emit("get-online-users", onlineUsers);
                }
            } catch (error) {
                console.error('Error in disconnect handler:', error);
            }
        };

        socket.on("screen-off", handleUserDisconnect);
        socket.on("offline", handleUserDisconnect);
        socket.on("disconnect", handleUserDisconnect);
    });
}