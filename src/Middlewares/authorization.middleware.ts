import { GraphQLError } from "graphql";
import type { RoleEnum } from "../common/enums/user.enums.js";
import { BadRequestException, ForbiddenException, MapGQLError } from "../common/exceptions/domain.exceptions.js";

function authorizationGQL(userRole: RoleEnum, endpointRoles: RoleEnum[]) {
  if (!endpointRoles.includes(userRole)) {
  MapGQLError(new BadRequestException("You don't have authorization."))
  }
}

export default authorizationGQL;
