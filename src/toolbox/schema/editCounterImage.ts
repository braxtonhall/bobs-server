import { z } from "zod";
import { ImageViewBehaviour } from "./ImageViewBehaviour";

export const editCounterImageSchema = z.object({
	behaviour: z.nativeEnum(ImageViewBehaviour),
	amount: z.coerce.number().int(),
});
