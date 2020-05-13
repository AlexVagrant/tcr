import { parse } from "https://deno.land/std/flags/mod.ts";

let timer: null|number = null;
const throttle = 100;
const parseArgs = await parse(Deno.args.slice(1));
const {_, h, help} = parseArgs;

if (!_.length || h || help) {
    console.dir('usage tcr - <dir or file>');
    Deno.exit(1);
}

const watcher = Deno.watchFs(`${_[0]}`, {recursive: false});

for await (const event of watcher) {
    const {kind, paths} = event;
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(
        () => {
            if (kind !== 'access') {
                Deno.run({
                    cmd: [Deno.execPath(), '--allow-run', '--allow-read', '--allow-env' ,...paths]
                })
            }
        },
        throttle
    )
}



