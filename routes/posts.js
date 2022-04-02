var express = require('express');
var router = express.Router();

var User = require('../models/user');
const controller = require('../controllers/postsController');
const commentController = require('../controllers/commentsController');
const { body, validationResult, check } = require('express-validator');

router.get('/', controller.post_list);

router.get('/create', protectRoute, controller.post_create_get);

router.post('/create', protectRoute, controller.post_create_post);

router.get('/delete/:id', protectRoute, controller.post_delete_get);

router.post('/delete/:id', protectRoute, controller.post_delete_post);

router.get('/update/:id', protectRoute, controller.post_update_get);

router.post('/update/:id', protectRoute, controller.post_update_post);

router.get('/like/:id', protectRoute, controller.post_like);

router.get('/unlike/:id', protectRoute, controller.post_unlike);

router.get('/:id', controller.post_detail);

//comments

router.get('/comments/create/:id', protectRoute, commentController.comment_create_get);

router.post('/comments/create/:id', protectRoute, commentController.comment_create_post);

router.get('/:postId/comments/delete/:id', protectRoute, commentController.comment_delete_get);

router.post('/:postId/comments/delete/:id', protectRoute, commentController.comment_delete_post);

router.get('/:postId/comments/update/:id', protectRoute, commentController.comment_update_get);

router.post('/:postId/comments/update/:id', protectRoute, commentController.comment_update_post);

function protectRoute(req,res,next){
  // if user exists the token was sent with the request
  if(req.user){
   //if user exists then go to next middleware
     next();
  }
// token was not sent with request send error to user
  else{
     res.status(500).json({error:'login is required'});
  }
}

module.exports = router;