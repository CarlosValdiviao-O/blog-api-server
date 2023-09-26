const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: String, required: true, maxLength: 30 },
  text: { type: String, required: true, maxLength: 800 },
  createdAt: { type: Date, required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true }
});


module.exports = mongoose.model("Comment", CommentSchema);
