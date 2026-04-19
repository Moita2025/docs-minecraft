async function getRecipeData(
        chnName,
        recipe_url = 'https://moita2025.github.io/assets-minecraft/1.21.11/recipes.json'
    ) {

    if (!chnName || typeof chnName !== 'string') {
        console.error('renderRecipe: 请传入有效的中文物品名称');
        return null;
    }

    try {
        const response = await MCAssetCache.fetchWithCache(recipe_url);
        const allRecipes = await response;

        if (!Array.isArray(allRecipes)) {
            console.error('recipes.json 数据格式错误，应为数组');
            return null;
        }

        const relatedRecipes = allRecipes.filter(recipe => {
            // 检查是否是输出物品
            if (recipe.output_item === chnName) return true;

            // 检查是否是输入物品之一
            if (Array.isArray(recipe.input_items) && 
                recipe.input_items.includes(chnName)) {
                return true;
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
            output: outputRecipes  // 以 chnName 为输出产物的合成表
        };

    } catch (error) {
        console.error(`获取或处理 "${chnName}" 的合成表时出错:`, error);
        return null;
    }
}

async function renderRecipeTable(tableId, recipes, isOutputTable = true) {
    if (!recipes || recipes.length === 0) {
        console.log(`没有数据需要渲染到表格: ${tableId}`);
        return;
    }

    let columns = ['原料', '产物', '配方'];
    let data = [];

    data = recipes.map(recipe => ({
        '原料': Array.isArray(recipe.input_items) ? recipe.input_items.join('、') : '',
        '产物': recipe.output_item || '',
        '配方': renderRecipeUI(recipe)   // 可根据实际字段调整
    }));

    createDataTable(
        tableId,           // tableId
        columns,           // columns
        data,              // data
        {}                 // options（可后续扩展）
    );
}

async function renderAllRecipes(chnName) {
    const recipeData = await getRecipeData(chnName);

    if (!recipeData) {
        console.warn(`无法获取 "${chnName}" 的合成表数据`);
        return;
    }

    // 渲染输出表（以该物品为产物的配方）
    if (recipeData.output && recipeData.output.length > 0) {
        await renderRecipeTable('recipe-table-output', recipeData.output, true);
    } else {
        console.log(`物品 "${chnName}" 没有作为产物的合成表`);
    }

    // 渲染输入表（以该物品为原料的配方）
    if (recipeData.input && recipeData.input.length > 0) {
        await renderRecipeTable('recipe-table-input', recipeData.input, false);
    } else {
        console.log(`物品 "${chnName}" 没有作为原料的合成表`);
    }
}

