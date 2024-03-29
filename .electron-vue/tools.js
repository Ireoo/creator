const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const yaml = require('js-yaml')
const AdmZip = require('adm-zip')
const consola = require('consola')
const request = require('request')
const progress = require('request-progress')
const ProgressBar = require('progress')
const moment = require('moment')
require('moment-precise-range-plugin')
const isZip = require('is-zip')
const { execSync, exec } = require('child_process')

let from,
  to,
  file = `${process.platform}_zip`

switch (process.platform) {
  case 'darwin':
    from = 'mac'
    to = 'mac-unpacked'
    break

  case 'win32':
    from = 'win-unpacked'
    to = 'win-unpacked'
    break

  case 'linux':
    from = 'linux-unpacked'
    to = 'linux-unpacked'
    break
}

const download = (url, dir, cb) => {
  const bar = new ProgressBar(`${dir} [:bar] :percent :etas`, {
    complete: '=',
    incomplete: '-',
    width: 40,
    total: 1
  })
  let barr = 0
  if (fs.existsSync(dir)) {
    bar.tick(0.99)
    console.log('  √')
    cb()
  } else {
    progress(request(url), {})
      .on('progress', function(state) {
        // The state is an object that looks like this:
        // {
        //     percent: 0.5,               // Overall percent (between 0 to 1)
        //     speed: 554732,              // The download speed in bytes/sec
        //     size: {
        //         total: 90044871,        // The total payload size in bytes
        //         transferred: 27610959   // The transferred payload size in bytes
        //     },
        //     time: {
        //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
        //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
        //     }
        // }
        bar.tick(state.percent - barr)
        barr = state.percent
      })
      .on('error', function(err) {
        // Do something with err
        console.log('  ×')
        console.log(err)
        download(url, dir, cb)
      })
      .on('end', function() {
        // Do something after request finishes
        if (!isZip(fs.readFileSync(dir))) {
          console.log('  ×')
          download(url, dir, cb)
        } else {
          // bar.tick(1 - barr);
          console.log('  √')
          setTimeout(() => {
            cb()
          }, 1000 * 10)
        }
      })
      .pipe(fs.createWriteStream(dir))
  }
}

const run = soft => {
  return new Promise(async (reslove, reject) => {
    const dirs = fs.readdirSync(path.join(process.cwd(), 'tools/', soft, to))
    // console.log(dirs.length);
    if (dirs.length <= 2) {
      axios(`https://tools.integem.com/${soft}/info.yml`).then(info_data => {
        // let info;
        // try {
        //   info = yaml.safeLoad(
        //     (await axios(`https://tools.integem.com/${soft}/info.yml`)).data
        //   );
        // } catch (e) {
        //   reject(e);
        // }
        let info = yaml.safeLoad(info_data.data)
        // console.log(info);
        consola.info(
          `Starting download file "https://tools.integem.com/${soft}/${info.download[`${process.platform}_zip`]}"`
        )

        download(
          `https://tools.integem.com/${soft}/${info.download[`${process.platform}_zip`]}`,
          `./tmp/${info.download[`${process.platform}_zip`]}`,
          () => {
            let zip
            switch (process.platform) {
              case 'darwin':
                try {
                  execSync(`cd tmp && unzip ${info.download[`${process.platform}_zip`]}`)
                  fs.moveSync(`./tmp/${soft}.app`, `./tools/${soft}/${to}/${soft}.app`)
                  // fs.unlinkSync(path.join(__dirname, `../tmp/${soft}.app`));
                  console.log(`${soft} is done!`)
                } catch (e) {
                  console.log(e)
                }
                reslove()
                break

              case 'win32':
                zip = new AdmZip(`./tmp/${info.download[`${process.platform}_zip`]}`)
                zip.getEntries()
                zip.extractAllTo(`./tools/${soft}/${to}`, true)
                console.log(`${soft} is done!`)
                reslove()
                break

              default:
                zip = new AdmZip(`./tmp/${info.download[`${process.platform}_zip`]}`)
                zip.getEntries()
                zip.extractAllTo(`./tools/${soft}/${to}`, true)
                let to_path = path.join(process.cwd(), `./tools/${soft}/${to}/${soft.toLowerCase()}`)
                console.log(`[exec] chmod +x ${to_path}`)
                // exec(
                //   `chmod +x ${to_path}`
                // , (err, a, b) => {
                //     console.log(err, a, b)
                //     console.log(`${soft} is done!`);
                //     reslove();
                //   });
                fs.chmod(`./tools/${soft}/${to}/${soft.toLowerCase()}`, 0o775, err => {
                  if (err) throw err
                  console.log(`文件 “./tools/${soft}/${to}/${soft.toLowerCase()}” 的权限已被更改`)
                  console.log(`${soft} is done!`)
                  reslove()
                })

                break
            }
          }
        )
      })
    }
  })
}

;(async () => {
  if (!fs.existsSync('tmp')) fs.mkdirSync('tmp')
  for (let k in ['iPic', 'iDownloader']) {
    // ["iPic", "iDownloader"].forEach(async k => {
    try {
      await run(['iPic', 'iDownloader'][k])
    } catch (e) {
      console.log(e.message)
    }
  }
})()
