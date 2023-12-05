let onlineUsers = [];
let unPairedUsers = []
let pairedUsers = []

const addUser = (userId, socketId) => {
    const existingUser = onlineUsers.find(user => user.userId === userId)

    if (existingUser) {
        return { error: "Userid is taken" }
    }

    const user = { userId, socketId }
    onlineUsers.push(user)

    return { user }
}

const addUnpairedUsers = (userId) => {
    const existingUser = unPairedUsers.find(user => user === userId)

    if (existingUser) {
        return { error: "User already unPaired" }
    }

    unPairedUsers.push(userId)

    return { user }
}

const removeUser = (socketId) => {
    const filteredOnlineUsers = onlineUsers.filter(user => user.socketId !== socketId)

    onlineUsers = filteredOnlineUsers
}

const getUser = (receiver) => onlineUsers.find(user => user.userId === receiver)

const getUsers = () => onlineUsers

const getUnPairedUsers = () => unPairedUsers

module.exports = {
    getUser, removeUser, addUser, getUsers, addUnpairedUsers, getUnPairedUsers
}