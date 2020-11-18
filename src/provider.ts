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

import { Process } from "./process";

export class FennelFormatProvider implements DocumentFormattingEditProvider {
  async provideDocumentFormattingEdits(
    document: TextDocument,
    _options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    const exec = getFormatter();
    const formatted = await executeFormatter(exec, document, token);
    const edit = overwriteDocument(document, formatted);
    return [edit];
  }
}

function getFormatter(): string {
  const config = workspace.getConfiguration("vsc-fnlfmt");
  return config["exec"] ?? "fnlfmt";
}

function executeFormatter(
  exec: string,
  document: TextDocument,
  token: CancellationToken
): Promise<string> {
  const cwd = dirname(document.fileName);
  const process = new Process(exec, [document.fileName], cwd);
  token.onCancellationRequested(() => process.kill());
  return process.closed;
}

function overwriteDocument(document: TextDocument, content: string): TextEdit {
  const fileStart = new Position(0, 0);
  const fileEnd = document.lineAt(document.lineCount - 1).range.end;
  const range = new Range(fileStart, fileEnd);
  return new TextEdit(range, content);
}
