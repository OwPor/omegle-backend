const { addUser, removeUser, getUser, getUsers, addUnpairedUser, getUnPairedUsers } = require("./users")

module.exports = function (server) {
    const io = require("socket.io")(server, {
        cors: {
            "Access-Control-Allow-Origin": process.env.FRONTEND_URL
        }
    });

    io.on('connection', (socket) => {
        console.log(`⚡: ${socket.id} user just connected!`)

        socket.on("new-online-user", (userId, callback) => {
            const { error } = addUser(userId, socket.id)
            if (error) return callback(error)
            // reset online users list
            const onlineUsers = getUsers()
            console.log(onlineUsers, "after new online user")
            io.emit("get-online-users", onlineUsers);
            callback()
        });

        socket.on("pairing-user", (userId, callback) => {
            const { error } = addUnpairedUser(userId)
            if (error) return callback(error)
            const unPairedUsers = getUnPairedUsers()
            if (unPairedUsers.length < 2) return
            const user = getUser(userId)
            console.log(unPairedUsers)
            const user2 = getUser(unPairedUsers[0])
            io.to(user.socketId).emit("user-paired", user2.userId)
            io.to(user2.socketId).emit("user-paired", user.userId)
        })

        socket.on("send-message", (receiver, message, callback) => {
            const user = getUser(receiver)
            if (!user) {
                return callback()
            }
            console.log(user, message)
            io.to(user.socketId).emit("send-message", message)
            callback()
        })

        socket.on("chat-close", (receiver, callback) => {
            const user = getUser(receiver)
            io.to(user.socketId).emit("chat-close")
            callback()
        })

        socket.on("offline", () => {
            // remove user from online users list
            const user = removeUser(socket.id)
            // reset online users list
            const onlineUsers = getUsers()
            io.emit("get-online-users", onlineUsers);
        });

        socket.on("disconnect", () => {
            // remove user from online users list
            console.log(socket.id)
            const user = removeUser(socket.id)
            const onlineUsers = getUsers()
            // reset online users list
            console.log(onlineUsers, "after disconnect")
            io.emit("get-online-users", onlineUsers);

            console.log('🔥: A user disconnected')
        })
    });
}