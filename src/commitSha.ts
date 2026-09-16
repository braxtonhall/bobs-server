import fs from "fs";
import path from "path";

const COMMIT_SHA_PATH = path.join(__dirname, "..", "..", "commit-sha.txt");

export default (() => {
	try {
		return fs.readFileSync(COMMIT_SHA_PATH, "utf-8").trim();
	} catch {
		return undefined;
	}
})();
