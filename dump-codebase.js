const fs = require("fs");
const path = require("path");

const ROOT_DIR = "./"; // change if needed
const OUTPUT_FILE = "codebase_dump.md";

// folders to ignore
const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next"];

// file extensions to include
const ALLOWED_EXT = [".js", ".ts", ".jsx", ".tsx", ".json", ".md", ".css", ".html"];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some(dir => filePath.includes(dir));
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);

    if (shouldIgnore(fullPath)) return;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      const ext = path.extname(fullPath);
      if (ALLOWED_EXT.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  });

  return fileList;
}

function generateDump() {
  const files = walk(ROOT_DIR);

  let output = "# Codebase Dump\n\n";

  files.forEach(file => {
    const content = fs.readFileSync(file, "utf-8");

    output += `\n\n---\n`;
    output += `## FILE: ${file}\n\n`;
    output += "```" + path.extname(file).slice(1) + "\n";
    output += content + "\n";
    output += "```\n";
  });

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Dump created: ${OUTPUT_FILE}`);
}

generateDump();
