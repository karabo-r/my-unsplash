const extractToken = function (request, response, next) {
	const authHeader = request.headers.authorization;
	const token = authHeader.substr(7);

	if (!token) response.json({ error: "token missing" });

	const verifyToken = jwt.verify(token, process.env.SECRET);

	if (verifyToken) {
		request.user = verifyToken;
	} else {
		response.json({ error: "invalid token" });
	}

	next();
};

const middleware = { extractToken };
module.exports = middleware;
