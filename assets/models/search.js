const mongoose = require('mongoose');
const searchSchema = mongoose.Schema({
    projectId: String,
    projectName: String,
    projectDesc: String,
    projectData: String,
    projectDate: String
})

module.exports = mongoose.model('search', searchSchema);