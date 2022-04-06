var express = require('express');
var router = express.Router();

var User = require('../models/user');
var passport = require('passport');
var bcrypt = require('bcryptjs');
const controller = require('../controllers/userController');
const { body, validationResult, check } = require('express-validator');

var app = express();

router.get('/sign-up', function (req, res, next) {
  return res.render('sign_up', { title: 'Sign Up', user: req.user });
});

router.post('/sign-up', [
	body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('last_name').trim().isLength({ min: 1 }).escape().withMessage('Last name must be specified.')
    .isAlphanumeric().withMessage('Last name has non-alphanumeric characters.'),
	check('username').normalizeEmail().isEmail(),
  check('password').exists(),
  check(
    'confirmPassword',
    'Password confirmation field must have the same value as the password field',
  )
  .exists()
  .custom((value, { req }) => value === req.body.password),
	
  (req, res, next) => {

    const errors = validationResult(req);
    let image;
    if (req.body.image.length === 0) {
      image = 'none';
    } else {
      image = req.body.image;
    }

    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) { return next(err) }

      const user = new User({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        facebook_id: false,
        username: req.body.username,
        password: hashedPassword,
        image: image
      })

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/errors messages.
        res.render('sign_up', { title: 'Sign Up', user: user, errors: errors.array() });
        return;
      }
      else {
        // Data from form is valid.

        // Save author.
        user.save(function (err) {
          if (err) { return next(err); }
          // Successful - redirect to new author record.
          //res.redirect(user.url);
          return res.redirect('/');
        });
      }
    })
  }
	
]);

router.get('/log-in', (req, res, next) => {
  console.log(req.user)
  res.render('log_in', { title: 'Log In', user: req.user });
})

router.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/'
  })
);

router.get('/log-out', (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get('/log-in-facebook', checkLoggedIn,
  passport.authenticate('facebook', { failureRedirect: '/log-in', failureMessage: true, scope: ['email'] }),
  function(req, res) {
  res.redirect('/');
});

router.get('/users', controller.user_list);

router.get('/:id/friends/add/:localsId', protectRoute, controller.add_friend);

router.get('/:id/friends/cancel/:localsId', protectRoute, controller.remove_request);

router.get('/:id/friends/accept/:localsId', protectRoute, controller.accept_friend);

router.get('/:id/friends/remove/:localsId', protectRoute, controller.remove_friend);

router.get('/:id', controller.user_detail);

function checkLoggedIn(req,res,next){
  if(req.user !== undefined){
    res.render('facebook_error', { title: 'You Already Logged In!' })
  } else{
    next();
  }
}


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