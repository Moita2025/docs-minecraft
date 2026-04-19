/**
 * 渲染单个配方的可视化UI（用于表格的“配方”列）
 * @param {Object} recipe - 单条配方数据
 * @returns {string} HTML字符串（Minecraft风格的 crafting UI）
 */
async function renderRecipeUI(recipe) {
    if (!recipe || !recipe.type) {
        return '<span style="color:#888;">未知配方</span>';
    }

    try {
        switch (recipe.type) {
            case "minecraft:crafting_shaped":
            case "minecraft:crafting_shapeless":    
                return await renderRecipeCraftingTable(recipe);

            default:
                return `<span style="color:#f66;">暂不支持的配方类型: ${recipe.type}</span>`;
        }
    } catch (err) {
        console.error("renderRecipeUI 出错:", err);
        return '<span style="color:#f66;">渲染失败</span>';
    }
}

async function renderRecipeCraftingTable(recipe) {
    const inputItems = recipe.input_items || [];
    const location = recipe.location || [];
    const outputItem = recipe.output_item || "未知";
    const outputCount = recipe.output_count || 1;

    // location 是9个元素的数组，对应3x3网格（从左到右、从上到下）
    const grid = [];
    for (let i = 0; i < 9; i++) {
        const itemName = location[i] && location[i] !== "null" ? location[i] : null;
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