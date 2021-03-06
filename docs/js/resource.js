import { loadJS, loadJSInQueue } from './loadJS';

export { loadJS, loadJSInQueue };

export function getProjectUrlOrigin(projectUrl) {
    const isJsonFileUrl = /asset-manifest\.json$/.test(projectUrl);

    return isJsonFileUrl
        ? projectUrl.slice(0, projectUrl.lastIndexOf('/') + 1)
        : projectUrl;
}

export async function loadProject(projectUrl) {
    var mainUrl = getProjectUrlOrigin(projectUrl);
    var mainJS;
    var runtimeJS;
    var mainCSS;

    if (/asset-manifest\.json$/.test(projectUrl)) {
        var manifest = preloader.getManifest(projectUrl);
        if (!manifest) {
            manifest = await loadJSON(projectUrl);
        }

        mainCSS = manifest['main.css'];
        runtimeJS = manifest['runtime.js'];
        mainJS = manifest['main.js'];
    } else {
        var result = await fetch(
            projectUrl,
            projectUrl.startsWith('http://localhost')
                ? undefined
                : {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                }
        ).then(response => response.text());
        var runtimeJSMatchResult = result.match(/<script[^>]+?src="(?:\.\/)?(static\/js\/runtime[\w\.]*\.js)"/);
        var mainJSMatchResult = result.match(/<script[^>]+?src="(?:\.\/)?(static\/js\/main[\w\.]*\.js)"/);
        var bundleJSMatchResult = result.match(/<script[^>]+?src="(?:\.\/)?(static\/js\/[\w\.]+\.js)"/);

        mainCSS = result.match(/<link\s+href="(?:\.\/)?([\w\.\/]+\.css)"/)[1];
        runtimeJS = runtimeJSMatchResult && runtimeJSMatchResult[1];
        mainJS = mainJSMatchResult ? mainJSMatchResult[1] : bundleJSMatchResult[1];
    }

    loadCSS(mainUrl + mainCSS);

    runtimeJS && await loadJS(mainUrl + runtimeJS);
    await loadJS(mainUrl + mainJS);
}

export async function loadJSON(src: string) {
    try {
        if (!src) throw new Error('src is required');
        const res = await fetch(src, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=UTF-8',
                'Cache-Control': 'no-cache'
            }
        });
        return res.json();
    } catch (err) {
        return {};
    }
}

export function loadImg(src: string | HTMLImageElement): Promise<HTMLImageElement> {
    if (process.env.NODE_ENV === 'test') return Promise.resolve();

    if (!src) throw new Error('src can not be null!');

    return new Promise((resolve, reject) => {
        let node;
        if (isString(src)) {
            node = document.createElement('img');
            node.src = src;
        } else {
            node = src;
        }

        function gc() {
            node.onload = node.onerror = null;
        }
        if (node.complete) {
            resolve(node);
        } else {
            node.onload = () => {
                gc();
                resolve(node);
            };
            node.onerror = () => {
                gc();
                reject();
            };
        }
    });
}

/**
 * 预加载 图片数组
 * @param {图片地址列表} srcList
 */
export function loadImgs(srcList: string[] | HTMLImageElement[]): Promise<HTMLImageElement[]> {
    if (!Array.isArray(srcList)) {
        throw new Error('loadImgs 入参为数组');
    }
    const loadList = srcList.map(src => loadImg(src));
    return Promise.all(loadList);
}

export function loadCSS(src: string) {
    const styleSheet = document.createElement('link');
    styleSheet.rel = 'stylesheet';
    styleSheet.href = src;
    document.getElementsByTagName('head')[0].appendChild(styleSheet);
}
