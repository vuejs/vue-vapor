import { SourceLocation } from '@vue/compiler-dom'

export interface CompilerError extends SyntaxError {
  code: number | string
  loc?: SourceLocation
}

export interface CoreCompilerError extends CompilerError {
  code: ErrorCodes
}

export function defaultOnError(error: CompilerError) {
  throw error
}

export function defaultOnWarn(msg: CompilerError) {
  __DEV__ && console.warn(`[Vue warn] ${msg.message}`)
}

type InferCompilerError<T> = T extends ErrorCodes
  ? CoreCompilerError
  : CompilerError

export function createCompilerError<T extends number>(
  code: T,
  loc?: SourceLocation,
  messages?: { [code: number]: string },
  additionalMessage?: string,
): InferCompilerError<T> {
  const msg =
    __DEV__ || !__BROWSER__
      ? (messages || errorMessages)[code] + (additionalMessage || ``)
      : code
  const error = new SyntaxError(String(msg)) as InferCompilerError<T>
  error.code = code
  error.loc = loc
  return error
}

export const enum ErrorCodes {
  // transform errors
  X_V_BIND_NO_EXPRESSION,
  X_V_ON_NO_EXPRESSION,
}

export const errorMessages: Record<ErrorCodes, string> = {
  // transform errors
  [ErrorCodes.X_V_BIND_NO_EXPRESSION]: `v-bind is missing expression.`,
  [ErrorCodes.X_V_ON_NO_EXPRESSION]: `v-on is missing expression.`,
}
