import XRay from "x-ray";

export default XRay({
	filters: {
		trim: (value) => (typeof value === "string" ? value.trim() : value),
		cleanTitle: (value) => (typeof value === "string" ? value.replace(/\(.*\)$/, "") : value),
		normalizeWhitespace: (value) => (typeof value === "string" ? value.replace(/\s+/g, " ") : value),
		parseInt: (value) => (typeof value === "string" ? parseInt(value.replace(/[^0-9]/g, "")) : value),
		exists: (value) => !!value,
	},
})
	.concurrency(10)
	.throttle(10, 300);
