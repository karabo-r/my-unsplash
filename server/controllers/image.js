const ImageRouter = require("express").Router();
const bcrypt = require("bcrypt");
const UserModel = require("../models/user");
const ImageModel = require("../models/image");

// upload image for existing user
ImageRouter.post("/api/image/upload", async (request, response) => {
	const { name, data } = request.files.files;
	const user = request.user;

	if (user) {
		try {
			const newImage = new ImageModel({ name, data });
			const savedImage = await newImage.save();

			const updateUser = await UserModel.findOne({ _id: user.id });
			updateUser.images.push(savedImage._id);
			await updateUser.save();

			response.json({ message: "new image saved" });
		} catch (error) {
			response.json({ error });
		}
	}
});

// delete image for existing user
ImageRouter.delete("/api/image/delete/:id", async (request, response) => {
	const user = request.user;
	const id = request.params.id;
	const password = request.body.password;

	const doesUserExist = await UserModel.findOne({ _id: user.id });

	if (doesUserExist) {
		const hashedPassword = doesUserExist.password;
		const verifyPassword = await bcrypt.compare(password, hashedPassword);

		if (verifyPassword) {
			try {
				await ImageModel.findByIdAndDelete(id).then(() => {
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

module.exports = ImageRouter;
