function isBedRecipe(recipe) {
    if (!recipe || typeof recipe !== 'object') return false;
    const outputItem = recipe.output_item || '';
    return typeof outputItem === 'string' && outputItem.includes('床');
}

/**
 * 床类配方排序规则：
 * 1) 第一个“床”产物配方保留在原顺序位置
 * 2) 其余“床”产物配方移动到末尾（保持它们原始相对顺序）
 */
function sortRecipesForBed(recipes) {
    if (!Array.isArray(recipes) || recipes.length <= 1) {
        return recipes;
    }

    const mainPart = [];
    const bedTail = [];
    let hasKeptFirstBed = false;

    recipes.forEach(recipe => {
        if (!isBedRecipe(recipe)) {
            mainPart.push(recipe);
            return;
        }

        if (!hasKeptFirstBed) {
            mainPart.push(recipe);
            hasKeptFirstBed = true;
        } else {
            bedTail.push(recipe);
        }
    });

    return [...mainPart, ...bedTail];
}

window.sortRecipesForBed = sortRecipesForBed;
