import path from "path"

import { isDir } from "../utils/fs"
import { logDebug, logError, logMessage } from "../utils/log"
import { spawn } from "../utils/spawn"
import { renderViewOnFile } from "../utils/view"
import { askSetupQuestions, askSetupSemanticRelease } from "./ask"
import { CopyOperation, copy } from "./copy"
import { setupGit } from "./git"

const templatesPath = path.resolve(__dirname, "..", "..", "templates")
logDebug("Templates path: %s", templatesPath)

const destinationPath = process.cwd()
logDebug("Destination path: %s", destinationPath)

const doCopy = async (
  templatePath: string,
  viewData: Record<string, string>,
): Promise<CopyOperation[]> => {
  try {
    const copyResults = await copy(templatePath, destinationPath, viewData)
    logMessage(`${copyResults.length} file(s) copied`)
    return copyResults
  } catch (error) {
    logError(new Error(`Could not copy: ${error}`))
    throw error
  }
}

const renderView = async (
  filePath: string,
  data: Record<string, string>,
): Promise<void> => {
  logDebug("Rendering view: %s", filePath)
  try {
    await renderViewOnFile(filePath, data)
  } catch (error) {
    logError(new Error(`Could not process ${filePath}: ${error}`))
  }
}

const getFilePaths = (copyResults: CopyOperation[]): string[] =>
  copyResults
    .map(copyResult => copyResult.dest)
    .filter(filePath => !isDir(filePath))

const copyAndRender = async (
  templatePath: string,
  viewData: Record<string, string>,
): Promise<void> => {
  const copyResults = await doCopy(templatePath, viewData)
  const filePaths = getFilePaths(copyResults)
  const renderViews = filePaths.map(filePath => renderView(filePath, viewData))
  await Promise.all(renderViews)
}

export const createApp = async (): Promise<void> => {
  const setupAnswers = await askSetupQuestions()
  logDebug("Setup answers: %O", setupAnswers)

  setupGit(destinationPath, setupAnswers)

  await copyAndRender(templatesPath, setupAnswers)

  spawn("npm install")

  logMessage("Formatting files...")
  spawn("npm run format")

  if (await askSetupSemanticRelease()) {
    spawn("npx semantic-release-cli setup")
  }

  logMessage("All done!")
  logMessage("VS Code users: run 'Extensions: Show Recommended Extensions'")
}
