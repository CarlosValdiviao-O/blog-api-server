
const { getStorage, ref, deleteObject } = require("firebase/storage");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

const firebase = require('firebase/app');

firebase.initializeApp({
  apiKey: "AIzaSyCDh_-AoS40VaWulGmyqZetAmiGq0hBEZo",
  authDomain: "carlos-valdivia-blog-editor.firebaseapp.com",
  projectId: "carlos-valdivia-blog-editor",
  storageBucket: "carlos-valdivia-blog-editor.appspot.com",
  messagingSenderId: "943898005108",
  appId: "1:943898005108:web:7ed1edff6eefc59ecc0b21"
});

const storage = getStorage();
const auth = getAuth();
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

router.get('/', asyncHandler(async (req, res, next) => {
  const posts = await Post.find({published: true}, "title preview").exec();
  return res.json({
    posts: posts
  });
}));

router.get('/api', authenticateToken, asyncHandler(async (req, res, next) => {
  const posts = await Post.find({}, "title preview").exec();
  return res.json({
    posts: posts
  });
}))

router.post('/login', asyncHandler(async (req, res, next) => {
  const user = req.body;
  if (user.username === 'carlosvaldivia390@gmail.com' && user.password === process.env.SECRET_PASSWORD) {
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
    return res.json({token: accessToken, status: 'ok'});
  }
  return res.json({status: 'Invalid User'});
}))

router.post('/create', authenticateToken, asyncHandler(async (req, res, next) => {
  const post = new Post({ 
    title: '',
    sections: [], 
    images: [],
    paragraphs: [],
    preview: '',
    published: false,
    createdAt: new Date(),
  });
  await post.save();
  return res.status(200).json({status: 'saved', id: post._id});        
}));

router.get('/post/:id', asyncHandler(async (req, res, next) => {
  const post = await Post.find({_id: req.params.id}).exec();
  return res.json({
    post: post[0],
  })
}));

router.get('/post/:id/update', authenticateToken, asyncHandler(async (req, res, next) => {
  const post = await Post.find({_id: req.params.id}).exec();
  return res.json({
    post: post[0],
  })
}));

router.post('/post/:id/publish', authenticateToken, [
  // Validate and sanitize fields.
  check("title", "You need a title mate")
    .isLength({ min: 1}),
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
    .isLength({ min: 1}),
  check('images.*.url', "Image url is not a url")
    .optional()
    .isURL(),
  check('images.*.header', "Image header can't be empty")
    .optional()
    .isLength({ min: 1}),  
  check('images.*.name', "Image name can't be empty")
    .optional()
    .isLength({ min: 1}),
  check('paragraphs', 'You need some text')
    .exists()
    .custom((arr) => {
      return arr.length > 0
    }),
  check('paragraphs.*.text', 'Paragraph empty')
    .isLength({ min: 1}),  
  check('paragraphs.*.header', "Paragraph header can't be empty")
    .optional()
    .isLength({ min: 1}),
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
      preview: req.body.preview,
      published: true,
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
        return res.status(200).json({status: 'published', id: post._id});
      }    
  }),
]);

router.post('/post/:id/save', authenticateToken, asyncHandler(async (req, res, next) => {
  const post = new Post({ 
    title: req.body.title,
    sections: req.body.sections, 
    images: req.body.images,
    paragraphs: req.body.paragraphs,
    preview: req.body.paragraphs[0].text.substring(0, 150),
    published: false,
    _id: req.body._id,
  });
  await Post.findByIdAndUpdate(req.body._id, post, {});
  return res.status(200).json({status: 'saved', id: post._id});        
}));

router.post('/post/:id/delete', authenticateToken, asyncHandler(async (req, res, next) => {
  const post = await Post.find({_id: req.params.id}).exec();
  await signInWithEmailAndPassword(auth,'carlosvaldivia390@gmail.com', process.env.SECRET_PASSWORD)
  for (let i = 0; i < post[0].images.length; i++) {
    const imageRef = ref(storage, post[0].images[i].name);
        deleteObject(imageRef).then(() => {
            console.log('image deleted')
        }).catch((err) => {
            console.error(err);
        })
  }
  await Post.findByIdAndRemove(req.params.id);
  return res.status(200).json({status: 'deleted'});
}))

router.post('/post/:id/comment', [
  // Validate and sanitize fields.
  check("author")
    .trim()
    .optional({values: 'falsy'})
    .isLength({ max: 30 })
    .withMessage(`Author's name is too long`)
    .isLength({ min: 2 })
    .withMessage(`Author's name is too short`)
    .escape(),
  check("text", "Text is missing")
    .trim()
    .exists()
    .custom((text) => {
      return text ? true : false
    })
    .isLength({ max: 800 })
    .withMessage('Comment is too long')
    .escape(),
  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    const comment = new Comment({ 
      author: req.body.author || 'Unknown',
      text: req.body.text, 
      post: req.body.post,
      createdAt: new Date(),
    });
    console.log(errors.array())

    if (!errors.isEmpty()) {
      return res.status(200).json({
          status:'error',
          errors: errors.array(),
        });
    } else {
        await comment.save();
        return res.status(200).json({status: 'published'});
      }    
  }),
]);

router.get('/post/:id/comments', asyncHandler(async (req, res, next) => {
  let comments = await Comment.find({post: req.params.id}).exec();
  comments.forEach(comment => {
    comment.author = validator.unescape(comment.author);
    comment.text = validator.unescape(comment.text);
  })
  return res.json({
    comments: comments
  })
}))

router.post('/post/:id/comment/:commid/delete', authenticateToken, asyncHandler(async (req, res, next) => {
  const comment = await Comment.find({_id: req.params.commid}).exec();
  await Comment.findByIdAndRemove(req.params.commid);
  return res.status(200).json({status: 'deleted'});
}))

module.exports = router;
