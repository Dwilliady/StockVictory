let inventoryData = [];
let inventoryItemData = [];

async function initInventory() {

    try {

        await Promise.all([
            loadInventory(),
            loadInventoryItems()
        ]);

        renderInventory(inventoryData);

    } catch (error) {

        console.error("Inventory error:", error);

        alert(
            "Gagal mengambil data inventory: " +
            error.message
        );

    }

}


/* =====================================================
   LOAD INVENTORY
===================================================== */

async function loadInventory() {

    const {
        data,
        error
    } = await supabaseClient
        .from("inventory")
        .select(`
            id,
            item_id,
            color_id,
            stock,
            items (
                id,
                code,
                name,
                status
            ),
            colors (
                id,
                color_no,
                color_name,
                status
            )
        `)
        .eq("items.status", true)
        .eq("colors.status", true)
        .order("item_id")
        .order("color_id");

    if (error) {
        throw error;
    }

    inventoryData = data || [];

    console.log("INVENTORY:", inventoryData);

}

/* =====================================================
   LOAD INVENTORY ITEMS
===================================================== */

async function loadInventoryItems() {

    const {
        data,
        error
    } = await supabaseClient
        .from("items")
        .select(`
            id,
            code,
            name,
            status
        `)
        .eq("status", true)
        .order("name");

    if (error) {
        throw error;
    }

    inventoryItemData = data || [];

}


/* =====================================================
   RENDER INVENTORY
===================================================== */

function renderInventory(data) {

    const inventoryGrid =
        document.getElementById("inventoryGrid");

    inventoryGrid.innerHTML = "";

    if (!inventoryItemData.length) {

        inventoryGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-secondary mb-0">
                    Belum ada Item aktif.
                </div>
            </div>
        `;

        return;
    }


    inventoryItemData.forEach(function (item) {

        const itemInventory =
            data.filter(function (row) {

                return Number(row.item_id) ===
                    Number(item.id);

            });


        let totalStock = 0;


        itemInventory.forEach(function (row) {

            totalStock +=
                Number(row.stock || 0);

        });


        const column =
            document.createElement("div");

        column.className =
            "col-12 col-xl-6";


        column.innerHTML = `

            <div class="card dashboard-card h-100">

                <div class="card-header bg-white py-3">

                    <div class="d-flex
                                justify-content-between
                                align-items-center">

                        <div>

                            <h5 class="fw-bold mb-1">
                                <i class="bi bi-palette me-2"></i>
                                ${escapeHtml(item.name)}
                            </h5>

                            <small class="text-muted">
                            Daftar Stock Warna  ${escapeHtml(item.name)} (${escapeHtml(item.code)})
                            </small>

                        </div>

                        <span class="badge bg-primary">
                            Total:
                            ${formatStock(totalStock)}
                        </span>

                    </div>

                </div>


                <div class="card-body p-0">

                    <div class="table-responsive">

                        <table class="table
                                      table-hover
                                      mb-0">

                            <thead class="table-light">

                                <tr>

                                    <th class="ps-3">
                                        No. Warna
                                    </th>

                                    <th>
                                        Nama Warna
                                    </th>

                                    <th class="text-end">
                                        Stock
                                    </th>

                                    <th class="text-center">
                                        Status
                                    </th>

                                </tr>

                            </thead>

                            <tbody id="inventoryRows_${item.id}">

                            </tbody>

                        </table>

                    </div>

                </div>


                <div class="card-footer bg-white">

                    <div class="d-flex
                                justify-content-between">

                        <span class="text-muted">
                            Total Stock
                        </span>

                        <strong>
                            ${formatStock(totalStock)}
                        </strong>

                    </div>

                </div>

            </div>

        `;


        inventoryGrid.appendChild(column);


        const tbody =
            document.getElementById(
                `inventoryRows_${item.id}`
            );


        renderInventoryRows(
            tbody,
            itemInventory
        );

    });

}

/* =====================================================
   RENDER INVENTORY ROWS
===================================================== */

function renderInventoryRows(tbody, data) {

    tbody.innerHTML = "";


    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="4"
                    class="text-center text-muted py-4">

                    Belum ada stock

                </td>

            </tr>

        `;

        return;
    }


    data.forEach(function (row) {

        const colorNo =
            row.colors?.color_no || "";

        const colorName =
            row.colors?.color_name || "";

        const stock =
            Number(row.stock || 0);




        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td class="ps-3">
                ${escapeHtml(colorNo)}
            </td>

            <td>
                ${escapeHtml(colorName)}
            </td>

            <td class="text-end fw-semibold">
                ${formatStock(stock)}
            </td>

            <td class="text-center">

               ${
                    stock === 0

                    ?

                    `<span class="badge bg-secondary">
                        Habis
                    </span>`

                    :

                    stock < 50

                    ?

                    `<span class="badge bg-warning text-dark">
                        Low Stock
                    </span>`

                    :

                    `<span class="badge bg-success">
                        Tersedia
                    </span>`
                }
            </td>

        `;


        tbody.appendChild(tr);

    });

}

/* =====================================================
   FORMAT STOCK
===================================================== */

function formatStock(value) {

    return Number(value).toLocaleString(
        "id-ID",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


/* =====================================================
   OPEN ADD STOCK MODAL
===================================================== */

async function openAddStockModal() {

    document.getElementById(
        "stockItem"
    ).value = "";

    document.getElementById(
        "stockColor"
    ).innerHTML = `
        <option value="">
            -- Pilih Warna --
        </option>
    `;

    document.getElementById(
        "stockQty"
    ).value = "";

    document.getElementById(
        "stockNotes"
    ).value = "";


    await loadStockItems();


    const modalElement =
        document.getElementById("addStockModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.show();

}


/* =====================================================
   LOAD ITEM KE MODAL
===================================================== */

async function loadStockItems() {

    const select =
        document.getElementById("stockItem");

    select.innerHTML = `
        <option value="">
            -- Pilih Item --
        </option>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("items")
        .select("id, code, name")
        .eq("status", true)
        .order("name");


    if (error) {
        throw error;
    }


    data.forEach(function (item) {

        const option =
            document.createElement("option");

        /*
            value = ID database
        */

        option.value = item.id;

        option.textContent =
            `${item.code} - ${item.name}`;

        select.appendChild(option);

    });

}


/* =====================================================
   LOAD COLOR BERDASARKAN ITEM
===================================================== */

async function loadStockColors() {

    const itemId =
        document.getElementById(
            "stockItem"
        ).value;

    const colorSelect =
        document.getElementById(
            "stockColor"
        );


    colorSelect.innerHTML = `
        <option value="">
            -- Pilih Warna --
        </option>
    `;


    if (!itemId) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("colors")
        .select(`
            id,
            color_no,
            color_name
        `)
        .eq("item_id", itemId)
        .eq("status", true)
        .order("color_no");


    if (error) {
        console.error(
            "Load color error:",
            error
        );

        alert(
            "Gagal mengambil data warna: " +
            error.message
        );

        return;
    }


    data.forEach(function (color) {

        const option =
            document.createElement("option");

        /*
            value = ID color
        */

        option.value = color.id;

        option.textContent =
            `${color.color_no} - ${color.color_name}`;

        colorSelect.appendChild(option);

    });

}


/* =====================================================
   SAVE ADD STOCK
===================================================== */

async function saveAddStock() {

    const itemId =
        document.getElementById(
            "stockItem"
        ).value;

    const colorId =
        document.getElementById(
            "stockColor"
        ).value;

    const qty =
        document.getElementById(
            "stockQty"
        ).value;

    const notes =
        document.getElementById(
            "stockNotes"
        ).value.trim();


    /* VALIDATION */

    if (!itemId) {

        alert("Silakan pilih Item.");

        return;

    }


    if (!colorId) {

        alert("Silakan pilih Warna.");

        return;

    }


    if (!qty || Number(qty) <= 0) {

        alert(
            "Jumlah stock harus lebih dari 0."
        );

        return;

    }


    try {

        const {
            error
        } = await supabaseClient.rpc(
            "add_stock",
            {
                p_item_id: Number(itemId),
                p_color_id: Number(colorId),
                p_qty: Number(qty),
                p_notes: notes || null
            }
        );


        if (error) {

            console.error(
                "Add stock error:",
                error
            );

            alert(
                "Gagal menambahkan stock: " +
                error.message
            );

            return;

        }


        /* Tutup modal */

        const modalElement =
            document.getElementById(
                "addStockModal"
            );

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {
            modal.hide();
        }


        /* Refresh inventory */

        await loadInventory();


        alert(
            "Stock berhasil ditambahkan."
        );

        window.location.href =
        "app.html?page=inventory";


    } catch (error) {

        console.error(error);

        alert(
            "Terjadi kesalahan: " +
            error.message
        );

        window.location.href =
        "app.html?page=inventory";
    }

}

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}