const assert = require('assert')
const dateFormat = require('dateformat')
const fs = require('fs')
const fsExtra = require('fs-extra')
const yaml = require('js-yaml')
const markdown = require('markdown-it')()
  .use(require('markdown-it-sup'))
  .use(require('markdown-it-footnote'))
const path = require('path')

markdown.renderer.rules.footnote_block_open = () => (
  '<section class="footnotes">\n' +
  '<ol class="footnotes-list">\n'
);

const consoleAqua = msg => console.log('\x1b[36m%s\x1b[0m', msg)
const consoleError = (msg) => console.error('\x1b[31m%s\x1b[0m', msg)
const assertCheck = fnData => assert(fnData.errNo === 0, fnData.errMsg)

const dirname = './markdown'

/* Read the directory contents*/
try {
  const fileList = fs.readdirSync(dirname)
  const mdFiles = []

  for (let j in fileList) {
    const nodeName = path.join(dirname, fileList[j])
    const stats = fs.statSync(nodeName);
    if (stats.isFile()) {
      mdFiles.push(nodeName)
    }
  }

  if (mdFiles.length !== 0) {
    fsExtra.emptyDirSync(`./public`)
    generateHTML(mdFiles)
  }
} catch (err) {
  consoleError(`ERROR in reading markdown folder`)
  consoleError(`ERROR => ${err}`)
}
  
function parseFile(fileData) {
  const outData = {}
  outData.errMsg = ''
  outData.errNo = 0

  const fileArray = fileData.contents.split(/\r\n|\r|\n/)

  if (fileArray[0] !== `---`) {
    outData.errNo = 1
    outData.errMsg = `${fileData.fileName} file does not begin with YAML tag`
    return outData
  }

  if (fileArray.length < 2) {
    outData.errNo = 2
    outData.errMsg = `${fileData.fileName} Invalid file, does not contain any content`
    return outData
  }

  let x;
  for (x = 1; x < fileArray.length; ++x) {
    if (fileArray[x] === `---`) break
  }

  if ((x + 2) >= fileArray.length) {
    outData.errNo = 3
    outData.errMsg = `${fileData.fileName} Invalid file, does not contain markdown content`
  }
  
  const metadata = yaml.safeLoad(fileArray.slice(1, x).join(`\n`))
  outData.htmlData = fileArray.slice(x + 2).join('\n')

  const properties = [`title`, `date`, `summary`]
  properties.forEach((e) => {
    if (!metadata.hasOwnProperty(e)) {
      outData.errNo = 4
      outData.errMsg = `${fileData.fileName} YAML does not contain the ${e}`
      return outData
    }

    if (e === `date`) {
      metadata[e] = new Date(metadata[e]).getTime() + (12 * 3600 * 1000)
      metadata[`blogDate`] = dateFormat(new Date(metadata[e]), "fullDate")
    }
  })

  outData.metadata = metadata
  return outData
}

/* Generate the HTML file from the MD template */
function generateHTML(fileList) {
  try {
    const blogList = []
    const htmlString = readTemplate('template/post.html')

    let prevPage = ``
    let nextPage = ``
    const fileListLength = fileList.length

    for (let i = 0; i < fileListLength; ++i) {
      const timeStart = process.hrtime()

      if (i > 0) {
        const fInfo = fileList[i - 1].split(path.sep).slice(-1)[0].split(`_`)
        const fileNamePath = fInfo.slice(0,1)[0].split(`-`).slice(0,2).concat(fInfo.slice(1)[0].slice(0,-3))
        prevPage = path.join(path.sep, ...(fileNamePath) ,`index.html`)
      } else {
        prevPage = ``
      }

      if (i < fileListLength - 1) {
        const fInfo = fileList[i + 1].split(path.sep).slice(-1)[0].split(`_`)
        const fileNamePath = fInfo.slice(0,1)[0].split(`-`).slice(0,2).concat(fInfo.slice(1)[0].slice(0,-3))
        nextPage = path.join(path.sep, ...(fileNamePath) ,`index.html`)
      } else {
        nextPage = ``
      }

      let statData = ``
      const fileData = fs.readFileSync(fileList[i], 'utf-8')
      const fileInfo = {}
      fileInfo.fileName = fileList[i]
      fileInfo.contents = fileData

      const fileContents = parseFile(fileInfo)
      assertCheck(fileContents)

      const htmlData = markdown.render(fileContents.htmlData)
      const dateLong = `${dateFormat(fileContents.metadata.date, "yyyy-mm-dd")}`
      const dateLongArray = dateLong.split(`-`)
      const dirArray = dateLongArray.slice(0,2).concat(
        fileList[i].split(path.sep)
          .slice(-1)[0]
          .split('_').slice(1)
          .join('_').slice(0, -3)
      )
      
      let breadCrumb = [`Home`].concat(dateLongArray.slice(0,2))
      let breadCrumbElem = `<ul class="breadcrumb">`
      let blogLink = `/`
      for (let x = 0; x < breadCrumb.length; ++x) {
        if (x > 0) {
          blogLink += breadCrumb[x] + `/`
        }
        let singleCrumb = `<li><a href="${blogLink}">${breadCrumb[x]}</a></li>`
        breadCrumbElem += singleCrumb
        
      }
      breadCrumbElem += `</ul>`

      let outputData = htmlString

      outputData = outputData.replace(`||title||`, fileContents.metadata.title)
      outputData = outputData.replace(`||breadcrumb||`, breadCrumbElem)
      outputData = outputData.replace(`||blog-title||`, fileContents.metadata.title)
      outputData = outputData.replace(`||blog-date||`, fileContents.metadata.blogDate)
      outputData = outputData.replace(`||blog-post||`, htmlData)
      
      fs.mkdirSync((path.join(__dirname, `public`, ...(dirArray))),
        { recursive: true }, 
        (err) => {
          consoleError(err)
          throw (`Error in creating the directory`)
        }
      )

      const outputFileName = path.join(`public`, ...(dirArray) ,`index.html`)
      const timeEnd = process.hrtime(timeStart)

      if (prevPage !== ``) {
        statData = `<a href="${prevPage}">Prev</a>`
      } else {
        statData = `<a href="${prevPage}"></a>`
      }
      
      statData += `<p>Page generated in ${timeEnd[0]}.${timeEnd[1].toString().slice(0,3)} seconds</p>`
      
      if (nextPage !== ``) {
        statData += `<a href="${nextPage}">Next</a>`
      } else {
        statData += `<a href="${nextPage}"></a>`
      }
      outputData = outputData.replace(`||page-footer||`, statData)
      fs.writeFileSync(outputFileName, outputData)

      const blogData = {}
      blogData.metadata = fileContents.metadata
      blogData.location = dirArray
      blogList.push(blogData)
      consoleAqua(`FILE WRITTEN => ${outputFileName}`)
    }

    generateBlogList(blogList)
  } catch (err) {
    consoleError(`ERROR in generateHTML`)
    consoleError(`ERROR => ${err.stack}`)
  }
}

/* Read the html template file */
function readTemplate(fileName) {
  try {
    return fs.readFileSync(fileName, 'utf-8')
  } catch (err) {
    consoleError(`ERROR in readTemplate`)
    consoleError(`ERROR => ${err.stack}`)
  }
}

/* Generate Blog list */
function generateBlogList(fileListData) {
  const htmlString = readTemplate('template/list.html')
  let postData = ''

  const fileList = fileListData.sort((a, b) => {
    if (a.metadata.date > b.metadata.date)
      return -1
    else
      return 1
  })

  for (let i in fileList) {
    const outputNamePath = path.join(path.sep, ...(fileList[i].location), `index.html`)
    let tagList = ''
    fileList[i].metadata.tags.forEach((e) => { tagList += `<li>${e}</li>` })
    postData += `<div class="card">` + `<div class="card-header">` + 
      `<a class="blog-title" href="${outputNamePath}">${fileList[i].metadata.title}</a>` +
      `<div class="blog-date"><p>${fileList[i].metadata.blogDate}</p></div>` + `</div>` +
      `<div class="blog-summary"><p>${fileList[i].metadata.summary}</p></div>` + 
      `</div>`
  }

  let outputData = htmlString
  outputData = outputData.replace(`||blog-post||`, postData)

  fs.writeFileSync(path.join(`public`, `index.html`), outputData)

  generateDateBlogList(fileList)
  copyStaticFiles()
}

/* Generate the pages */
function writeDataBlogList(arrayData, dateType) {
  for (let y in arrayData) {
    const htmlString = readTemplate('template/list.html')
    const fileList = arrayData[y]
    let postData = ''

    for (let i in fileList) {
      const outputNamePath = path.join(path.sep, ...(fileList[i].location), `index.html`)
      let tagList = ''
      fileList[i].metadata.tags.forEach((e) => { tagList += `<li>${e}</li>` })
      postData += `<div class="card">` + `<div class="card-header">` + 
        `<a class="blog-title" href="${outputNamePath}">${fileList[i].metadata.title}</a>` +
        `<div class="blog-date"><p>${fileList[i].metadata.blogDate}</p></div>` + `</div>` +
        `<div class="blog-summary"><p>${fileList[i].metadata.summary}</p></div>` + 
        `</div>`
    }

    let outputData = htmlString
    outputData = outputData.replace(`||blog-post||`, postData)

    if (dateType === `year`)
      fs.writeFileSync(path.join(`public`, y , `index.html`), outputData)
    else
      fs.writeFileSync(path.join(`public`, path.join(...(y.split(`-`))) , `index.html`), outputData)
  }
}
/* Generate the navigation pages by year and month */
function generateDateBlogList(fileListData) {
  const yearData = {}
  const monthData = {}

  fileListData.forEach((e) => {
    let monthIndex = `${e.location[0]}-${e.location[1]}`
    if (!(yearData.hasOwnProperty(e.location[0]))) {
      yearData[e.location[0]] = []
    }

    if (!(monthData.hasOwnProperty(monthIndex))) {
      monthData[monthIndex] = []
    }

    yearData[e.location[0]].push(e)
    monthData[monthIndex].push(e)
  })

  writeDataBlogList(yearData, `year`)
  writeDataBlogList(monthData, `month`)
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

  fs.copyFile(`favicon.ico`, `public/favicon.ico`,
    (err) => {
      if (err) throw err;
      console.log(`Icon copied over successfully`);
  })
}