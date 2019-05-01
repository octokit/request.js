declare module "deprecation" {
  export = Deprecation;
  class Deprecation extends Error {
    name: "Deprecation";
    stack?: string;
  }
}
