import { dirname } from "path";

import {
  DocumentFormattingEditProvider,
  TextDocument,
  FormattingOptions,
  TextEdit,
  CancellationToken,
  workspace,
  Position,
  Range,
} from "vscode";

import { Subprocess } from "./subprocess";

/** Format Fennel code using fnlfmt */
export class FennelFormatProvider implements DocumentFormattingEditProvider {
  async provideDocumentFormattingEdits(
    document: TextDocument,
    _options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    const exec = getFormatter();
    const formatted = await executeFormatter(exec, document, token);
    const overwrite = overwriteDocument(document, formatted);
    return [overwrite];
  }
}

/** Get the path to the fnlfmt executable from the configuration */
function getFormatter(): string {
  const config = workspace.getConfiguration("vsc-fnlfmt");
  return config["exec"] ?? "fnlfmt";
}

/**
 * Execute fnlfmt on a document
 *
 * @param exec Path to the fnlfmt executable
 * @param document Fennel document to format
 * @param token Cancellation token used to kill the formatter subprocess
 *
 * @returns The formatted Fennel code
 */
function executeFormatter(
  exec: string,
  document: TextDocument,
  token: CancellationToken
): Promise<string> {
  const cwd = dirname(document.fileName);
  const process = new Subprocess(exec, [document.fileName], cwd);
  token.onCancellationRequested(() => process.kill());
  return process.closed;
}

/**
 * Create an edit instance that will overwrite the given document with the new
 * text content.
 *
 * @param document The document to be overwritten
 * @param content The text content to overwrite the document with
 *
 * @returns An edit operation that will overwrite the document
 */
function overwriteDocument(document: TextDocument, content: string): TextEdit {
  const fileStart = new Position(0, 0);
  const fileEnd = document.lineAt(document.lineCount - 1).range.end;
  const range = new Range(fileStart, fileEnd);
  return new TextEdit(range, content);
}
