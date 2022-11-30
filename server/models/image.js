const mongoose = require("mongoose")

// create schema for image
const imageSchema = new mongoose.Schema({
	name: String,
	data: Buffer,
});

const ImageModel = mongoose.model("Image", imageSchema);

module.exports = ImageModel