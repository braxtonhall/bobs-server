import { z } from "zod";
import { emailSchema } from "./email.js";

export const subscribeSchema = z.object({ email: emailSchema });
