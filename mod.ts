let timer: null|number = null;
const throttle = 100;

async function main() {
    const watcher = Deno.watchFs("src", {recursive: false});
    for await (const event of watcher) {
        const {kind, paths} = event;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(
            () => {
                if (kind !== 'access') {
                    Deno.run({
                        cmd: [Deno.execPath(), `${paths[0]}`]
                    })
                }
            },
            throttle
        )
    }
}

main();
