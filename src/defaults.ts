import { getUserAgent } from "universal-user-agent";
import { VERSION } from "./version.js";

export default {
  headers: {
    "user-agent": `octokit-request.js/${VERSION} ${getUserAgent()}`,
  },
};
