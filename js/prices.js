let priceData = [];
let priceItemData = [];


/* =====================================================
   INIT
===================================================== */

async function initPrices() {

    try {

        await Promise.all([
            loadPrices(),
            loadPriceItems()
        ]);

        renderPrices(priceData);

    } catch (error) {

        console.error(
            "Price error:",
            error
        );

        alert(
            "Gagal mengambil data harga: " +
            error.message
        );

    }

}


/* =====================================================
   LOAD PRICE
===================================================== */

async function loadPrices() {

    const {
        data,
        error
    } = await supabaseClient
        .from("price_history")
        .select(`
            id,
            item_id,
            price,
            effective_from,
            effective_to,
            items (
                id,
                code,
                name,
                status
            )
        `)
        .order("item_id")
        .order("effective_from", {
            ascending: false
        });


    if (error) {
        throw error;
    }


    priceData = data || [];

}


/* =====================================================
   LOAD ITEM
===================================================== */

async function loadPriceItems() {

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


    priceItemData = data || [];

}


/* =====================================================
   RENDER PRICE CARD
===================================================== */

function renderPrices(data) {

    const priceGrid =
        document.getElementById(
            "priceGrid"
        );


    priceGrid.innerHTML = "";


    if (!priceItemData.length) {

        priceGrid.innerHTML = `

            <div class="col-12">

                <div class="alert alert-secondary">

                    Belum ada Item aktif.

                </div>

            </div>

        `;

        return;

    }


    const keyword =
        document.getElementById(
            "priceSearch"
        )?.value
            .toLowerCase()
            .trim() || "";


    /* FILTER ITEM CARD */

    const filteredItems =
        priceItemData.filter(function (item) {

            const itemName =
                item.name
                    ?.toLowerCase() || "";

            const itemCode =
                item.code
                    ?.toLowerCase() || "";


            return (
                !keyword ||
                itemName.includes(keyword) ||
                itemCode.includes(keyword)
            );

        });


    if (!filteredItems.length) {

        priceGrid.innerHTML = `

            <div class="col-12">

                <div class="alert alert-secondary">

                    Item tidak ditemukan.

                </div>

            </div>

        `;

        return;

    }


    filteredItems.forEach(function (item) {

        const itemPrices =
            data.filter(function (row) {

                return (
                    Number(row.item_id) ===
                    Number(item.id)
                );

            });


        const column =
            document.createElement("div");


        column.className =
            "col-12 col-xl-6";


        column.innerHTML = `

            <div class="card dashboard-card h-100">


                <!-- CARD HEADER -->

                <div class="card-header bg-white py-3">

                    <div
                        class="d-flex
                               justify-content-between
                               align-items-center">

                        <div>

                            <h5 class="fw-bold mb-0">
                                <i class="bi bi-palette me-2"></i>

                                ${escapeHtml(
                                    item.name
                                )}

                            </h5>

                            <small class="text-muted">
                                Daftar Harga Item 
                                ${escapeHtml(
                                    item.code
                                )} 

                            </small>

                        </div>
                    </div>

                </div>


                <!-- CARD BODY -->

                <div class="card-body p-0">

                    <div class="table-responsive">

                        <table
                            class="table
                                   table-hover
                                   align-middle
                                   mb-0">

                            <thead class="table-light">

                                <tr>

                                    <th class="ps-3">
                                        Harga
                                    </th>

                                    <th>
                                        Berlaku Mulai
                                    </th>

                                    <th class="text-center">
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody
                                id="priceRows_${item.id}">

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        `;


        priceGrid.appendChild(column);


        const tbody =
            document.getElementById(
                `priceRows_${item.id}`
            );


        renderPriceRows(
            tbody,
            itemPrices
        );

    });

}


/* =====================================================
   RENDER PRICE ROW
===================================================== */

function renderPriceRows(
    tbody,
    data
) {

    tbody.innerHTML = "";


    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="text-center
                           text-muted
                           py-4">

                    Belum ada harga

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(function (row) {

        const isActive =
            row.effective_to === null;


        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td class="ps-3 fw-semibold">

                ${formatCurrency(
                    row.price
                )}

            </td>


            <td>

                ${formatDate(
                    row.effective_from
                )}

            </td>


            <td class="text-center">

                ${
                    isActive

                    ?

                    `<span class="badge bg-success">
                        Aktif
                    </span>`

                    :

                    `<span class="badge bg-secondary">
                        History
                    </span>`
                }

            </td>

        `;


        tbody.appendChild(tr);

    });

}


/* =====================================================
   OPEN MODAL
===================================================== */

function openPriceModal() {

    document.getElementById(
        "priceItem"
    ).value = "";


    document.getElementById(
        "priceValue"
    ).value = "";


    document.getElementById(
        "priceEffectiveFrom"
    ).value =
        new Date()
            .toISOString()
            .split("T")[0];


    fillPriceItemDropdown();


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "priceModal"
            )
        );


    modal.show();

}


/* =====================================================
   OPEN MODAL FROM ITEM CARD
===================================================== */

function openPriceModalForItem(
    itemId
) {

    openPriceModal();


    document.getElementById(
        "priceItem"
    ).value = itemId;

}


/* =====================================================
   ITEM DROPDOWN
===================================================== */

function fillPriceItemDropdown() {

    const select =
        document.getElementById(
            "priceItem"
        );


    select.innerHTML = `

        <option value="">
            -- Pilih Item --
        </option>

    `;


    priceItemData.forEach(function (item) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            item.id;


        option.textContent =
            `${item.code} - ${item.name}`;


        select.appendChild(
            option
        );

    });

}


/* =====================================================
   SAVE PRICE
===================================================== */

async function savePrice() {

    const itemId =
        document.getElementById(
            "priceItem"
        ).value;


    const price =
        document.getElementById(
            "priceValue"
        ).value;


    const effectiveFrom =
        document.getElementById(
            "priceEffectiveFrom"
        ).value;


    /* VALIDATION */

    if (!itemId) {

        alert(
            "Silakan pilih Item."
        );

        return;

    }


    if (
        price === "" ||
        Number(price) < 0
    ) {

        alert(
            "Harga harus diisi."
        );

        return;

    }


    if (!effectiveFrom) {

        alert(
            "Tanggal berlaku harus diisi."
        );

        return;

    }


    try {

        const {
            error
        } = await supabaseClient.rpc(
            "set_item_price",
            {
                p_item_id:
                    Number(itemId),

                p_price:
                    Number(price),

                p_effective_from:
                    effectiveFrom
            }
        );


        if (error) {

            console.error(
                "Save price error:",
                error
            );


            alert(
                "Gagal menyimpan harga: " +
                error.message
            );


            return;

        }


        alert(
            "Harga berhasil disimpan."
        );


        window.location.href =
            "app.html?page=prices";


    } catch (error) {

        console.error(
            "Save price error:",
            error
        );


        alert(
            "Terjadi kesalahan: " +
            error.message
        );

    }

}

/* =====================================================
   FORMAT CURRENCY
===================================================== */

function formatCurrency(
    value
) {

    return Number(value || 0)
        .toLocaleString(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0
            }
        );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    return new Date(value)
        .toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}