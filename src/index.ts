import { endpoint } from "@octokit/endpoint";
import defaults from "./defaults.js";
import withDefaults from "./with-defaults.js";

export const request = withDefaults(endpoint, defaults);
