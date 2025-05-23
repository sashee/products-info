import {fetchData} from "./fetcher.ts";
import fs from "node:fs/promises";
import {isDeepStrictEqual} from "node:util";
import { promisify } from "node:util";
import { exec } from "node:child_process";

const execProm = promisify(exec);

const newData = await fetchData();
const currentData = JSON.parse(await fs.readFile("./data.json", "utf8"));

// stringify -> parse so that it gets rid of json problems
// such as no support for undefined
if (!isDeepStrictEqual(JSON.parse(JSON.stringify(newData)), currentData)) {
	await fs.writeFile("./data.json", JSON.stringify(newData, undefined, 4));
	await execProm("git add .");
	await execProm(`git commit -m "update data.json"`);
	await execProm("git push");
}

