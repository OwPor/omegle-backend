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
            // console.log(`Adding new online user: ${userId}`);
            const { error } = addUser(userId, socket.id);
            if (error) {
                // console.log(`Error adding user: ${error}`);
                return callback(error);
            }
            // reset online users list
            const onlineUsers = getUsers()
            io.emit("get-online-users", onlineUsers);
            callback()
        });

        socket.on("pairing-user", (userId, callback) => {
            const { error } = addUnpairedUser(userId)
            if (error) return callback(error)
            const unpairedUser = getUnpairedUsers()
            if (unpairedUser.length < 2) return
            const user = getUser(userId)
            const user2 = getUser(unpairedUser[0])
            io.to(user.socketId).emit("user-paired", user2.userId)
            removeUnpairedUser(user2.userId)
            io.to(user2.socketId).emit("user-paired", user.userId)
            removeUnpairedUser(user.userId)
        })

        socket.on("unpairing-user", (userId, callback) => {
            removeUnpairedUser(userId)
            callback()
        })

        socket.on("send-message", (receiver, message, callback) => {
            const user = getUser(receiver)
            if (!user) {
                return callback()
            }
            io.to(user.socketId).emit("send-message", message)
            io.to(socket.id).emit("receive-message", message)
            callback()
        })

        socket.on("chat-close", (receiver, callback) => {
            try {
                const user = getUser(receiver);
                
                if (!user || !user.socketId) {
                    io.to(socket.id).emit("user-disconnected", {
                        message: "The other user has disconnected",
                        userId: receiver
                    });
                    console.log(`User not found or invalid socketId for userId: ${receiver}`);
                    return callback && callback();
                }
                
                io.to(user.socketId).emit("chat-close");
                callback && callback();
            } catch (error) {
                console.error('Error in chat-close handler:', error);
                callback && callback(error);
            }
        });

        socket.on("typing", (userId) => {
            const user = getUser(userId);
            if (!user || !user.socketId) {
                io.to(socket.id).emit("user-disconnected", {
                    message: "The other user has disconnected",
                    userId: userId
                });
                console.log(`User not found or invalid socketId for userId: ${userId}`);
                return;
            }
            io.to(user.socketId).emit("typing");
        });
        
        socket.on("typing stop", (userId) => {
            const user = getUser(userId);
            if (!user || !user.socketId) {
                io.to(socket.id).emit("user-disconnected", {
                    message: "The other user has disconnected",
                    userId: userId
                });
                console.log(`User not found or invalid socketId for userId: ${userId}`);
                return;
            }
            io.to(user.socketId).emit("typing stop");
        });

        socket.on("screen-off", () => {
            try {
                const user = removeUser(socket.id);
                
                if (user) {
                    removeUnpairedUser(user.userId);
                    
                    // Notify any active chat partners
                    const onlineUsers = getUsers();
                    onlineUsers.forEach(onlineUser => {
                        io.to(onlineUser.socketId).emit("user-disconnected", {
                            message: "Your chat partner has disconnected",
                            userId: user.userId
                        });
                    });
                }
        
                // reset online users list
                const onlineUsers = getUsers();
                io.emit("get-online-users", onlineUsers);
            } catch (error) {
                console.error('Error in screen-off handler:', error);
            }
        });
        
        // Similarly, update the "offline" event handler
        socket.on("offline", () => {
            try {
                const user = removeUser(socket.id);
                
                if (user) {
                    removeUnpairedUser(user.userId);
                    
                    // Notify any active chat partners
                    const onlineUsers = getUsers();
                    onlineUsers.forEach(onlineUser => {
                        io.to(onlineUser.socketId).emit("user-disconnected", {
                            message: "Your chat partner has disconnected",
                            userId: user.userId
                        });
                    });
                }
        
                // reset online users list
                const onlineUsers = getUsers();
                io.emit("get-online-users", onlineUsers);
            } catch (error) {
                console.error('Error in offline handler:', error);
            }
        });

        // socket.on("disconnect", () => {
        //     // remove user from online users list
        //     const user = removeUser(socket.id)
        //     removeUnpairedUser(user.userId)
        //     const onlineUsers = getUsers()
        //     // reset online users list
        //     io.emit("get-online-users", onlineUsers);
        //     console.log('🔥: A user disconnected')
        // })

        socket.on("disconnect", () => {
            try {
                const user = removeUser(socket.id)
                
                if (user) {
                    removeUnpairedUser(user.userId)
                }
                
                const onlineUsers = getUsers()
                io.emit("get-online-users", onlineUsers);
                console.log('🔥: A user disconnected')
            } catch (error) {
                console.error('Error in disconnect handler:', error)
            }
        })
    });
}