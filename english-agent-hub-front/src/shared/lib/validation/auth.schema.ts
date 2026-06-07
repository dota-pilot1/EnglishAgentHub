import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/;

// Messages are i18n keys in the "form" namespace. Translate at display time
// via `t(error.message, { ns: "form" })`.
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "emailRequired")
      .max(255, "emailTooLong")
      .email("emailInvalid"),

    password: z
      .string()
      .min(1, "passwordRequired")
      .regex(PASSWORD_REGEX, "passwordPattern"),

    passwordConfirm: z.string().min(1, "passwordConfirmRequired"),

    username: z
      .string()
      .min(2, "usernameTooShort")
      .max(50, "usernameTooLong"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "passwordMismatch",
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "emailRequired").email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
