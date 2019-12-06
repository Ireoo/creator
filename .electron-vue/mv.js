const fs = require("fs-extra");
const path = require("path");

console.log(`This system is ${process.platform}`);
let from,
  to,
  soft = process.argv[2];

switch (process.platform) {
  case "darwin":
    from = "mac";
    to = "mac-unpacked";
    break;

  case "win32":
    from = "win-unpacked";
    to = "win-unpacked";
    break;

  case "linux":
    from = "linux-unpacked";
    to = "linux-unpacked";
    break;
}

try {
  const dirs = fs.readdirSync(path.join(process.cwd(), "tools", soft, to));
  console.log(dirs.length);
  if (dirs.length === 1) {
    fs.copySync(
      path.join(process.cwd(), "tmp", soft, "build", from),
      path.join(process.cwd(), "tools", soft, to)
    );
  }
  console.log("success!");
} catch (err) {
  console.error(err);
}
