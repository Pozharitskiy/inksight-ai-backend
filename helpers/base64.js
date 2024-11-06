const fs = require("fs");

async function saveBase64ToFile(base64String, outputPath) {
  const matches = base64String.match(/^data:(.*);base64,(.*)$/);
  let imageData = base64String;
  if (matches) {
    imageData = matches[2];
  }
  const buffer = Buffer.from(imageData, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`File saved to ${outputPath}`);
}

function getBase64(base64String) {
  const matches = base64String.match(/^data:(.*);base64,(.*)$/);
  if (matches) {
    return matches[2];
  }
  return base64String;
}

module.exports = { getBase64, saveBase64ToFile };
