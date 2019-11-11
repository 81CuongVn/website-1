import chain from "ramda/es/chain"
import partition from "ramda/es/partition"
import pipe from "ramda/es/pipe"

import { IFile, IFileOrFolder, IFolder } from "../types"

function specificWordsToUpper(str: string): string {
  const wordsToUpper = ["pdo", "c"]
  const toUpper = (word: string) =>
    wordsToUpper.includes(word.toLowerCase()) ? word.toUpperCase() : word
  return str
    .split(" ")
    .map(toUpper)
    .join(" ")
}

function removeDotMD(str: string): string {
  return str.replace(".md", "")
}

function dashToSpace(str: string): string {
  return str.replace(/-/g, " ")
}

export function humanize(str: string): string {
  return pipe(
    dashToSpace,
    specificWordsToUpper,
    removeDotMD
  )(str)
}

export function traversePaths(
  [head, ...tail]: string[],
  basePath: string
): IFileOrFolder {
  const path = basePath + "/" + head
  const isFile = !tail.length
  if (isFile) {
    // probably not more than one dot
    const [name] = head.split(".")
    return {
      title: name,
      type: "file",
      path,
    }
  }
  return {
    title: head,
    type: "folder",
    path,
    children: [traversePaths(tail, path)],
  }
}

export function traversePathsToFiles(
  [head, ...tail]: string[],
  basePath: string,
  depth: number = 0
): IFileOrFolder {
  const path = basePath + "/" + head + "/" + tail.join("/")

  if (depth !== 0) {
    // probably not more than one dot
    const [name] = basePath.split(".")
    return {
      title: name,
      type: "file",
      path: basePath,
    }
  }

  return {
    title: head,
    type: "folder",
    path,
    children: [traversePathsToFiles(tail, path, 1)],
  }
}

function generateFolder({
  title,
  path,
  targets,
}: {
  title: IFolder["title"]
  path: IFile["path"]
  targets: IFolder[]
}): IFolder {
  const children = join(chain(target => target.children, targets))

  return {
    title,
    type: "folder",
    path,
    children: children.sort((a, b) =>
      a.title.split("/").length > b.title.split("/").length
        ? -1
        : a.title.localeCompare(b.title)
    ),
  }
}

function generateFile({
  title,
  path,
}: {
  title: IFile["title"]
  path: IFile["path"]
}): IFile {
  return {
    title,
    type: "file",
    path,
  }
}

export function join([head, ...tail]: IFileOrFolder[]): IFileOrFolder[] {
  if (!head) {
    return []
  }

  const [similarFs, remaining] = partition(
    obj => obj.title === head.title && obj.type === head.type,
    tail
  )
  const targets = [head, ...similarFs]
  const { title, path } = head

  const current =
    head.type === "folder"
      ? generateFolder({ title, path, targets: targets as IFolder[] })
      : generateFile({ title, path })

  return [current, ...join(remaining)]
}
