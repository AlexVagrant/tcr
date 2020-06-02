import { parse } from "https://deno.land/std/flags/mod.ts";
import { common } from "https://deno.land/std/path/mod.ts";

let timer: null|number = null;
const throttle = 100;
const denoArgs =  Deno.args;
const parseArgs = parse(denoArgs.slice(1));
//console.log(7, denoArgs)
//7 [ "..\\deno_demo\\example\\app.ts", "--allow-net" ]
const {h, help} = parseArgs;

function denoCmd(path:string, test:string='', ...args: any[]) {
    Deno.run({
        cmd: [Deno.execPath(), test,...args, path ]
    })
}

if (h || help) {
    console.dir('usage tcr - <dir or file>');
    Deno.exit(1);
}

const path =  denoArgs[0];
Deno.chdir(path);
const args = denoArgs.slice(1);
// if is File watch dir 
const fileInfo = Deno.statSync(path).isFile;
const watcher = Deno.watchFs(`${fileInfo ? common([path]) : path}`, {recursive: false});
if (fileInfo) {
  console.log(args)
  denoCmd(path, 'run', ...args)  
}
// parse file
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
                  console.log(runPath)
                    if (isTestArr[isTestArr.length-2]) {
                        denoCmd(runPath, 'test', ...args)
                    } else {
                        denoCmd(runPath, 'run',  ...args)
                    }
                }
            }
        },
        throttle
    )
}



