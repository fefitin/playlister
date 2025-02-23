#!/usr/bin/env -S npx tsx

import { select } from "@inquirer/prompts";
import { importLibrary } from "./commands/importLibrary";
import { embedLibrary } from "./commands/embedLibrary";
import { generatePlaylist } from "./commands/generatePlaylist";

let answer;

while (answer !== "exit") {
  answer = await select({
    message: "Select an action",
    choices: [
      {
        name: "Generate Playlist",
        value: "generate",
        description: "Generate a playlist based on a prompt",
      },
      {
        name: "Import Library",
        value: "import",
        description: "Import your library from a file",
      },
      {
        name: "Embed Library",
        value: "embed",
        description: "Embed your imported library in a vector database",
      },
      {
        name: "Exit",
        value: "exit",
        description: "Exit the application",
      },
    ],
  });

  switch (answer) {
    case "generate":
      await generatePlaylist();
      break;
    case "import":
      await importLibrary();
      break;
    case "embed":
      await embedLibrary();
      break;
    case "exit":
      console.log("See you soon!");
      process.exit(0);
  }
}
