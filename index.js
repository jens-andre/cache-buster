#!/usr/bin/env node

const chalk = require('chalk')
const { createHash } = require('crypto')
const fs = require('fs')
const glob = require('fast-glob')
const path = require('path')
const replaceInFile = require('replace-in-file')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv))
  .option('dry', {
    alias: 'd',
    type: 'boolean',
    description: 'Runs without making replacements'
  })
  .option('quiet', {
    alias: 'q',
    type: 'boolean',
    description: 'Supresses success output'
  })
  .parse()

if (argv.quiet && !argv.dry) {
  process.stdout.write = () => {}
}

let config = {
  source: '',
  target: '',
  publicPath: '',
  url: '',
  hashLength: 7
}

const workDir = process.cwd()
const configFile = workDir + '/.cache-buster.json'
const isBlank = string => (!string || /^\s*$/.test(string))

if (fs.existsSync(configFile)) {
  config = Object.assign(config, require(configFile))
} else {
  console.error(chalk.red('[ERROR] Configuration file does not exist'))
  process.exit(1)
}

let missingConfigValues = []

if (isBlank(config.source)) {
  missingConfigValues.push('source')
}

if (isBlank(config.target)) {
  missingConfigValues.push('target')
}

if (isBlank(config.publicPath)) {
  missingConfigValues.push('publicPath')
}

if (missingConfigValues.length) {
  console.error(
    chalk.red(
      '[ERROR] Missing variables',
      chalk.bold(missingConfigValues.join(', ')),
      'in configuration'
    )
  )
  process.exit(1)
}

if (argv.dry) {
  console.log(chalk.yellow('Dry run…'))
}

config.source = path.resolve(workDir, config.source)
config.target = path.resolve(workDir, config.target)
config.publicPath = path.resolve(workDir, config.publicPath)
config.url = config.url.replace(/\/$/, '')
config.hashLength = Math.min(Math.max(parseInt(config.hashLength), 4), 64)

let manifest = {}

for (let filePath of glob.sync(config.source)) {
  const parsedPath = path.parse(filePath)
  let original = filePath.replace(config.publicPath, '')

  const hash = createHash('sha256').update(fs.readFileSync(filePath))
    .digest('hex')
    .slice(0, config.hashLength)

  const hashed = original.replace(parsedPath.ext, '.'.concat(hash, parsedPath.ext))

  if (!isBlank(config.url)) {
    manifest[original] = config.url + hashed
  } else {
    const dir = parsedPath.dir.replace(config.publicPath, '')
    let original = dir.substring(dir.lastIndexOf('/') + 1).concat('/', parsedPath.base).replace(/^\/+/, '')
    manifest[original] = original.replace(parsedPath.ext, '.'.concat(hash, parsedPath.ext))
  }

  if (!argv.dry) {
    fs.renameSync(filePath, config.publicPath.concat('/', hashed.replace(/^\/+/, '')))
  }
}

manifest = Object.keys(manifest)
  .sort()
  .reverse()
  .reduce((object, key) => {
      object[key] = manifest[key]
      return object
    },
    {}
  )

const results = replaceInFile.sync({
  files: config.target,
  from: Object.keys(manifest).map(item => new RegExp(item, 'g')),
  to: Object.values(manifest),
  countMatches: true,
  dry: argv.dry
})

const changedFiles = results.filter(result => result.hasChanged)
  .map(result => {
    return {
      path: result.file.replace(workDir, '').replace(/^\/+/, ''),
      numReplacements: result.numReplacements
    }
  })

for (const file of changedFiles) {
  console.log(
    chalk.green(
      !argv.dry ? 'Replaced' : 'Would replace',
      chalk.bold(file.numReplacements),
      chalk.bold('occurenc'.concat(file.numReplacements == 1 ? 'e' : 'ies')),
      'in',
      chalk.bold(file.path)
    )
  )
}
