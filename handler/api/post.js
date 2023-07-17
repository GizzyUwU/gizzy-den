module.exports = async () => {
    try {
      const dbPost = require('../../assets/models/upload.js');
      const getPost = await dbPost.find({}, { _id: 0 }); // Exclude the _id field from the query result
      const jsonData = getPost.map((project) => {
        return project.toObject(); // Convert the Mongoose document to a plain JavaScript object
      });
      return jsonData;
    } catch (err) {
      console.log(err);
      return err;
    }
  };
  