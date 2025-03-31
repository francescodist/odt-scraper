const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const fs = require('fs');

      const parseFilename = (fileName) => {
        return fileName.replace(/[^A-Za-z0-9 \/\.\'\-]/g, ' - ').replace(/ +(?= )/g,'').trim();
      }

      on('task', {
        moveFile({from, to}) {
          if(!fs.existsSync(parseFilename(to).split('/').slice(0,-1).join('/')))
            fs.mkdirSync(parseFilename(to).split('/').slice(0,-1).join('/'))
          fs.rename(parseFilename(from), parseFilename(to), function (err) {
            if (err) setTimeout(() => fs.rename(parseFilename(from), parseFilename(to), (errRetry) => {
              console.log('successful after retry', from);
              if(errRetry) {
                const [provincia, comune] = parseFilename(to).split('/').slice(-2)
                fs.appendFileSync('missingComuni.txt',`${provincia} - ${comune.split('.')[0]}\n`, {encoding: 'utf-8'})
              }
            }), 5000)
            console.log('Successfully renamed', parseFilename(from))
          })

          return null
        },
        checkExists(fileName) {
          if(fs.existsSync(parseFilename(fileName))) console.log(parseFilename(fileName), 'already exists!')
          return fs.existsSync(parseFilename(fileName))
        },
        logMissing(fileName) {
          console.log(`NO DATA - Skip ${parseFilename(fileName)}`);
          return null;
        },
        logProgress({i, list}) {
          console.log(Math.floor(i/list.length*100), '% DONE')
          return null
        },storeProvinciaDone(provincia) {
          fs.writeFileSync('provinciaDone.txt', provincia, {encoding: 'utf-8'});
          return null;
        }, getProvinciaDone() {
          try{
            return fs.readFileSync('provinciaDone.txt', {encoding: 'utf-8'})
          } catch {
            return ''
          }
          
        }
      })
    },
  },redirectionLimit: 100000, experimentalMemoryManagement: true, trashAssetsBeforeRuns: false
});
