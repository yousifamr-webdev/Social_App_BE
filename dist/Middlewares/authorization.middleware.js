import { GraphQLError } from "graphql";
import { BadRequestException, ForbiddenException, MapGQLError } from "../common/exceptions/domain.exceptions.js";
function authorizationGQL(userRole, endpointRoles) {
    if (!endpointRoles.includes(userRole)) {
        MapGQLError(new BadRequestException("You don't have authorization."));
    }
}
export default authorizationGQL;
