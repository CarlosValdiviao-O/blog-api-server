var express = require('express');
var router = express.Router();
const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const Comment = require('../models/comment');
const { check, validationResult } = require("express-validator");
const validator = require('validator');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null)
    return res.json({status: "You need to login"});
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err)  
      return res.json({status: 'Invalid User'});
    req.user = user;
    next();
  })
}

/* GET home page. */
router.get('/', asyncHandler(async (req, res, next) => {
  const posts = await Post.find({published: true}).exec();
  return res.json({
    posts: posts
  });
}));

router.get('/api', authenticateToken, asyncHandler(async (req, res, next) => {
  const posts = await Post.find().exec();
  return res.json({
    posts: posts
  });
}))

router.post('/login', asyncHandler(async (req, res, next) => {
  const user = req.body;
  if (user.username === 'Carlos' && user.password === process.env.SECRET_PASSWORD) {
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
    return res.json({token: accessToken, status: 'ok'});
  }
  return res.json({status: 'Invalid User'});
}))

router.post('/create', authenticateToken, [
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
      return res.status(200).json({
          status:'error',
          errors: errors.array(),
        });
    } else {
        await post.save();
        return res.status(200).json({status: 'saved', id: post._id});
      }    
  }),
]);

router.get('/post/:id/update', authenticateToken, asyncHandler(async (req, res, next) => {
  const post = await Post.find({_id: req.params.id}).exec();
  return res.json({
    post: post[0],
  })
}));

router.post('/post/:id/update', authenticateToken, [
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
    const post = new Post({ 
      title: req.body.title,
      sections: req.body.sections, 
      images: req.body.images,
      paragraphs: req.body.paragraphs,
      published: req.body.published,
      _id: req.body._id,
    });
    console.log(errors.array())

    if (!errors.isEmpty()) {
      return res.status(200).json({
          status:'error',
          errors: errors.array(),
        });
    } else {
        await Post.findByIdAndUpdate(req.body._id, post, {});
        return res.status(200).json({status: 'saved', id: post._id});
      }    
  }),
]);

router.post('/post/:id/delete', authenticateToken, asyncHandler(async (req, res, next) => {
  await Post.findByIdAndRemove(req.params.id);
  return res.status(200).json({status: 'deleted'});
}))

module.exports = router;
