import { z } from "zod";
import { emailSchema } from "./email";

export const subscribeSchema = z.object({ email: emailSchema });
