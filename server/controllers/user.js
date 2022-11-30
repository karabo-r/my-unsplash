const UserRouter = require("express").Router();
const bcrypt = require("bcrypt");
const UserModel = require("../models/user");
const jwt = require("jsonwebtoken");

UserRouter.get("/", async (request, response) => {
	const results = await UserModel.find({}).populate("images", { id: 1 });
	response.json({ data: results });
});

// // create user
UserRouter.post("/", async (request, response) => {
	const { name, username, password } = request.body;
	const doesUserExist = await UserModel.findOne({ username });

	if (doesUserExist) {
		response.json({ error: "username found" });
	} else {
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const newUser = new UserModel({ name, username, password: hashedPassword });

		const results = await newUser.save();
		response.json(results);
	}
});

// login user
UserRouter.post("/login", async (request, response) => {
	const { username, password } = request.body;
	const doesUserExist = await UserModel.findOne({ username });

	if (doesUserExist) {
		const hashedPassword = doesUserExist.password;
		const verifyHashedPassword = bcrypt.compare(password, hashedPassword);

		if (verifyHashedPassword) {
			const userId = doesUserExist._id;
			const token = jwt.sign({ username, id: userId }, process.env.SECRET, {
				expiresIn: 86400, // expires in 24 hours
			});
			response.status(200).json({ token });
		} else {
			response.json({ error: "please try again" });
		}
	} else {
		response.json({ error: "you don't exist" });
	}
});

module.exports = UserRouter;
