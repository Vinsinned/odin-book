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
		res.render('comment_delete', { title: 'Delete Comment' });
	});

};