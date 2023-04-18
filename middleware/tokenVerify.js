"use strict";
const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: "Access Denied" });
    }
    try {
        const hash = token.split(" ");
        const verified = jwt.verify(hash, process.env.TOKEN);
        next();
    }
    catch (error) {
        res.status(400).json({ error: "Authorization rejected", description: error });
    }
};
