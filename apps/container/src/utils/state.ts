import { cwd } from "process"
import { PersistentShell } from "./PersistentShell"

const STATE: {
  originalCwd: string
} = {
  originalCwd: cwd(),
}

export async function setCwd(cwd: string): Promise<void> {
  await PersistentShell.getInstance().setCwd(cwd)
}

export function setOriginalCwd(cwd: string): void {
  STATE.originalCwd = cwd
}

export function getOriginalCwd(): string {
  return STATE.originalCwd
}

export function getCwd(): string {
  return PersistentShell.getInstance().pwd()
}
