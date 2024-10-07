import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { CommentThreadCollapsibleState } from "vscode";

/** Promise wrapper around ChildProcess */
export class Subprocess {
  /**
   * Promise that resolves when the process exits successfully, or rejects when
   * there is an error.
   */
  readonly closed: Promise<string>;

  protected childProcess: ChildProcessWithoutNullStreams;

  /**
   * Spawn a new subprocess
   *
   * @param command The command to execute in the subprocess
   * @param args Array of arguments to be passed to the command
   * @param stdin Text to send on stdin to the subprocess
   */
  constructor(command: string, args: string[], stdin: string) {
    this.childProcess = spawn(command, args, { shell: true });
    this.childProcess.stdin.end(stdin);

    this.closed = new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      this.childProcess.stdout.setEncoding("utf8");
      this.childProcess.stdout.on("data", (data) => {
        stdout += data;
      });

      this.childProcess.stderr.on("data", (data) => {
        stderr += data;
      });

      this.childProcess.on("error", (err) => {
        return reject(err);
      });

      this.childProcess.on("close", (code) => {
        if (code !== 0) {
          return reject(stderr);
        }

        return resolve(stdout);
      });
    });
  }

  /** Kill the subprocess */
  kill(): void {
    !this.childProcess.killed && this.childProcess.kill();
  }
}
