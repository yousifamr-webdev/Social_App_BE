import { GraphQLError } from "graphql";
import CustomErr from "./custom.error.js";

export function MapGQLError(err: CustomErr) {
    throw new GraphQLError(err.message||"Internal server error.", {
      extensions: {
        statusCode: err.statusCode || 500,
        cause: err.cause,
        stack: err.stack,
      },
    });
}



export class BadRequestException extends CustomErr {
  constructor(message: string = "Bad Request.", cause?: unknown) {
    super(message, 400, cause);
  }
}

export class UnauthorizedException extends CustomErr {
  constructor(message: string = "Unauthorized.", cause?: unknown) {
    super(message, 401, cause);
  }
}

export class ForbiddenException extends CustomErr {
  constructor(message: string = "Forbidden.", cause?: unknown) {
    super(message, 403, cause);
  }
}

export class NotFoundException extends CustomErr {
  constructor(message: string = "Not Found.", cause?: unknown) {
    super(message, 404, cause);
  }
}

export class ConflictException extends CustomErr {
  constructor(message: string = "Conflict.", cause?: unknown) {
    super(message, 409, cause);
  }
}
