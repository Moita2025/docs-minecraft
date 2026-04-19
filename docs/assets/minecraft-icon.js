const specialIconPrefixDict = {
    "vmw-": "vics-modern-warfare",
    "tw-": "twilight-forest",
    "bop-": "biomes-o-plenty"
};

const getMCHRIcon = async function(oriImg, jsonRelPath, item){

    if (jsonRelPath.includes("www-mcmod-cn") && item.srcName == "9339.png")
    {
        return `${jsonRelPath}img/9339-256px.png`;
    }
    else if (jsonRelPath.includes("zh-minecraft-wiki"))
    {
        return `${jsonRelPath}img/${item.srcName}`.replace(".png", "-256px.png");
    }
    else if (jsonRelPath.includes("1.21.11"))
    {   
        const dimensions = item.sizes;

        if (dimensions)
        {
            if (dimensions[0] < 73 && dimensions[1] < 73){
                return `${jsonRelPath}img/${item.srcName}`.replace(".png", "-256px.png");
            }
        }
    }

    return `${jsonRelPath}img/${item.srcName}`;
}

const removeSpecialIconPrefix = function(str){
    const prefixDict = specialIconPrefixDict;

    for (const prefix in prefixDict) {
        if (Object.prototype.hasOwnProperty.call(prefixDict, prefix)) {
            // 检查字符串是否以当前前缀开头
            if (str.startsWith(prefix)) {
                // 移除前缀并返回
                return str.slice(prefix.length);
            }
        }
    }

    // 没有匹配的前缀，直接返回原字符串
    return str;
}

const isRightItem = function(config, iconName){
    // 遍历特殊前缀字典，检查 iconName 是否以某个前缀开头
    for (let prefix in specialIconPrefixDict) {
        if (iconName.startsWith(prefix)) {
            const modName = specialIconPrefixDict[prefix];
            // 如果是特殊前缀物品，要求：
            // 1. 中文名匹配
            // 2. path 中包含对应的模组文件夹名
            if (config.path.includes(modName)) 
            {
                return (config.keys && config.keys.includes(
                    removeSpecialIconPrefix(iconName)
                ));
            }
        }
    }
    
    // 如果 iconName 不以任何特殊前缀开头，只需中文名匹配即可
    return (config.keys && config.keys.includes(iconName));
}

const getMCIconDict = async function(iconNameList){
    const url_prefix = "https://moita2025.github.io/assets-minecraft/"

    const response = await MCAssetCache.fetchWithCache(`${url_prefix}all_configs.json`);
    const all_configs = await response.json();

    if (!all_configs) return;

    const uniqueIconNames = [...new Set(iconNameList)];
    // - iconToPathMap: 图标名称到JSON文件路径的映射
    var iconToPathMap = {};
    const pathsToFetch = new Set();

    for (const iconName of uniqueIconNames) {
        for (const config of all_configs) {
            if (isRightItem(config, iconName)) {
                const finalPath = `${url_prefix}${config.path}`;
                pathsToFetch.add(finalPath);
                iconToPathMap[iconName] = finalPath;
                break;
            }
        }
    }

    const uniquePaths = Array.from(pathsToFetch);
    // - allJsonData: 所有fetch到的JSON数据
    var allJsonData = [];

    for (const path of uniquePaths) {
        try {
            const response = await MCAssetCache.fetchWithCache(path);
            if (!response.ok) {
                console.error(`Failed to fetch ${path}: ${response.statusText}`);
                continue;
            }
            const jsonData = await response.json();
            //allJsonData.push(...jsonData); // 合并数组

            if (Array.isArray(jsonData)) {
                // 为数组中的每个对象添加 path 属性
                const dataWithPath = jsonData.map(item => ({
                    ...item,
                    path: path
                }));
                allJsonData.push(...dataWithPath);
            } else {
                // 如果 jsonData 不是数组（比如单个对象），也可以处理
                allJsonData.push({
                    ...jsonData,
                    path: path
                });
            }

        } catch (error) {
            console.error(`Error fetching ${path}:`, error);
        }
    }

    // - iconToImageUrlMap: 图标名称到图片URL的映射
    const iconToImageUrlMap = {};
    for (const [iconName, path] of Object.entries(iconToPathMap)) {
        for (const item of allJsonData) {
            if (item.chineseName && item.srcName) {
                if (item.chineseName === removeSpecialIconPrefix(iconName) && 
                    item.path == path) {

                    let parts = path.split('/');
                    parts.pop();
                    let jsonRelPath = parts.join('/') + '/';

                    var imgFinalPath = `${jsonRelPath}img/${item.srcName}`
                    imgFinalPath = await getMCHRIcon(imgFinalPath, jsonRelPath, item);

                    iconToImageUrlMap[iconName] = imgFinalPath;
                    break;
                }
            }
        }
    }

    allJsonData = [];
    iconToPathMap = {};

    return iconToImageUrlMap;
}
