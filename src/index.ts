#!/usr/bin/env -S npx tsx

import { select } from "@inquirer/prompts";
import { importLibrary } from "./commands/importLibrary";

let answer;

while (answer !== "exit") {
  answer = await select({
    message: "Select an action",
    choices: [
      {
        name: "Import Library",
        value: "import",
        description: "Import your library from a file",
      },
      {
        name: "Exit",
        value: "exit",
        description: "Exit the application",
      },
    ],
  });

  switch (answer) {
    case "import":
      await importLibrary();
      break;
    case "exit":
      console.log("See you soon!");
      process.exit(0);
  }
}
