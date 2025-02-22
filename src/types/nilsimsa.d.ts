declare module "nilsimsa" {
  class Nilsimsa {
    constructor(input: string);
    digest(format: "hex" | "binary"): string;
    static compare(hash1: string, hash2: string): number;
  }
  export { Nilsimsa };
}
