let saleCustomerData = [];
let saleItemData = [];
let saleInventoryData = [];
let saleRowCounter = 0;

let savedSaleId = null;

/* =====================================================
   INIT
===================================================== */

async function initSales() {

    try {

        await Promise.all([
            loadSaleCustomers(),
            loadSaleItems(),
            loadSaleInventory()
        ]);


        document.getElementById(
            "saleDate"
        ).value =
            new Date()
                .toISOString()
                .split("T")[0];


        addSaleRow();


    } catch (error) {

        console.error(
            "Sales error:",
            error
        );

        alert(
            "Gagal mengambil data penjualan: " +
            error.message
        );

    }

}


/* =====================================================
   LOAD CUSTOMER
===================================================== */

async function loadSaleCustomers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("customers")
        .select(`
            id,
            customer_code,
            company_name
        `)
        .eq("status", true)
        .order("company_name");


    if (error) {
        throw error;
    }


    saleCustomerData =
        data || [];


    const select =
        document.getElementById(
            "saleCustomer"
        );


    select.innerHTML = `

        <option value="">
            -- Pilih Customer --
        </option>

    `;


    saleCustomerData.forEach(
        function (customer) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                customer.id;


            option.textContent =
                `${customer.customer_code} - ${customer.company_name}`;


            select.appendChild(
                option
            );

        }
    );

}


/* =====================================================
   LOAD ITEM
===================================================== */

async function loadSaleItems() {

    const {
        data,
        error
    } = await supabaseClient
        .from("items")
        .select(`
            id,
            code,
            name
        `)
        .eq("status", true)
        .order("name");


    if (error) {
        throw error;
    }


    saleItemData =
        data || [];

}


/* =====================================================
   LOAD INVENTORY
===================================================== */

async function loadSaleInventory() {

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
                name
            ),
            colors (
                id,
                color_no,
                color_name,
                status
            )
        `);


    if (error) {
        throw error;
    }


    saleInventoryData =
        data || [];

}


/* =====================================================
   ADD ROW
===================================================== */

function addSaleRow() {

    saleRowCounter++;


    const rowId =
        saleRowCounter;


    const tbody =
        document.getElementById(
            "saleDetailBody"
        );


    const tr =
        document.createElement("tr");


    tr.id =
        `saleRow_${rowId}`;


    tr.innerHTML = `

        <!-- ITEM -->

        <td>

            <select
                class="form-select"
                id="saleItem_${rowId}"
                onchange="changeSaleItem(${rowId})">

                <option value="">
                    -- Pilih Item --
                </option>

                ${saleItemData.map(
                    function (item) {

                        return `

                            <option
                                value="${item.id}">

                                ${escapeHtml(
                                    item.code
                                )}
                                -
                                ${escapeHtml(
                                    item.name
                                )}

                            </option>

                        `;

                    }
                ).join("")}

            </select>

        </td>


        <!-- WARNA -->

        <td>

            <select
                class="form-select"
                id="saleColor_${rowId}"
                onchange="changeSaleColor(${rowId})">

                <option value="">
                    -- Pilih Warna --
                </option>

            </select>

        </td>


        <!-- STOCK -->

        <td
            class="text-end"
            id="saleStock_${rowId}">

            -

        </td>


        <!-- QTY -->

        <td>

            <input
                type="number"
                class="form-control text-end"
                id="saleQty_${rowId}"
                min="1"
                step="1"
                value="1"
                onchange="calculateSaleRow(${rowId})"
                oninput="calculateSaleRow(${rowId})">

        </td>


        <!-- HARGA -->

        <td
            class="text-end"
            id="salePrice_${rowId}"
            data-value="0">

            -

        </td>


        <!-- SUBTOTAL -->

        <td
            class="text-end fw-semibold"
            id="saleSubtotal_${rowId}"
            data-value="0">

            Rp0

        </td>


        <!-- DELETE -->

        <td class="text-center">

            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="removeSaleRow(${rowId})"
                title="Hapus">

                <i class="bi bi-trash"></i>

            </button>

        </td>

    `;


    tbody.appendChild(tr);

}


/* =====================================================
   CHANGE ITEM
===================================================== */

async function changeSaleItem(rowId) {
    
    console.log("CHANGE ITEM START", rowId);

    const itemId =
        document.getElementById(
            `saleItem_${rowId}`
        ).value;


    const colorSelect =
        document.getElementById(
            `saleColor_${rowId}`
        );


    const stockElement =
        document.getElementById(
            `saleStock_${rowId}`
        );


    const priceElement =
        document.getElementById(
            `salePrice_${rowId}`
        );


    colorSelect.innerHTML = `

        <option value="">
            -- Pilih Warna --
        </option>

    `;


    stockElement.textContent =
        "-";


    priceElement.textContent =
        "-";


    document.getElementById(
        `saleSubtotal_${rowId}`
    ).textContent =
        "Rp0";


    document.getElementById(
        `saleSubtotal_${rowId}`
    ).dataset.value = 0;


    if (!itemId) {

        calculateSaleTotal();

        return;

    }


    /* LOAD WARNA */

    const inventory =
        saleInventoryData.filter(
            function (row) {

                return (
                    Number(row.item_id) ===
                    Number(itemId) &&

                    row.colors?.status === true
                );

            }
        );


    inventory.forEach(
        function (row) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                row.color_id;


            option.textContent =
                `${row.colors.color_no} - ${row.colors.color_name}`;


            colorSelect.appendChild(
                option
            );

        }
    );


    /* LOAD HARGA */

    const saleDate =
        document.getElementById(
            "saleDate"
        ).value;

    console.log("GET PRICE DONE", rowId);


    if (!saleDate) {

        calculateSaleTotal();

        return;

    }


    try {

        const priceData =
            await getSalePrice(
                itemId,
                saleDate
            );


        if (priceData) {

            priceElement.textContent =
                formatCurrency(
                    priceData.price
                );


            priceElement.dataset.value =
                Number(
                    priceData.price
                );

        } else {

            priceElement.textContent =
                "Belum ada harga";


            priceElement.dataset.value =
                0;

        }


        calculateSaleRow(
            rowId
        );


    } catch (error) {

        console.error(
            "Get sale price error:",
            error
        );


        alert(
            "Gagal mengambil harga: " +
            error.message
        );

    }

}

/* =====================================================
   CHANGE COLOR
===================================================== */

function changeSaleColor(rowId) {

    const itemId =
        document.getElementById(
            `saleItem_${rowId}`
        ).value;


    const colorId =
        document.getElementById(
            `saleColor_${rowId}`
        ).value;


    const stockElement =
        document.getElementById(
            `saleStock_${rowId}`
        );


    if (!itemId || !colorId) {

        stockElement.textContent =
            "-";

        return;

    }


    const inventory =
        saleInventoryData.find(
            function (row) {

                return (
                    Number(row.item_id) ===
                    Number(itemId) &&

                    Number(row.color_id) ===
                    Number(colorId)
                );

            }
        );


    const stock =
        Number(
            inventory?.stock || 0
        );


    stockElement.textContent =
        formatStock(stock);


    calculateSaleRow(rowId);

}

/* =====================================================
   Reload PRICE
===================================================== */
async function reloadSalePrices() {

    const rows =
        document.querySelectorAll(
            '[id^="saleRow_"]'
        );

    const promises = [];

    for (const row of rows) {

        const rowId =
            row.id.replace(
                "saleRow_",
                ""
            );

        const itemId =
            document.getElementById(
                `saleItem_${rowId}`
            ).value;

        if (itemId) {

            promises.push(
                changeSaleItem(rowId)
            );

        }
    }

    await Promise.all(promises);
}

/* =====================================================
   Validasi untuk Jenis Item yang sama dengan Warna yang sama gaboleh pisah rows
===================================================== */

function validateSaleDuplicateItems(details) {
    const used = new Set();

    for (const detail of details) {
        const key = `${detail.item_id}_${detail.color_id}`;

        if (used.has(key)) {
            return false;
        }

        used.add(key);
    }

    return true;
}


/* =====================================================
   CALCULATE ROW
===================================================== */

function calculateSaleRow(rowId) {

    const qty =
        Number(
            document.getElementById(
                `saleQty_${rowId}`
            ).value || 0
        );


    const priceElement =
        document.getElementById(
            `salePrice_${rowId}`
        );


    const subtotalElement =
        document.getElementById(
            `saleSubtotal_${rowId}`
        );


    const price =
        Number(
            priceElement.dataset.value || 0
        );


    const subtotal =
        qty * price;


    subtotalElement.dataset.value =
        subtotal;


    subtotalElement.textContent =
        formatCurrency(
            subtotal
        );


    calculateSaleTotal();

}


/* =====================================================
   REMOVE ROW
===================================================== */

function removeSaleRow(rowId) {

    const row =
        document.getElementById(
            `saleRow_${rowId}`
        );


    if (row) {

        row.remove();

    }


    calculateSaleTotal();

}


/* =====================================================
   TOTAL
===================================================== */

function calculateSaleTotal() {

    let total = 0;


    document
        .querySelectorAll(
            '[id^="saleSubtotal_"]'
        )
        .forEach(
            function (element) {

                const value =
                    Number(
                        element.dataset.value ||
                        0
                    );


                total += value;

            }
        );


    document.getElementById(
        "saleTotal"
    ).textContent =
        formatCurrency(total);

}


/* =====================================================
   RESET
===================================================== */

function resetSaleForm() {

    if (
        !confirm(
            "Batalkan transaksi ini?"
        )
    ) {

        return;

    }


    window.location.href =
        "app.html?page=sales";

}

/* =====================================================
   HARGA ITEM
===================================================== */

async function getSalePrice(itemId, saleDate) {

    const {
        data,
        error
    } = await supabaseClient
        .from("price_history")
        .select(`
            price,
            effective_from,
            effective_to
        `)
        .eq(
            "item_id",
            Number(itemId)
        )
        .lte(
            "effective_from",
            `${saleDate}T23:59:59`
        )
        .or(
            `effective_to.is.null,effective_to.gt.${saleDate}T23:59:59`
        )
        .order(
            "effective_from",
            {
                ascending: false
            }
        )
        .limit(1)
        .maybeSingle();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   SAVE
===================================================== */

async function saveSale() {
    try {
        const customerId = document.getElementById("saleCustomer").value;
        const saleDate = document.getElementById("saleDate").value;
        const rows = document.querySelectorAll("#saleDetailBody tr");

        if (!customerId) {
            alert("Customer harus dipilih.");
            return;
        }

        if (!saleDate) {
            alert("Tanggal transaksi harus diisi.");
            return;
        }

        if (rows.length === 0) {
            alert("Detail transaksi belum diisi.");
            return;
        }

        const details = [];

        for (const row of rows) {
            const rowId = row.id.replace("saleRow_", "");

            const itemId = document.getElementById(`saleItem_${rowId}`).value;
            const colorId = document.getElementById(`saleColor_${rowId}`).value;
            const qty = Number(
                document.getElementById(`saleQty_${rowId}`).value || 0
            );

            if (!itemId) {
                alert("Item harus dipilih pada semua baris.");
                return;
            }

            if (!colorId) {
                alert("Warna harus dipilih pada semua baris.");
                return;
            }

            if (qty <= 0) {
                alert("Quantity harus lebih dari 0.");
                return;
            }

            details.push({
                item_id: Number(itemId),
                color_id: Number(colorId),
                qty: qty
            });
        }

        // Cek duplicate Item + Warna
        if (!validateSaleDuplicateItems(details)) {
            alert("Item dan warna yang sama tidak boleh dimasukkan lebih dari satu kali.");
            return;
        }

        const saveButton = document.getElementById("btnSaveSale");

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML =
                '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        }

        const result = await supabaseClient.rpc(
            "create_sale",
            {
                p_customer_id: customerId,
                p_sale_date: saleDate,
                p_details: details
            }
        );

        if (result.error) {
            throw result.error;
        }

        const saleData = result.data;

        showSaleSuccessModal(
            saleData
        );


    } catch (error) {
        console.error("saveSale error:", error);

        alert(
            error.message ||
            "Terjadi kesalahan saat menyimpan transaksi."
        );

        const saveButton = document.getElementById("btnSaveSale");

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = "Simpan Transaksi";
        }
    }
}

function showSaleSuccessModal(saleData) {

    savedSaleId =
        saleData.sale_id;


    document.getElementById(
        "saleSuccessInvoice"
    ).textContent =
        saleData.invoice_no || "-";


    document.getElementById(
        "saleSuccessTotal"
    ).textContent =
        formatCurrency(
            saleData.total
        );


    const modalElement =
        document.getElementById(
            "saleSuccessModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}

function printSavedSale() {

    if (!savedSaleId) {

        alert(
            "Data transaksi tidak ditemukan."
        );

        return;

    }


    window.open(
        `print-sale.html?id=${savedSaleId}`,
        "_blank"
    );

}

function finishSavedSale() {

    window.location.href =
        "app.html?page=sales-history";

}


/* =====================================================
   FORMAT STOCK
===================================================== */

function formatStock(value) {

    return Number(value || 0)
        .toLocaleString(
            "id-ID",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


/* =====================================================
   FORMAT CURRENCY
===================================================== */

function formatCurrency(value) {

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
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}