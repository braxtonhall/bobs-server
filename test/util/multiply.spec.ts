import { multiply } from "../../src/util/multiply";

describe("multiply", () => {
	it("should multiply 1 list", () => {
		const product = Array.from(multiply(["a", "b", "c"]));
		expect(product satisfies [string][]).toEqual([["a"], ["b"], ["c"]]);
	});

	it("should multiply 2 lists", () => {
		const product = Array.from(multiply(["a", "b"], [true, false])) satisfies [string, boolean][];
		expect(product).toEqual([
			["a", true],
			["a", false],
			["b", true],
			["b", false],
		]);
	});

	it("should multiply an empty list", () => {
		const product = Array.from(multiply(["never seen again"], [])) satisfies [string, never][];
		expect(product).toEqual([]);
	});

	it("should multiply 3 lists", () => {
		const product = Array.from(multiply(["a", "b"], [true], [1, 2])) satisfies [string, boolean, number][];
		expect(product).toEqual([
			["a", true, 1],
			["a", true, 2],
			["b", true, 1],
			["b", true, 2],
		]);
	});
});
