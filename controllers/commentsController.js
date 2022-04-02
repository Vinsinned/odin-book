var async = require('async')
const User = require('../models/user');
const Post = require('../models/posts');
const Comment = require('../models/comments');
const { body, validationResult, check } = require('express-validator');

exports.comment_create_get = function(req, res, next) {

	res.render('comment_form', {title: 'Create Comment' } );

};

exports.comment_create_post = [

	// Validate and sanitize fields.
	body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape()
	.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
	body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
	// Process request after validation and sanitization.
	(req, res, next) => {
		

		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a Comment object with escaped and trimmed data.
		var comment = new Comment({
			title: req.body.title,
			content: req.body.content,
			timestamp: new Date().toISOString(),
			post: req.params.id,
			user: req.user.id
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.
			
			res.render('comment_form', { title: 'Create Comment', comment: req.body, errors: errors.array() });
			return;
		}
		else {
			// Data from form is valid. Save comment.
			comment.save(function (err) {
				if (err) { return next(err); }
					// Successful - redirect to new book record.
					res.redirect('/posts/' + req.params.id);
				});
		}
	}
];

exports.comment_delete_get = function (req, res, next) {

	Comment.findById(req.params.id)
	.exec(function (err, result) {
		if (err) { return next(err); }
		if (result == null) { // No results.
			res.redirect('/posts');
		}
		// Successful, so render.
		res.render('comment_delete', { title: 'Delete Comment', comment: result });
	});

};

exports.comment_delete_post = function (req, res, next) {

	Comment.findByIdAndRemove(req.params.id, function deleteComment(err) {
		if (err) { return next(err); }
		// Success - go to author list.
		res.redirect('/posts/' + req.params.postId)
	})

};

exports.comment_update_get = function (req, res, next) {

	Comment.findById(req.params.id, function (err, comment) {
		if (err) { return next(err); }
		if (comment == null) { // No results.
				var err = new Error('Author not found');
				err.status = 404;
				return next(err);
		}
		// Success.
		res.render('comment_form', { title: 'Update Comment', comment: comment });

	});

};

exports.comment_update_post = [

	// Validate and sanitize fields.
	body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape()
	.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
	body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
	// Process request after validation and sanitization.
	(req, res, next) => {

		// Extract the validation errors from a request.
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.
			
			res.render('comment_form', { title: 'Create Comment', comment: req.body, errors: errors.array() });
			return;
		}
		else {
			// Data from form is valid. Save comment.
			Comment.findByIdAndUpdate(req.params.id, { title: req.body.title, content: req.body.content }, function (err) {
				if (err) { return next(err); }
				// Successful - redirect to new book record.
				res.redirect('/posts/' + req.params.postId);
			});
		}
	}
];