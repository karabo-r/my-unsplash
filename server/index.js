require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3001;

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

// get all users
app.get("/api/users", async (request, response) => {
	const results = await Users.find({});
	response.json({ data: results });
});

// create user
app.post("/api/users", async (request, response) => {
	const { name, username, password } = request.body;
	const doesUserExist = await Users.find({ username });
	const newUser = new Users({ name, username, password });

	if (doesUserExist.length > 0) {
		response.json({error: "username found"});
	} else {
		const results = await newUser.save();
		response.json(results);
	}
});

app.listen(PORT, () => console.log("Server running on port", PORT));
