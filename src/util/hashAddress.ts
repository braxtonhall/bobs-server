import { createHash } from "crypto";

export const hashAddress = (address: string) => createHash("sha256").update(address.trim().toLowerCase()).digest("hex");
