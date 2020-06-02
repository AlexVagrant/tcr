import { parse } from "https://deno.land/std/flags/mod.ts";
import { common } from "https://deno.land/std/path/mod.ts";

let timer: null|number = null;
const throttle = 100;
const denoArgs =  Deno.args;
const parseArgs = parse(denoArgs.slice(1));
const {_, h, help} = parseArgs;
let pid: Deno.Process;

function denoCmd(path:string, test:string='', args: any[]): Deno.Process {
    return Deno.run({
        cmd: [Deno.execPath(), test, ...args, path ]
    })
}

if (!_.length || h || help) {
    console.dir('usage tcr - <dir or file>');
    Deno.exit(1);
}

const path =  _[0] as string;
const args = denoArgs.slice(1);

// if is File watch dir 
const fileInfo = Deno.statSync(path).isFile;
const watcher = Deno.watchFs(`${fileInfo ? common([path]) : path}`, {recursive: false});

if (fileInfo) {
  denoCmd(path, 'run', args)  
}

for await (const event of watcher) {
    const {kind, paths} = event;
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(
        () => {
            if (kind !== 'access') {
                for (let v of paths) {
                    const isTestArr = v.split('.');
                    const runPath = fileInfo ? path : v;
                    if (pid){
                      Deno.close(pid.rid)
                    }
                    if (isTestArr[isTestArr.length-2]) {
                        pid = denoCmd(runPath, 'test', args)
                    } else {
                        pid = denoCmd(runPath, 'run', args)
                    }

                    console.log('pid = ', pid);
                }
            }
        },
        throttle
    )
}



