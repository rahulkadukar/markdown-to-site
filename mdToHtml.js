const fs = require('fs')
const markdown = require('markdown-it')()
  .use(require('markdown-it-sup'))
  .use(require('markdown-it-footnote'))
const path = require('path')

markdown.renderer.rules.footnote_block_open = () => (
  '<section class="footnotes">\n' +
  '<ol class="footnotes-list">\n'
);

const consoleError = (msg) => console.error('\x1b[31m%s\x1b[0m', msg)

const dirname = './markdown'

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
    const htmlString = readTemplate('template/post.html')

    for (let i in fileList) {
      const outputNamePath = fileList[i].split('/')
      const fileData = fs.readFileSync(fileList[i], 'utf-8')    
      const htmlData = markdown.render(fileData)

      let pageTitle = outputNamePath[outputNamePath.length - 1].slice(0, -3)
      let outputData = htmlString

      let breadCrumb = outputNamePath.slice(1, -1)
      let breadCrumbElem = `<div class="breadcrumb">`
      for (let x = 0; x < breadCrumb.length; ++x) {
        let singleCrumb = `<div class="content">${breadCrumb[x]}</div><div class="arrow">`
        + `<svg height="30" width="21"><polyline points="1 0, 21 12, 1 25, 0 25, 20 12, 0 0"/></svg></div>`
        breadCrumbElem += singleCrumb
      }
      breadCrumbElem += `</div>`

      outputData = outputData.replace(`||blog-post||`, htmlData)
      outputData = outputData.replace(`||title||`, pageTitle)
      outputData = outputData.replace(`||breadcrumb||`, breadCrumbElem)

      fs.mkdirSync((path.join(__dirname, `public`, ...(outputNamePath.slice(1, outputNamePath.length - 1)))),
        { recursive: true }, 
        (err) => {
          consoleError(err)
          throw (`Error in creating the directory`)
        }
      )

      fs.writeFileSync(path.join(`public`, `${fileList[i].slice(9,-3)}.html`), outputData)
      const fileWritten = path.join(`public`, `${fileList[i].slice(9,-3)}.html`)
      console.log(`FILE WRITTEN => ${fileWritten}`)
    }

    generateBlogList(fileList)
  } catch (err) {
    consoleError(`ERROR in generateHTML`)
    consoleError(`ERROR => ${err}`)
  }
}

/* Read the html template file */
function readTemplate(fileName) {
  try {
    return fs.readFileSync(fileName, 'utf-8')
  } catch (err) {
    consoleError(`ERROR in readTemplate`)
    consoleError(`ERROR => ${err}`)
  }
}

/* Generate Blog list */
function generateBlogList(fileList) {
  const htmlString = readTemplate('template/list.html')
  let postData = ''

  for (let i in fileList) {
    const outputNamePath = fileList[i].split('/')
    postData += `<div><a href="${(outputNamePath.slice(1).join('/')).slice(0,-3)}.html">${outputNamePath.slice(-1)}</div>`
  }

  let outputData = htmlString
  outputData = outputData.replace(`||blog-post||`, postData)

  fs.writeFileSync(path.join(`public`, `index.html`), outputData)
  copyStaticFiles();
}

/* Copy the static files */
function copyStaticFiles() {
  fs.mkdirSync((path.join(__dirname, `public`, `css`)),
    { recursive: true }, 
    (err) => {
      consoleError(err)
      throw (`Error in creating the CSS directory`)
    }
  )
  // Copy the CSS files
  fs.copyFile(`template/css/blog-post.css`, `public/css/blog-post.css`,
    (err) => {
      if (err) throw err;
      console.log(`CSS copied over successfully`);
  })
}