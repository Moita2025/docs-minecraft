function normalizeTagNameList(tagValue) {
    if (Array.isArray(tagValue)) {
        return tagValue.filter(Boolean);
    }
    if (typeof tagValue === 'string') {
        return [tagValue];
    }
    return [];
}

function getTagListByChineseName(chnName, tagNameMap) {
    if (!chnName || !tagNameMap || typeof tagNameMap !== 'object') {
        return [];
    }

    const relatedTags = [];
    for (const [tagKey, tagValue] of Object.entries(tagNameMap)) {
        const names = normalizeTagNameList(tagValue);
        if (names.includes(chnName)) {
            relatedTags.push(tagKey);
        }
    }
    return relatedTags;
}

function getDisplayNameByTag(tagValue, fallbackTag) {
    const names = normalizeTagNameList(tagValue);
    return names.length > 0 ? names[0] : fallbackTag;
}

function getRecipeRawMaterials(recipe, tagNameMap) {
    const inputItems = Array.isArray(recipe.input_items) ? recipe.input_items : [];
    const inputTags = Array.isArray(recipe.input_tags) ? recipe.input_tags : [];

    const tagDisplayNames = inputTags.map(tag => {
        return getDisplayNameByTag(tagNameMap ? tagNameMap[tag] : undefined, tag);
    });

    return [...inputItems, ...tagDisplayNames];
}

async function getRecipeData(
        chnName,
        recipe_url = 'https://moita2025.github.io/assets-minecraft/1.21.11/recipes.json',
        tag_url = 'https://moita2025.github.io/assets-minecraft/1.21.11/tags.json'
    ) {

    if (!chnName || typeof chnName !== 'string') {
        console.error('renderRecipe: 请传入有效的中文物品名称');
        return null;
    }

    try {
        const response = await MCAssetCache.fetchWithCache(recipe_url);
        const allRecipes = await response;
        const tagNameMap = await MCAssetCache.fetchWithCache(tag_url);

        if (!Array.isArray(allRecipes)) {
            console.error('recipes.json 数据格式错误，应为数组');
            return null;
        }

        const tagsOfCurrentName = getTagListByChineseName(chnName, tagNameMap);

        const relatedRecipes = allRecipes.filter(recipe => {
            // 检查是否是输出物品
            if (recipe.output_item === chnName) return true;

            // 检查是否是输入物品之一
            if (Array.isArray(recipe.input_items) && 
                recipe.input_items.includes(chnName)) {
                return true;
            }

            // hasTag 表示该配方原料中包含 tag 项：按 input_tags 参与检索
            if (recipe.hasTag && Array.isArray(recipe.input_tags) && tagsOfCurrentName.length > 0) {
                return recipe.input_tags.some(tag => tagsOfCurrentName.includes(tag));
            }

            return false;
        });

        if (relatedRecipes.length === 0) {
            console.log(`未找到物品 "${chnName}" 的相关合成表`);
            return null;
        }

        const outputRecipes = [];
        const inputRecipes = [];

        relatedRecipes.forEach(recipe => {
            if (recipe.output_item === chnName) {
                outputRecipes.push(recipe);
            } else {
                // 如果不是输出物品，但出现在 input_items 中，则归为 inputRecipes
                inputRecipes.push(recipe);
            }
        });

        return {
            input: inputRecipes,   // 以 chnName 为输入材料的合成表
            output: outputRecipes, // 以 chnName 为输出产物的合成表
            tagNameMap: tagNameMap
        };

    } catch (error) {
        console.error(`获取或处理 "${chnName}" 的合成表时出错:`, error);
        return null;
    }
}

async function renderRecipeTable(tableId, recipes, isOutputTable = true, tagNameMap = {}) {
    if (!recipes || recipes.length === 0) {
        console.log(`没有数据需要渲染到表格: ${tableId}`);
        return;
    }

    let columns = ['原料', '产物', '配方'];

    const data = await Promise.all(
        recipes.map(async (recipe) => {
            const rawMaterials = getRecipeRawMaterials(recipe, tagNameMap).join('、');

            const product = recipe.output_item || '';

            // 必须 await，否则配方列仍是 Promise 对象
            const recipeHTML = await renderRecipeUI(recipe);

            // 返回数组，顺序必须和 columns 完全一致！
            return [
                rawMaterials,   // 第1列：原料
                product,        // 第2列：产物
                recipeHTML      // 第3列：配方（HTML）
            ];
        })
    );

    createDataTable(
        tableId,           // tableId
        columns,           // columns
        data,              // data
        {pageLength: 5}                 // options（可后续扩展）
    );
}

async function renderAllRecipes(chnName) {
    const recipeData = await getRecipeData(
        chnName,
        (typeof recipe_url !== 'undefined' ? recipe_url : undefined),
        (typeof tag_url !== 'undefined' ? tag_url : undefined)
    );

    if (!recipeData) {
        console.warn(`无法获取 "${chnName}" 的合成表数据`);
        return;
    }

    // 渲染输出表（以该物品为产物的配方）
    if (recipeData.output && recipeData.output.length > 0) {
        await renderRecipeTable('recipe-table-output', recipeData.output, true, recipeData.tagNameMap);
    } else {
        console.log(`物品 "${chnName}" 没有作为产物的合成表`);
    }

    // 渲染输入表（以该物品为原料的配方）
    if (recipeData.input && recipeData.input.length > 0) {
        await renderRecipeTable('recipe-table-input', recipeData.input, false, recipeData.tagNameMap);
    } else {
        console.log(`物品 "${chnName}" 没有作为原料的合成表`);
    }
}

