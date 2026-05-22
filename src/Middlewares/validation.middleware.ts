import type { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../common/exceptions/domain.exceptions.js";
import { type ZodType, type ZodError, z } from "zod";
import { GenderEnum } from "../common/enums/user.enums.js";
import { Types } from "mongoose";

type KeyReqType = keyof Request;

export function validation(
  validationSchema: Partial<Record<KeyReqType, ZodType>>,
  filesInBody = false,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrs: { path: PropertyKey[]; message: string }[] = [];

    for (const key of Object.keys(validationSchema) as KeyReqType[]) {
      if (validationSchema[key] == undefined) {
        continue;
      }

      if (key == "body" && filesInBody == true) {
        req.body.files = req.files;
      }

      const validationResult = validationSchema[key]!.safeParse(req[key]);

      if (!validationResult.success) {
        validationErrs.push(
          ...validationResult.error.issues.map((ele: any) => {
            return {
              path: ele.path,
              message: ele.message,
            };
          }),
        );
      }
    }

    if (validationErrs.length > 0) {
      return next(
        new BadRequestException("Invalid Validation.", {
          validationErrs,
        }),
      );
    }

    return next();
  };
}

export const commonValidationFields = {
  id: z.string().refine((value) => {
    return Types.ObjectId.isValid(value);
  }, "Invalid ObjectId"),
  userName: z
    .string()
    .min(3, { error: "username can not be less than 3 chars." })
    .max(10, { error: "username can not be more than 10 chars." }),
  password: z
    .string()
    .regex(
      new RegExp(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,16}/),
    ),

  email: z.email(),
  age: z.number().positive(),
  gender: z.enum(GenderEnum),
  phone: z.string().regex(new RegExp(/^(\+201|00201|01)(0|1|2|5)\d{8}$/)),
  OTP: z.string().regex(new RegExp(/\d{6}/)),
};
