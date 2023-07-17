const mongoose = require('mongoose');
const uploadSchema = mongoose.Schema({
    projectId: String,
    projectName: String,
    projectDesc: String,
    projectData: String,
    projectDate: String,
    projectLink: String
})

module.exports = mongoose.model('upload', uploadSchema);
