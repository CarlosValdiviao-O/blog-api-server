var express = require('express');
var router = express.Router();
const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const Comment = require('../models/comment');
const { check, body, validationResult } = require("express-validator");
const validator = require('validator');

/* GET home page. */
router.get('/', asyncHandler(async (req, res, next) => {
  const posts = Post.find().exec();
  res.json({
    posts: posts
  });
}));

//router.get('/create', asyncHandler(async (req, res, next) => {
//  //validate token 
//  if (true) 
//    res.json('ok');
//  else
//    res.json('Forbidden');
//}))

router.post('/create', [
  // Validate and sanitize fields.
  check("title", "You need a title mate")
    .trim()
    .isLength({ min: 1})
    .escape(),
  check("sections", "You need content mate")
    .exists()
    .custom((arr) => {
      return arr.length > 0
    }),
  check("sections.*.index", "Section index missing")
    .exists()
    .isNumeric()
    .withMessage('Section index is not a number'),
  check('sections.*.contentType', 'Section content type missing')
    .trim()
    .isLength({ min: 1})
    .escape(),
  check('images.*.url', "Image url is not string")
    .optional()
    .isURL(),
  check('images.*.header')
    .optional()
    .trim()
    .escape(),
  check('paragraphs.*.text', 'Paragraph empty')
    .trim()
    .isLength({ min: 1})
    .escape(),  
  check('paragraphs.*.header')
    .optional()
    .trim()
    .escape(),
  check('published', "Publish status missing")
    .isBoolean(),
  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log(req.body)
    const post = new Post({ 
      title: req.body.title,
      sections: req.body.sections, 
      images: req.body.images,
      paragraphs: req.body.paragraphs,
      published: req.body.published,
      createdAt: new Date(),
    });
    console.log(errors.array())

    if (!errors.isEmpty()) {
      // Use this for update
      //post.title = validator.unescape(post.title);
      //for (let i = 0; i < post.sections.length; i ++) {
      //  if (post.sections[i].contentType == 'paragraph') {
      //    post.paragraphs[post.sections[i].index].text = validator.unescape(post.paragraphs[post.sections[i].index].text);
      //    if (Object.hasOwn(post.paragraphs[post.sections[i].index], 'header')) 
      //      post.paragraphs[post.sections[i].index].header = validator.unescape(post.paragraphs[post.sections[i].index].header);
      //  }
      //  else {
      //    if (Object.hasOwn(post.images[post.sections[i].index], 'header'))
      //      post.images[post.sections[i].index].header = validator.unescape(post.images[post.sections[i].index].header);
      //  }
      //}
      return res.status(200).json({
          status:'error',
          errors: errors.array(),
        });
    } else {
        await post.save();
        return res.status(200).json({status: 'saved'});
      }    
  }),
])

module.exports = router;
