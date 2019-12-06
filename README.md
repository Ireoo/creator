# integem-creator

> integem creator ui

## Install dependencies

```bash
npm install
```

## Pack

```bash
npm run build:dir

# find packed file under /build folder
```

## Build For Install

```bash
npm run build

# 通过源码打包程序
npm run build:source

# 不打包tools文件，适用于chromebook
npm run build:chromebook

# This would generate install file `.exe` in window and `.dmg` in macOS
```

## Test

```bash
npm run test
```

## Development

```bash
npm run dev
```

# Docs

## Project Structure

- `build` All files build by `npm run build` will be here, Executable file will be here too.
- `dist` All files build by webpack will be place here.
- `static` Static file. You can use those files by `__static` variable.
- `test` Test Folder
- `src` Source file
  - `main` electron thread program
  - `renderer` web thread program
  - `type` Flow type

# Project related information

- leancloud:
  - email: jzhu@integem.com
  - password: Integem.com123

## FAQ

- How to add parameter in transition/action?
  - First, in `src/renderer/static/form.js` file, you can add item in transition/action array.
  - In ui, It will auto generate by config in above file. So don't change any ui.
  - In export, change `formatStage` function in `src/renderer/lib/project.js`, add output code.
    -Also change `defaultParameterValue` variable in `src/type/stage.js` file.

* How to change Parameter on the right side?

  - change `defaultParameterValue` variable in `src/type/stage.js` file.
  - change ui in `src/renderer/pages/parameter/Form.vue`
  - In export, change `formatParameter` function in `src/renderer/lib/project.js`
  - In table, change `src/renderer/table/Parameter.vue`

* Can't run cmd script?
  - app path must not have special charactors\spaces

# build on APPVEYOR cloud

- ## windows: use ps

```sh
# install script
Install-Product node 8 x64
choco install yarn --ignore-dependencies
git reset --hard HEAD
yarn
node --version

# build script
yarn build
```

- ## Mac OS: use sh

```sh
# install script
sudo npm i -g n
sudo n lts
node -v
npm -v
sudo npm i -g yarn@latest
yarn

# build script
yarn build
```

- ## linux: use sh

```sh
# install script
nvm --version
nvm install v12.13.1
npm -v
node -v
yarn

# build script
yarn build
```
