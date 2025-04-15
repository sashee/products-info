import {JSDOM} from "jsdom";

const booksAndCourses = [
	"https://www.graphql-on-aws-appsync-book.com/",
	"https://www.s3-cloudfront-signed-urls-book.com/",
	"https://www.async-await-in-javascript-book.com/",
	"https://iam-book.advancedweb.hu/",
];

const loadImageToDataUri = async (url: string) => {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error("failed to load " + url + " " + await res.text());
	}
	const image = Buffer.from(await res.arrayBuffer());
	const contentType = res.headers.get("content-type");
	return `data:${contentType};base64,${image.toString("base64")}`;
};

const getData = async (url: string) => {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error("failed: " + await res.text());
	}
	const html = await res.text();
	const dom = new JSDOM(html);
	const items = (await Promise.all([...dom.window.document.querySelectorAll("script[type='application/ld+json']")].map(async (jsonldTag) => {
		const document = JSON.parse(jsonldTag.innerHTML);
		const price = (() => {
			if (!document.offers) {
				return null;
			}
			if (Array.isArray(document.offers) && document.offers.length !== 1) {
				throw new Error("Don't know how to parse multiple offers");
			}
			const offerObject = Array.isArray(document.offers) ? document.offers[0] : document.offers;
			if (offerObject.price && offerObject.priceCurrency) {
				return {
					price: Number(offerObject.price),
					priceCurrency: offerObject.priceCurrency,
				};
			}
		})();
		if (document["@type"] === "Book") {
			if (document.url && document.name && document.alternativeHeadline && document.keywords && document.image.url) {
				return [{
					type: "Book",
					id: document["@id"],
					url: document.url,
					name: document.name,
					alternativeHeadline: document.alternativeHeadline,
					keywords: document.keywords,
					image: await loadImageToDataUri(document.image.url),
					price,
				}]
			}else {
				console.error("Invalid book");
				return [];
			}
		}
		if (document["@type"] === "Course") {
			if (document.url && document.name && document.description && document.keywords && document.image.url) {
				return [{
					type: "Course",
					id: document["@id"],
					url: document.url,
					name: document.name,
					description: document.description,
					keywords: document.keywords,
					image: await loadImageToDataUri(document.image.url),
					price,
				}];
			}else {
				console.error("Invalid course");
				return [];
			}
		}
		return [];
	}))).flat(1);
	return items;
};

export const fetchData = async () => {
	return (await Promise.all(booksAndCourses.map(async (url) => {
		return getData(url);
	}))).flat(1);
};
