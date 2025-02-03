import crypto from "crypto";
import { HashedString } from "./types/hashed.js";

export const hashString = (string: string): HashedString =>
	crypto.createHash("sha256").update(string).digest("base64") as HashedString;
