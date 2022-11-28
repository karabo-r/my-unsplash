require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(fileUpload());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongodb database
mongoose
	.connect(process.env.MONGODB_URI_LOCAL)
	.then(() => console.log("Conntected to database"))
	.catch((error) => console.log(error));

// create schema for user
const defaultValidation = { required: true };
const userSchema = new mongoose.Schema({
	name: { type: String, ...defaultValidation },
	username: { type: String, ...defaultValidation },
	password: { type: String, ...defaultValidation },
	images: [{ type: mongoose.Types.ObjectId, ref: "Images" }],
});

// create schema for image
const imageSchema = new mongoose.Schema({
	name: String,
	data: Buffer,
});

// hide password from returned response
userSchema.set("toJSON", {
	transform: (document, returnedObject) => {
		(returnedObject.id = returnedObject._id.toString()),
			delete returnedObject._id,
			delete returnedObject.__v;
		delete returnedObject.password;
	},
});

// create model from schema
const Users = mongoose.model("Users", userSchema);

// create model from schema
const Images = mongoose.model("Images", imageSchema);

// get all users
app.get("/api/users", async (request, response) => {
	const results = await Users.find({}).populate("images", {id: 1});
	response.json({ data: results });
});

// create user
app.post("/api/users", async (request, response) => {
	const { name, username, password } = request.body;
	const doesUserExist = await Users.find({ username });

	const saltRounds = 10;
	const hashedPassword = await bcrypt.hash(password, saltRounds);

	const newUser = new Users({ name, username, password: hashedPassword });

	if (doesUserExist.length > 0) {
		response.json({ error: "username found" });
	} else {
		const results = await newUser.save();
		response.json(results);
	}
});

// login user
app.post("/api/login", async (request, response) => {
	const { username, password } = request.body;
	const doesUserExist = await Users.findOne({ username });

	if (doesUserExist) {
		const verifyHashedPassword = bcrypt.compare(
			password,
			doesUserExist.password,
		);
		if (verifyHashedPassword) {
			const token = jwt.sign(
				{ username, id: doesUserExist._id },
				process.env.SECRET,
				{
					expiresIn: 86400, // expires in 24 hours
				},
			);
			response.status(200).json({ token });
		} else {
			response.json({ error: "please try again" });
		}
	} else {
		response.json({ error: "you don't exist" });
	}
});

const extractToken = function (request, response, next) {
	const authHeader = request.headers.authorization;
	const token = authHeader.substr(7);

	if (!token) response.json({ error: "token missing" });

	const checkToken = jwt.verify(token, process.env.SECRET);

	if (checkToken) {
		request.user = checkToken;
	} else {
		response.json({ error: "invalid token" });
	}

	next();
};

// upload image for existing user
app.post("/api/upload", extractToken, async (request, response) => {
	const { name, data } = request.files.files;
	const user = request.user;

	// console.log(user);
	if (user) {
		try {
			const newImage = new Images({ name, data });
			const savedImage = await newImage.save();

			const updateUser = await Users.findOne({ _id: user.id });
			updateUser.images.push(savedImage._id);
			const testResults = await updateUser.save();

			console.log(testResults);

			response.json({ message: "new image saved" });
		} catch (error) {
			response.json({ error });
		}
	}
});

// delete image for existing user
app.delete("/api/delete/:id", extractToken, async (request, response) => {
	const user = request.user;
	const id = request.params.id;
	const password = request.body.password;

	const doesUserExist = await Users.findOne({ _id: user.id });

	if (doesUserExist) {
		const verifyPassword = await bcrypt.compare(
			password,
			doesUserExist.password,
		);
		if (verifyPassword) {
			try {
				await Images.findByIdAndDelete(id).then(() => {
					response.status(200).json({ message: "image has been deleted" });
				});
			} catch (error) {
				response.json(error);
			}
		}
	} else {
		response.json({ message: "unauthorized request" });
	}
});

app.listen(PORT, () => console.log("Server running on port", PORT));
