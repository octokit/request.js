import { endpoint } from "@octokit/endpoint";
import getUserAgent from "universal-user-agent";

const version = "0.0.0-development";
const userAgent = `octokit-request.js/${version} ${getUserAgent()}`;
import withDefaults from "./with-defaults";

export const request = withDefaults(endpoint, {
  headers: {
    "user-agent": userAgent
  }
});
