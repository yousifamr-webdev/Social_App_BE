import { GraphQLError } from "graphql";
import CustomErr from "./custom.error.js";
export function MapGQLError(err) {
    throw new GraphQLError(err.message || "Internal server error.", {
        extensions: {
            statusCode: err.statusCode || 500,
            cause: err.cause,
            stack: err.stack,
        },
    });
}
export class BadRequestException extends CustomErr {
    constructor(message = "Bad Request.", cause) {
        super(message, 400, cause);
    }
}
export class UnauthorizedException extends CustomErr {
    constructor(message = "Unauthorized.", cause) {
        super(message, 401, cause);
    }
}
export class ForbiddenException extends CustomErr {
    constructor(message = "Forbidden.", cause) {
        super(message, 403, cause);
    }
}
export class NotFoundException extends CustomErr {
    constructor(message = "Not Found.", cause) {
        super(message, 404, cause);
    }
}
export class ConflictException extends CustomErr {
    constructor(message = "Conflict.", cause) {
        super(message, 409, cause);
    }
}
