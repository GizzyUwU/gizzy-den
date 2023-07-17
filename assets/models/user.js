const mongoose = require('mongoose');
const UserSchema = mongoose.Schema({
    deleteProtocol: Number,
    email: String,
    username: String,
    password: String,
})

module.exports = mongoose.model('User', UserSchema);