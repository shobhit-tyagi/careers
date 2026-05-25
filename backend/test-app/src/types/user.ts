import {Type} from "@sinclair/typebox";

export const UpdateProfileBody = Type.Object({
    displayName: Type.Optional(Type.String()),
});