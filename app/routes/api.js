var User= require('../models/user');

var Story = require('../models/story');

var config = require('../../config');

var jsonwebtoken = require('jsonwebtoken');

var secretKey = config.secretKey;

function createToken(user){
	var token = jsonwebtoken.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expiresInMinute:1440
	});

	return token;
}

module.exports = function(app, express, io){

	var api = express.Router();


	api.get('/all_stories', function(req, res){
		console.log("api get andar");
		Story.find({}, function(err, stories){
			if(err){
				console.log("error in stories");
				res.send(err);
				return;
			}
			console.log("mil gyi stories");
			res.json(stories);
		});
	});


	api.post('/signup', function(req, res){
		console.log("there is an request");

		var user = new User({
			name: req.body.name,
			username: req.body.username,
			password: req.body.password
		});
		console.log("user save karan se phle"+user.name);

		var token = createToken(user);

		user.save(function(err, user){
			console.log("user ko save kAro");
			if(err){
				res.send(err);
				console.log("errror a gyi re"+err);
				return;
			}
			console.log("kaam ho gyo re bhai");
			res.json({
				success: true,
				message: "User has been created. Check in mongoLab",
				token: token
			})
		});
	});
	api.get('/users',function(req, res){
		User.find({}, function(err, users){
			if(err){
				res.send(err);
				return;
			}
			res.json(users);
		});
	});

	api.post('/login', function(req, res){
		User.findOne({
			username:req.body.username
		}).select('name username password').exec(function(err, user){
			if(err) throw err;

			if(!user){
				res.send({message: " User doesn't exist"});
			}else if(user){
				var validPassword = user.comparePassword(req.body.password)	;

				if(!validPassword){
					res.send({message:"Invalid password"});
				} else{
					////// token
					var token = createToken(user);
					res.json({
						success: true,
						message:"successful login !!",
						token: token
					});
				}
			}

		});
	});

	api.use(function(req, res, next){

		console.log("somebody just came to our app! ");
		var token =  req.body.token || req.param('token') || req.headers['x-access-token'];

		//check if token exists
		if(token){

			jsonwebtoken.verify(token, secretKey, function(err, decoded){
				if(err){
					res.status(403).send({success: false, message:" Failed to authenticate user"});					
				}
				else{
					// Go to next route
					req.decoded = decoded;

					next();
				}
			});
		} else {
			res.status(403).send({success: false, message:"No token provided! "});
		}
	});


	//Destination B // To go to B Provide a legitimate token

	// api.get('/', function(req, res){
	// 	res.json("Hello Middleware");
	// });

	api.route('/')

		.post(function(req, res){
 			
 			var story = new Story({
 				creator: req.decoded.id,
 				content: req.body.content
 			});
 			
		story.save(function(err, newStory){
			if(err){
				res.send(err);
				return
			}
			io.emit('story', newStory)
			res.json({message: " New story created"});
		});

	})

		.get(function(req, res){
			Story.find({creator: req.decoded.id}, function(err, stories){
				if(err){
					res.send(err);
					return;
				}

				res.send(stories);
			});

		});

	api.get('/me', function(req, res) {
		res.send(req.decoded);
	});

	return api;


}