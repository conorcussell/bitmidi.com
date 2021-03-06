import fs from 'fs'
import glob from 'glob'
import minimist from 'minimist'
import mkdirp from 'mkdirp'
import ora from 'ora'
import path from 'path'
import sha256 from 'simple-sha256'
import { promisify } from 'util'

import { rootPath } from '../config'
import Midi from '../src/models/Midi'

const globAsync = promisify(glob)
const readFileAsync = promisify(fs.readFile)

const UPLOAD_PATH = path.join(rootPath, 'uploads')

init()

async function init () {
  const argv = minimist(process.argv.slice(2))
  const midiPath = argv._[0] // Path to MIDI folder

  if (midiPath == null) {
    throw new Error('Missing required argument: Path to MIDI folder')
  }

  const duplicates = []
  let importCount = 0

  const spinner = ora('Starting...').start()

  mkdirp.sync(UPLOAD_PATH)

  spinner.text = `Finding MIDI files in ${midiPath}...`

  let filePaths = await globAsync('**/*.mid', { cwd: midiPath, nocase: true })
  filePaths = filePaths.map(filePath => path.join(midiPath, filePath))

  for (let [i, filePath] of filePaths.entries()) {
    spinner.text = `Processing file ${i} / ${filePaths.length}...`

    const fileName = path.basename(filePath)
    const fileData = await readFileAsync(filePath)
    const hash = sha256.sync(fileData)

    let midi = await Midi
      .query()
      .findOne({ hash })

    if (!midi) {
      // File does not exist yet, so add it
      midi = await Midi
        .query()
        .insert({
          name: fileName,
          hash
        })

      const outFile = path.join(UPLOAD_PATH, `${midi.id}.mid`)
      const flags = fs.constants.COPYFILE_EXCL /* fail if dest already exists */
      fs.copyFileSync(filePath, outFile, flags)
      fs.chmodSync(outFile, 0o664)

      importCount += 1
    } else {
      // Duplicate, file already exists
      duplicates.push([midi.name, fileName])

      if (midi.name !== fileName &&
          (!midi.alternateNames || !midi.alternateNames.includes(fileName))) {
        // Alternate name is not in DB, so add it

        if (!midi.alternateNames) midi.alternateNames = []
        midi.alternateNames.push(fileName)

        await midi
          .$query()
          .update(midi)
      }
    }
  }

  spinner.succeed(`Imported ${importCount} new files.\n`)

  if (duplicates.length > 0) {
    console.log(`Skipped ${duplicates.length} duplicates:`)
    for (let duplicate of duplicates) {
      console.log(`  - ${duplicate[0]} (exists as ${duplicate[1]})`)
    }
  }

  return Midi.knex().destroy()
}
