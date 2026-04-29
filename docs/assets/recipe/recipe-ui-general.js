/**
 * 渲染单个配方的可视化UI（用于表格的“配方”列）
 * @param {Object} recipe - 单条配方数据
 * @returns {string} HTML字符串（Minecraft风格的 crafting UI）
 */
function uiNormalizeTagNameList(tagValue) {
    if (Array.isArray(tagValue)) return tagValue.filter(Boolean);
    if (typeof tagValue === "string") return [tagValue];
    return [];
}

function uiNormalizeTagKey(tag) {
    if (typeof tag !== "string") return "";
    return tag.startsWith("#") ? tag.slice(1) : tag;
}

function uiGetTagMappedNames(tag, tagNameMap) {
    if (!tagNameMap || typeof tagNameMap !== "object") return [];
    const candidates = [tag, `#${uiNormalizeTagKey(tag)}`, uiNormalizeTagKey(tag)];
    for (const key of candidates) {
        if (Object.prototype.hasOwnProperty.call(tagNameMap, key)) {
            const names = uiNormalizeTagNameList(tagNameMap[key]);
            if (names.length > 0) return names;
        }
    }
    return [];
}

function uiResolveMaterialName(rawName, recipe, recipeContext) {
    if (!rawName) return rawName;
    const tagNameMap = recipeContext?.tagNameMap || {};
    const currentName = recipeContext?.currentName || "";
    const currentTags = Array.isArray(recipeContext?.currentTags) ? recipeContext.currentTags : [];
    const inputTags = Array.isArray(recipe?.input_tags) ? recipe.input_tags : [];

    const mappedNames = uiGetTagMappedNames(rawName, tagNameMap);
    const isTagLike = mappedNames.length > 0 || inputTags.includes(rawName);
    if (!isTagLike) return rawName;

    const normalizedCurrentTagSet = new Set(currentTags.map(uiNormalizeTagKey));
    if (normalizedCurrentTagSet.has(uiNormalizeTagKey(rawName)) && currentName) {
        return currentName;
    }

    return mappedNames.length > 0 ? mappedNames[0] : rawName;
}

async function renderRecipeUI(recipe, recipeContext = {}) {
    if (!recipe || !recipe.type) {
        return '<span style="color:#888;">未知配方</span>';
    }

    try {
        switch (recipe.type) {
            case "minecraft:crafting_shaped":
            case "minecraft:crafting_shapeless":    
                return await renderRecipeCraftingTable(recipe, recipeContext);

            default:
                return `<span style="color:#f66;">暂不支持的配方类型: ${recipe.type}</span>`;
        }
    } catch (err) {
        console.error("renderRecipeUI 出错:", err);
        return '<span style="color:#f66;">渲染失败</span>';
    }
}

async function renderRecipeCraftingTable(recipe, recipeContext = {}) {
    const inputItems = recipe.input_items || [];
    const location = recipe.location || [];
    const outputItem = recipe.output_item || "未知";
    const outputCount = recipe.output_count || 1;

    // location 是9个元素的数组，对应3x3网格（从左到右、从上到下）
    const grid = [];
    for (let i = 0; i < 9; i++) {
        const rawName = location[i] && location[i] !== "null" ? location[i] : null;
        const itemName = rawName ? uiResolveMaterialName(rawName, recipe, recipeContext) : null;
        grid.push(itemName);
    }

    const inputHTML = await createCraftingInputGrid(grid);
    const outputHTML = await createOutputSlot(outputItem, outputCount);

    return `
        <span class="mcui mcui-Crafting_Table pixel-image">
            <span class="mcui-input">
                ${inputHTML}
            </span>
            <span class="mcui-arrow"><br></span>
            <span class="mcui-output">
                ${outputHTML}
            </span>
        </span>
    `;
}

/**
 * 生成3x3输入网格的HTML
 * @param {Array} grid - 长度为9的数组，元素为物品中文名或null
 */
async function createCraftingInputGrid(grid) {
    let html = '';
    for (let row = 0; row < 3; row++) {
        html += '<span class="mcui-row">';
        for (let col = 0; col < 3; col++) {
            const idx = row * 3 + col;
            const itemName = grid[idx];
            const slotHTML = itemName 
                ? await createInventorySlot(itemName) 
                : '<span class="invslot"></span>';
            html += slotHTML;
        }
        html += '</span>';
    }
    return html;
}

/**
 * 生成单个物品槽（带图标）
 */
async function createInventorySlot(itemName) {
    if (!itemName) return '<span class="invslot"></span>';

    // 获取图标URL（复用已有的 getMCIconDict）
    const iconMap = await getMCIconDict([itemName]);
    const iconUrl = iconMap[itemName] || '';

    const imgTag = iconUrl 
        ? `<img src="${iconUrl}" alt="${itemName}" width="32" height="32" decoding="async" loading="lazy">`
        : `<span style="font-size:10px; color:#888;">${itemName}</span>`;

    return `
        <span class="invslot">
            <span class="invslot-item invslot-item-image" title="${itemName}">
                ${imgTag}
            </span>
        </span>
    `;
}

/**
 * 生成输出槽（较大，带数量）
 */
async function createOutputSlot(itemName, count = 1) {
    const iconMap = await getMCIconDict([itemName]);
    const iconUrl = iconMap[itemName] || '';

    const imgTag = iconUrl 
        ? `<img src="${iconUrl}" alt="${itemName}" width="32" height="32" decoding="async" loading="lazy">`
        : `<span>${itemName}</span>`;

    const countHTML = count > 1 
        ? `<span class="invslot-stacksize">${count}</span>` 
        : '';

    return `
        <span class="invslot invslot-large">
            <span class="invslot-item invslot-item-image">
                ${imgTag}
                ${countHTML}
            </span>
        </span>
    `;
}