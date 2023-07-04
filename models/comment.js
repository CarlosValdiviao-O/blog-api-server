const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  title: { type: String, required: true, maxLength: 50 },
  author: { type: String, required: true, maxLength: 50 },
  text: { type: String, required: true, maxLength: 1500 },
  createdAt: { type: Date, required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true }
});


module.exports = mongoose.model("Comment", CommentSchema);
