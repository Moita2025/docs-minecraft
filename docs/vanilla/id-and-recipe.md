# 原版 id & 配方


!!! note "时效性注意"

    该页面只包含 1.21.11 及其以前的游戏版本的相关数据

## 方块 名称 & id

<table id="id-table"></table>

## 方块合成表



<script>

    const id_prefix = 'https://moita2025.github.io/assets-minecraft/1.21.11/';
    const config_url = id_prefix + 'config.json';
    const img_prefix = id_prefix + 'img/';

    fetch(config_url)
        .then(response => response.json())  // 将响应解析为 JSON
        .then(data => {
            const tableData = data.map(item => {
                // 将中文名称和英文名称合并成一个格子，使用 <br> 换行
                /*const nameCell = `
                    ${item.chineseName}<br>
                    <div class="hidden-on-mobile">${item.englishName}</div>
                `;*/
                const nameCell = `${item.chineseName}`;

                // 将 idDetails 数组中的每个元素单独渲染为一行
                return item.idDetails.map(idDetail => [
                    `<img src="${img_prefix}${item.srcName}" alt="${item.chineseName}" width="80" height="80">`,  // 图标
                    nameCell,  // 合并的中文名称和英文名称
                    item.version,      // 版本
                    idDetail.idSupportedVersion, // ID 版本
                    idDetail.englishId.replace('minecraft:', '') // 去掉英文 ID 前缀
                ]);
            }).flat();  // 扁平化二维数组，适合 DataTable 渲染

            // 将数据渲染到 DataTable
            createDataTable(
                'id-table',                 // tableId
                ['图标', '名称', '版本', 'ID 版本', '英文 ID'],  // columns
                tableData,                       // data
                {
                    pageLength: 5,
                    useURLParam: true /*,
                    rowCallbackFunc: function(row, data, dataIndex) {
                        dataTableImgAutoResize(
                            0, 72, row
                        );
                    }*/
                }
            );
        })
        .catch(error => console.error('Error fetching the JSON file:', error));
</script>

<script src="/docs-minecraft/assets/minecraft-icon.js"></script>