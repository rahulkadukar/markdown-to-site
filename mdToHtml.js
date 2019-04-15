const markdown = require( "markdown" ).markdown
const fs = require('fs')
const path = require('path')

const consoleError = (msg) => console.error('\x1b[31m%s\x1b[0m', msg)

const dirname = './md'

/* Read the directory contents*/
try {
  const files = fs.readdirSync(dirname)
  const dirList = []

  for (let i in files) {
    const nodeName = path.join(dirname, files[i])
    const stats = fs.statSync(nodeName);
    if (stats.isDirectory()) {
      dirList.push(nodeName)
    }
  }

  if (dirList.length !== 0) {
    traverseYearDir(dirList)
  }
} catch (err) {
  consoleError(`ERROR in reading markdown folder`)
  consoleError(`ERROR => ${err}`)
}

/* Traverse the year directory */
function traverseYearDir(folderList) {
  const dirList = []

  try {
    for (let i in folderList) {
      const fileList = fs.readdirSync(folderList[i])
    
      for (let j in fileList) {
        const nodeName = path.join(folderList[i], fileList[j])
        const stats = fs.statSync(nodeName);
        if (stats.isDirectory()) {
          dirList.push(nodeName)
        }
      }
    
      if (dirList.length !== 0) {
        traverseMonthDir(dirList)
      }
    }
  } catch (err) {
    consoleError(`ERROR in traverseYearDir`)
    consoleError(`ERROR => ${err}`)
  }
}

/* Traverse the month directory */
function traverseMonthDir(folderList) {
  const mdFiles = []
  console.log(folderList)
  try {
    for (let i in folderList) {
      const fileList = fs.readdirSync(folderList[i])
    
      for (let j in fileList) {
        const nodeName = path.join(folderList[i], fileList[j])
        const stats = fs.statSync(nodeName);
        if (stats.isFile()) {
          mdFiles.push(nodeName)
        } else if (stats.isDirectory()) {
          throw(`Unexpected directory found ${nodeName}`)  
        }
      }
    
      if (mdFiles.length !== 0) {
        generateHTML(mdFiles)
      }
    }
  } catch (err) {
    consoleError(`ERROR in traverseMonthDir`)
    consoleError(`ERROR => ${err}`)
  }
}
  
/* Generate the HTML file from the MD template */
function generateHTML(fileList) {
  try {
    for (let i in fileList) {
      const fileData = fs.readFileSync(fileList[i], 'utf-8')    
      console.log(markdown.toHTML(fileData))
    }
  } catch (err) {
    consoleError(`ERROR in generateHTML`)
    consoleError(`ERROR => ${err}`)
  }
}