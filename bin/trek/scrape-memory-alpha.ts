import xray from "../../src/common/clients/x-ray.js";

const result = await xray("https://memory-alpha.fandom.com/wiki/The_Man_Trap_(episode)", "body", [
	{
		title: "#firstHeading | trim",
		production: 'aside div[data-source="production"] | afterColon | trim',
		series: xray('aside div[data-source="series"]', ["a"]),
		teleplay: xray('aside div[data-source="teleplay"]', [{ name: "a", href: "a@href" }]),
		story: xray('aside div[data-source="story"]', [{ name: "a", href: "a@href" }]),
		director: xray('aside div[data-source="director"]', [{ name: "a", href: "a@href" }]),
		writer: xray('aside div[data-source="writer"]', [{ name: "a", href: "a@href" }]),
	},
])
	.paginate('div[data-source="all released"] a:has(> div.rarr)@href')
	.limit(2);

console.log(JSON.stringify(result, null, "\t"));
