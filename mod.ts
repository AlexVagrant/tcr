import { parse } from "https://deno.land/std/flags/mod.ts";
import { common } from "https://deno.land/std/path/mod.ts";

let timer: null|number = null;
const throttle = 100;
const denoArgs =  Deno.args;
const parseArgs = parse(denoArgs.slice(1));
const {_, h, help} = parseArgs;
let process: Deno.Process;

function denoCmd(path:string, test:string='', args: any[]): Deno.Process {
    console.log('denoCmd', args)    
    return Deno.run({
        cmd: [Deno.execPath(), test, ...args, path ]
    })
}

if (!_.length || h || help) {
    console.dir('usage tcr - <dir or file>');
    Deno.exit(1);
}

const path =  _[0] as string;
console.log('denoArgs', denoArgs)
const args = denoArgs.slice(2);
//change the current work dir 

Deno.chdir(Deno.cwd()) 
// if is File watch dir 
const fileInfo = Deno.lstatSync(path).isFile;
const watcher = Deno.watchFs(`${fileInfo ? common([path]) : path}`, {recursive: false});

if (fileInfo) {
  process = denoCmd(path, 'run', args);
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
                    // if has process.pid kill this process
                    if (process.pid){
                      process.close() 
                    }
                    if (isTestArr[isTestArr.length-2]) {
                        process = denoCmd(runPath, 'test', args)
                    } else {
                        process = denoCmd(runPath, 'run', args)
                    }
                }
            }
        },
        throttle
    )
}



