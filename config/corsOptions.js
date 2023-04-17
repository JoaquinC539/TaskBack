"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cors = void 0;
class Cors {
    constructor(allowedOrigins) {
        this.corsOption = {
            origin: (origin, callback) => {
                if (allowedOrigins.indexOf(origin) === -1 || !origin) {
                    callback(null, true);
                }
                else {
                    callback(new Error("Not allowed by cors"));
                }
            },
            credentials: true,
            optionSucess: 200
        };
    }
}
exports.Cors = Cors;
