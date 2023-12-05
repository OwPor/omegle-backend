let onlineUsers = [];
let unPairedUsers = [];

const addUser = (userId, socketId) => {
    const existingUser = onlineUsers.find(user => user.userId === userId)
    const existingUser_ = onlineUsers.find(user => user.socketId === socketId)

    if (existingUser) {
        return { error: "Userid is taken" }
    }
    if (existingUser_) {
        removeUser(socketId)
    }

    const user = { userId, socketId }
    onlineUsers.push(user)

    return { user }
}

const addUnpairedUser = (userId) => {
    const existingUser = unPairedUsers.find(user => user === userId)

    if (existingUser) {
        return { error: "User already unPaired" }
    }

    unPairedUsers.push(userId)

    return { userId }
}

const removeUser = (socketId) => {
    const filteredOnlineUsers = onlineUsers.filter(user => user.socketId !== socketId)

    onlineUsers = filteredOnlineUsers
}

const getUser = (userId) => onlineUsers.find(user => user.userId === userId)

const getUsers = () => onlineUsers

const getUnPairedUsers = () => unPairedUsers

module.exports = {
    getUser, removeUser, addUser, getUsers, addUnpairedUser, getUnPairedUsers
}