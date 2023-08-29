const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: { type: String },
  sections: [{
    index: Number,
    contentType: String,
  }],
  images: [{
    url: String,
    header: String,
    name: String,
  }],
  paragraphs: [{
    header: String,
    text: String,
  }],
  createdAt: { type: Date, required: true },
  published: { type: Boolean, required: true }
});

PostSchema.virtual("url").get(function () {
  return `/post/${this._id}`;
});


module.exports = mongoose.model("Post", PostSchema);
