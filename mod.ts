import { parse } from "https://deno.land/std/flags/mod.ts";
import { common } from "https://deno.land/std/path/mod.ts";

let timer: null|number = null;
const throttle = 100;
const parseArgs = await parse(Deno.args.slice(1));
const {_, h, help} = parseArgs;

function denoCmd(path:string, test:string='') {
    Deno.run({
        cmd: [Deno.execPath(), test, path]
    })
}

if (!_.length || h || help) {
    console.dir('usage tcr - <dir or file>');
    Deno.exit(1);
}

const path = (_[0] as string);
// if is File watch dir 
const fileInfo = Deno.statSync(path).isFile;
const watcher = Deno.watchFs(`${fileInfo ? common([path]) : path}`, {recursive: false});
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
                    if (isTestArr[isTestArr.length-2]) {
                        denoCmd(runPath, 'test')
                    } else {
                        denoCmd(runPath)
                    }
                }
            }
        },
        throttle
    )
}



