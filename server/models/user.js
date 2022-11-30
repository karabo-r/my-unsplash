const mongoose = require("mongoose")

const defaultValidation = { required: true };
const userSchema = new mongoose.Schema({
	name: { type: String, ...defaultValidation },
	username: { type: String, ...defaultValidation },
	password: { type: String, ...defaultValidation },
	images: [{ type: mongoose.Types.ObjectId, ref: "Images" }],
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

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel