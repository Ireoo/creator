console.log("#!/bin/sh");
console.log("#", process.platform);
switch (process.platform) {
  case "darwin":
    console.log("sudo npm i -g n");
    console.log("sudo n lts");
    console.log("npm i");
    console.log("sudo npm i -g yarn");
    console.log("yarn");
    break;

  case "win32":
    console.log("Install-Product node 8 x64");
    console.log("choco install yarn --ignore-dependencies");
    console.log("git reset --hard HEAD");
    console.log("node -v");
    console.log("npm -v");
    console.log("yarn");
    break;

  case "linux":
    console.log("nvm --version");
    console.log("nvm install v12.13.1");
    console.log("node -v");
    console.log("npm -v");
    console.log("yarn");
    break;
}
