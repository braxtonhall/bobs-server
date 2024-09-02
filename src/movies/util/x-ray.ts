import XRay from "x-ray";

export default XRay({
	filters: {
		trim: (value) => (typeof value === "string" ? value.trim() : value),
		cleanTitle: (value) => (typeof value === "string" ? value.replace(/\(.*\)$/, "") : value),
		normalizeWhitespace: (value) => (typeof value === "string" ? value.replace(/\s+/g, " ") : value),
	},
})
	.concurrency(10)
	.throttle(10, 300);
