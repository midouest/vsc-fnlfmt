import { ChildProcessWithoutNullStreams, spawn } from "child_process";

/** Promise wrapper around ChildProcess */
export class Process {
  /**
   * Promise that resolves when the process exits successfully, or rejects when
   * there is an error.
   */
  readonly closed: Promise<string>;

  protected process: ChildProcessWithoutNullStreams;

  /** Spawn a new subprocess */
  constructor(command: string, args: string[], cwd: string) {
    this.process = spawn(command, args, { cwd });
    this.closed = new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      this.process.stdout.setEncoding("utf8");
      this.process.stdout.on("data", (data) => {
        stdout += data;
      });

      this.process.stderr.on("data", (data) => {
        stderr += data;
      });

      this.process.on("error", (err) => {
        return reject(err);
      });

      this.process.on("close", (code) => {
        if (code !== 0) {
          return reject(stderr);
        }

        return resolve(stdout);
      });
    });
  }

  /** Kill the subprocess */
  kill(): void {
    !this.process.killed && this.process.kill();
  }
}
