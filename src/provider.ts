import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  Position,
  Range,
  TextDocument,
  TextEdit,
  commands,
  window,
  workspace,
} from "vscode";
import { Subprocess } from "./subprocess";
import { dirname } from "path";

/** Format Fennel code using fnlfmt */
export class FennelFormatProvider implements DocumentFormattingEditProvider {
  async provideDocumentFormattingEdits(
    document: TextDocument,
    _options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    const command = getFormatter();
    if (!command) {
      promptConfigureFormatter();
      return [];
    }

    const formatted = await executeFormatter(command, document, token);
    const overwrite = overwriteDocument(document, formatted);
    return [overwrite];
  }
}

/** Get the path to the fnlfmt executable from the configuration */
function getFormatter(): string | undefined {
  const config = workspace.getConfiguration("vsc-fnlfmt");
  return config["execPath"];
}

/** Prompt the user to configure the fnlfmt executable path */
async function promptConfigureFormatter(): Promise<void> {
  const action = await window.showInformationMessage(
    "Path to fnlfmt executable not configured",
    "Configure..."
  );
  if (!action) {
    return;
  }

  commands.executeCommand(
    "workbench.action.openSettings",
    "vsc-fnlfmt.execPath"
  );
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
