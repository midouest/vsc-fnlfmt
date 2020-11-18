import { ExtensionContext, languages } from "vscode";
import { FennelFormatProvider } from "./provider";

export function activate(_context: ExtensionContext) {
  languages.registerDocumentFormattingEditProvider(
    "fennel",
    new FennelFormatProvider()
  );
}
