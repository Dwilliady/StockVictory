let salesHistoryData = [];
let salesDetailData = [];
let currentSalesDetailId = null;

let salesHistoryIsAdmin = false;

let salesEditCustomers = [];
let salesEditItems = [];
let salesEditInventory = [];

let salesEditRowCounter = 0;


/* =====================================================
   INIT
===================================================== */

async function initSalesHistory() {

    try {

        await loadSalesHistoryRole();

        await loadSalesHistory();

        setDefaultSalesHistoryDate();

        filterSalesHistory();

    } catch (error) {

        console.error(
            "Sales History error:",
            error
        );

        alert(
            "Gagal mengambil riwayat penjualan: " +
            error.message
        );

    }

}


/* =====================================================
   LOAD SALES
===================================================== */

async function loadSalesHistory() {

    const {
        data,
        error
    } = await supabaseClient
        .from("sales")
        .select(`
            id,
            invoice_no,
            customer_id,
            sale_date,
            total,
            created_by,
            status,
            updated_at,
            cancel_reason,
            customers (
                id,
                customer_code,
                company_name
            ),
            profiles (
                id,
                username,
                full_name
            )
        `)
        .order(
            "sale_date",
            {
                ascending: false
            }
        );


    if (error) {
        throw error;
    }


    salesHistoryData =
        data || [];

}

async function loadSalesHistoryRole() {

    const {
        data,
        error
    } = await supabaseClient.rpc(
        "get_my_role"
    );


    if (error) {
        throw error;
    }


    salesHistoryIsAdmin =
        String(data || "").toLowerCase() === "admin";


    console.log(
        "Sales History Role:",
        data
    );

}

async function loadSalesHistory() {

    const {
        data,
        error
    } = await supabaseClient
        .from("sales")
        .select(`
            id,
            invoice_no,
            customer_id,
            sale_date,
            total,
            created_by,
            status,
            updated_at,
            cancelled_by,
            cancelled_at,
            cancel_reason,
            customers (
                id,
                customer_code,
                company_name
            ),
            profiles (
                id,
                username,
                full_name
            )
        `)
        .order(
            "sale_date",
            {
                ascending: false
            }
        );


    if (error) {
        throw error;
    }


    salesHistoryData =
        data || [];

}

/* =====================================================
   DEFAULT DATE
===================================================== */

function setDefaultSalesHistoryDate() {

    const dateFrom =
        document.getElementById(
            "salesHistoryDateFrom"
        );

    const dateTo =
        document.getElementById(
            "salesHistoryDateTo"
        );

    const datetimenow = new Date();
    


    if (!dateFrom.value) {

        dateFrom.value =
            new Date()
                .toISOString()
                .split("T")[0];
    }


    if (!dateTo.value) {

        dateTo.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }

}


/* =====================================================
   FILTER
===================================================== */

function filterSalesHistory() {

    const search =
        (
            document.getElementById(
                "salesHistorySearch"
            ).value || ""
        )
        .trim()
        .toLowerCase();


    const dateFrom =
        document.getElementById(
            "salesHistoryDateFrom"
        ).value;


    const dateTo =
        document.getElementById(
            "salesHistoryDateTo"
        ).value;


    const filtered =
        salesHistoryData.filter(
            function (sale) {

                const invoice =
                    (
                        sale.invoice_no || ""
                    ).toLowerCase();


                const customerCode =
                    (
                        sale.customers?.customer_code || ""
                    ).toLowerCase();


                const companyName =
                    (
                        sale.customers?.company_name || ""
                    ).toLowerCase();


                const matchSearch =
                    !search ||

                    invoice.includes(search) ||

                    customerCode.includes(search) ||

                    companyName.includes(search);


                const saleDate =
                    String(
                        sale.sale_date
                    ).substring(0, 10);


                const matchDateFrom =
                    !dateFrom ||
                    saleDate >= dateFrom;


                const matchDateTo =
                    !dateTo ||
                    saleDate <= dateTo;


                return (
                    matchSearch &&
                    matchDateFrom &&
                    matchDateTo
                );

            }
        );


    renderSalesHistory(
        filtered
    );

}


/* =====================================================
   RENDER
===================================================== */

function renderSalesHistory(data) {

    const tbody =
        document.getElementById(
            "salesHistoryTableBody"
        );


    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center text-muted py-4">

                    Tidak ada transaksi.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        data.map(
            function (sale) {

                const customer =
                    sale.customers
                    ? `${sale.customers.customer_code} - ${sale.customers.company_name}`
                    : "-";


                const createdBy =
                    sale.profiles?.full_name ||
                    sale.profiles?.username ||
                    "-";


                const status =
                    sale.status || "COMPLETED";


                let statusBadge = "";


                if (status === "COMPLETED") {

                    statusBadge = `
                        <span class="badge text-bg-success">
                            <i class="bi bi-check-circle me-1"></i>
                            COMPLETED
                        </span>
                    `;

                } else if (status === "CANCELLED") {

                    statusBadge = `
                        <span class="badge text-bg-danger">
                            <i class="bi bi-x-circle me-1"></i>
                            CANCELLED
                        </span>
                    `;

                } else {

                    statusBadge = `
                        <span class="badge text-bg-secondary">
                            ${escapeHtml(status)}
                        </span>
                    `;

                }


                let actionButtons = `

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        onclick="showSalesDetail(${sale.id})">

                        <i class="bi bi-eye me-1"></i>
                        Detail

                    </button>

                `;


                if (
                    salesHistoryIsAdmin &&
                    status === "COMPLETED"
                ) {

                    actionButtons += `

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-warning"
                            onclick="editSalesTransaction(${sale.id})">

                            <i class="bi bi-pencil-square me-1"></i>
                            Edit

                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            onclick="cancelSalesTransaction(${sale.id})">

                            <i class="bi bi-x-circle me-1"></i>
                            Batalkan

                        </button>

                    `;

                }


                return `

                    <tr>

                        <td class="px-3">

                            <span class="fw-semibold">

                                ${escapeHtml(
                                    sale.invoice_no
                                )}

                            </span>

                        </td>


                        <td>

                            ${formatSalesDate(
                                sale.sale_date
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                customer
                            )}

                        </td>


                        <td class="text-end fw-semibold">

                            ${formatCurrency(
                                sale.total
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                createdBy
                            )}

                        </td>


                        <td class="text-center">

                            ${statusBadge}

                        </td>


                        <td class="text-center">

                            <div
                                class="d-flex gap-1 justify-content-center flex-wrap">

                                ${actionButtons}

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =====================================================
   DETAIL
===================================================== */

async function showSalesDetail(
    saleId
) {

     currentSalesDetailId = saleId;

    try {

        const sale =
            salesHistoryData.find(
                function (item) {

                    return Number(item.id) ===
                        Number(saleId);

                }
            );


        if (!sale) {

            throw new Error(
                "Data transaksi tidak ditemukan."
            );

        }


        const {
            data,
            error
        } = await supabaseClient
            .from("sales_detail")
            .select(`
                id,
                sale_id,
                item_id,
                color_id,
                qty,
                price,
                subtotal,
                items (
                    id,
                    code,
                    name
                ),
                colors (
                    id,
                    color_no,
                    color_name
                )
            `)
            .eq(
                "sale_id",
                saleId
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        salesDetailData =
            data || [];


        renderSalesDetail(
            sale,
            salesDetailData
        );


        const modalElement =
            document.getElementById(
                "salesDetailModal"
            );


        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );


        modal.show();


    } catch (error) {

        console.error(
            "Sales detail error:",
            error
        );

        alert(
            "Gagal mengambil detail transaksi: " +
            error.message
        );

    }

}


/* =====================================================
   RENDER DETAIL
===================================================== */

function renderSalesDetail(
    sale,
    details
) {

    document.getElementById(
        "salesDetailInvoice"
    ).textContent =
        sale.invoice_no || "-";


    document.getElementById(
        "salesDetailCustomer"
    ).textContent =
        sale.customers
            ? `${sale.customers.customer_code} - ${sale.customers.company_name}`
            : "-";


    document.getElementById(
        "salesDetailDate"
    ).textContent =
        formatSalesDate(
            sale.sale_date
        );


    document.getElementById(
        "salesDetailCreatedBy"
    ).textContent =
        sale.profiles?.full_name ||
        sale.profiles?.username ||
        "-";

    const statusElement =
        document.getElementById(
            "salesDetailStatus"
        );

    if (statusElement) {

        if (sale.status === "CANCELLED") {

            statusElement.innerHTML = `
                <span class="badge text-bg-danger">
                    <i class="bi bi-x-circle me-1"></i>
                    CANCELLED
                </span>
            `;

        } else {

            statusElement.innerHTML = `
                <span class="badge text-bg-success">
                    <i class="bi bi-check-circle me-1"></i>
                    COMPLETED
                </span>
            `;

        }

    }


    const tbody =
        document.getElementById(
            "salesDetailTableBody"
        );


    if (!details.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="text-center text-muted">

                    Tidak ada detail transaksi.

                </td>

            </tr>

        `;

        document.getElementById(
            "salesDetailTotal"
        ).textContent =
            "Rp0";

        const btnEdit =
            document.getElementById(
                "btnSalesDetailEdit"
            );

        const btnCancel =
            document.getElementById(
                "btnSalesDetailCancel"
            );


        if (btnEdit) {

            btnEdit.classList.toggle(
                "d-none",
                !(
                    salesHistoryIsAdmin &&
                    sale.status === "COMPLETED"
                )
            );

        }


        if (btnCancel) {

            btnCancel.classList.toggle(
                "d-none",
                !(
                    salesHistoryIsAdmin &&
                    sale.status === "COMPLETED"
                )
            );

        }

        return;

    }


    tbody.innerHTML =
        details.map(
            function (detail) {

                const item =
                    detail.items
                    ? `${detail.items.code} - ${detail.items.name}`
                    : "-";


                const color =
                    detail.colors
                    ? `${detail.colors.color_no} - ${detail.colors.color_name}`
                    : "-";


                return `

                    <tr>

                        <td>

                            ${escapeHtml(
                                item
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                color
                            )}

                        </td>


                        <td class="text-end">

                            ${formatStock(
                                detail.qty
                            )}

                        </td>


                        <td class="text-end">

                            ${formatCurrency(
                                detail.price
                            )}

                        </td>


                        <td class="text-end">

                            ${formatCurrency(
                                detail.subtotal
                            )}

                        </td>

                    </tr>

                `;

            }
        ).join("");


    document.getElementById(
        "salesDetailTotal"
    ).textContent =
        formatCurrency(
            sale.total
        );

}

/* =====================================================
   PRINT INVOICE
===================================================== */

function printSalesInvoice() {

    if (!currentSalesDetailId) {

        alert(
            "Data transaksi tidak ditemukan."
        );

        return;

    }


    window.open(
        `print-sale.html?id=${currentSalesDetailId}`,
        "_blank"
    );

}


/* =====================================================
   RESET FILTER
===================================================== */

function resetSalesHistoryFilter() {

    document.getElementById(
        "salesHistorySearch"
    ).value = "";


    document.getElementById(
        "salesHistoryDateFrom"
    ).value = "";


    document.getElementById(
        "salesHistoryDateTo"
    ).value = "";


    filterSalesHistory();

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatSalesDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* =====================================================
   FORMAT STOCK
===================================================== */

function formatStock(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
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

function formatCurrency(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
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

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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

/* =====================================================
   EDIT TRANSACTION
===================================================== */

async function editSalesTransaction(
    saleId
) {

    if (!salesHistoryIsAdmin) {

        alert(
            "Hanya admin yang dapat mengedit transaksi."
        );

        return;

    }


    const sale =
        salesHistoryData.find(
            function (item) {

                return Number(item.id) ===
                    Number(saleId);

            }
        );


    if (!sale) {

        alert(
            "Data transaksi tidak ditemukan."
        );

        return;

    }


    if (sale.status !== "COMPLETED") {

        alert(
            "Transaksi ini tidak dapat diedit."
        );

        return;

    }


    try {

        await loadSalesEditMasterData();

        const {
            data: details,
            error
        } = await supabaseClient
            .from("sales_detail")
            .select(`
                id,
                sale_id,
                item_id,
                color_id,
                qty,
                price,
                subtotal,
                items (
                    id,
                    code,
                    name
                ),
                colors (
                    id,
                    color_no,
                    color_name
                )
            `)
            .eq(
                "sale_id",
                saleId
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        showSalesEditModal(
            sale,
            details || []
        );


    } catch (error) {

        console.error(
            "Edit sales error:",
            error
        );

        alert(
            "Gagal mengambil data transaksi: " +
            error.message
        );

    }

}

async function loadSalesEditMasterData() {

    const [
        customersResult,
        itemsResult,
        inventoryResult
    ] = await Promise.all([

        supabaseClient
            .from("customers")
            .select(`
                id,
                customer_code,
                company_name
            `)
            .eq(
                "status",
                true
            )
            .order(
                "company_name"
            ),

        supabaseClient
            .from("items")
            .select(`
                id,
                code,
                name
            `)
            .eq(
                "status",
                true
            )
            .order(
                "name"
            ),

        supabaseClient
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
            `)

    ]);


    if (customersResult.error) {
        throw customersResult.error;
    }


    if (itemsResult.error) {
        throw itemsResult.error;
    }


    if (inventoryResult.error) {
        throw inventoryResult.error;
    }


    salesEditCustomers =
        customersResult.data || [];


    salesEditItems =
        itemsResult.data || [];


    salesEditInventory =
        inventoryResult.data || [];

}

function showSalesEditModal(
    sale,
    details
) {

    let modalElement =
        document.getElementById(
            "salesEditModal"
        );


    if (!modalElement) {

        document.body.insertAdjacentHTML(
            "beforeend",
            getSalesEditModalHtml()
        );


        modalElement =
            document.getElementById(
                "salesEditModal"
            );

    }


    document.getElementById(
        "salesEditInvoice"
    ).textContent =
        sale.invoice_no;


    const customerSelect =
        document.getElementById(
            "salesEditCustomer"
        );


    customerSelect.innerHTML = `
        <option value="">
            Pilih Customer
        </option>
    `;


    salesEditCustomers.forEach(
        function (customer) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                customer.id;

            option.textContent =
                `${customer.customer_code} - ${customer.company_name}`;

            customerSelect.appendChild(
                option
            );

        }
    );


    customerSelect.value =
        String(
            sale.customer_id
        );


    document.getElementById(
        "salesEditDate"
    ).value =
        String(
            sale.sale_date
        ).substring(0, 10);


    salesEditRowCounter = 0;


    const tbody =
        document.getElementById(
            "salesEditTableBody"
        );

    tbody.innerHTML = "";


    details.forEach(
        function (detail) {

            addSalesEditRow(
                detail
            );

        }
    );


    calculateSalesEditTotal();


    modalElement.dataset.saleId =
        sale.id;


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}

function getSalesEditModalHtml() {

    return `

        <div
            class="modal fade"
            id="salesEditModal"
            tabindex="-1"
            aria-hidden="true">

            <div
                class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">

                <div class="modal-content">

                    <div class="modal-header">

                        <div>

                            <h5 class="modal-title">
                                Edit Transaksi
                            </h5>

                            <div
                                id="salesEditInvoice"
                                class="text-muted small">
                            </div>

                        </div>

                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal">
                        </button>

                    </div>


                    <div class="modal-body">

                        <div class="row g-3 mb-3">

                            <div class="col-md-8">

                                <label class="form-label">
                                    Customer
                                </label>

                                <select
                                    id="salesEditCustomer"
                                    class="form-select">

                                </select>

                            </div>


                            <div class="col-md-4">

                                <label class="form-label">
                                    Tanggal
                                </label>

                                <input
                                    type="date"
                                    id="salesEditDate"
                                    class="form-control"
                                    onchange="reloadSalesEditPrices()">

                            </div>

                        </div>


                        <div class="table-responsive">

                            <table
                                class="table table-bordered align-middle">

                                <thead class="table-light">

                                    <tr>

                                        <th style="min-width:220px;">
                                            Item
                                        </th>

                                        <th style="min-width:220px;">
                                            Warna
                                        </th>

                                        <th
                                            class="text-end"
                                            style="width:120px;">
                                            Stock
                                        </th>

                                        <th
                                            class="text-center"
                                            style="width:110px;">
                                            Qty
                                        </th>

                                        <th
                                            class="text-end"
                                            style="width:150px;">
                                            Harga
                                        </th>

                                        <th
                                            class="text-end"
                                            style="width:160px;">
                                            Subtotal
                                        </th>

                                        <th
                                            class="text-center"
                                            style="width:60px;">
                                        </th>

                                    </tr>

                                </thead>

                                <tbody
                                    id="salesEditTableBody">
                                </tbody>

                                <tfoot>

                                    <tr>

                                        <th
                                            colspan="5"
                                            class="text-end">

                                            Total

                                        </th>

                                        <th
                                            id="salesEditTotal"
                                            class="text-end">

                                            Rp0

                                        </th>

                                        <th></th>

                                    </tr>

                                </tfoot>

                            </table>

                        </div>


                        <button
                            type="button"
                            class="btn btn-outline-primary btn-sm"
                            onclick="addSalesEditRow()">

                            <i class="bi bi-plus-lg me-1"></i>
                            Tambah Item

                        </button>

                    </div>


                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-bs-dismiss="modal">

                            Batal

                        </button>


                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="saveSalesEdit()">

                            <i class="bi bi-check-lg me-1"></i>
                            Simpan Perubahan

                        </button>

                    </div>

                </div>

            </div>

        </div>

    `;

}

function addSalesEditRow(detail = null) {

    salesEditRowCounter++;

    const rowId =
        salesEditRowCounter;

    const tbody =
        document.getElementById(
            "salesEditTableBody"
        );

    if (!tbody) {
        return;
    }

    const row =
        document.createElement("tr");

    row.id =
        `salesEditRow_${rowId}`;

    row.innerHTML = `

        <td>

            <select
                id="salesEditItem_${rowId}"
                class="form-select form-select-sm"
                onchange="changeSalesEditItem(${rowId})">

                <option value="">
                    Pilih Item
                </option>

            </select>

        </td>


        <td>

            <select
                id="salesEditColor_${rowId}"
                class="form-select form-select-sm"
                onchange="changeSalesEditColor(${rowId})">

                <option value="">
                    Pilih Warna
                </option>

            </select>

        </td>


        <td
            id="salesEditStock_${rowId}"
            class="text-end">

            -

        </td>


        <td>

            <input
                type="number"
                id="salesEditQty_${rowId}"
                class="form-control form-control-sm text-center"
                min="1"
                step="1"
                value="1"
                onchange="calculateSalesEditRow(${rowId})"
                oninput="calculateSalesEditRow(${rowId})">

        </td>


        <td
            id="salesEditPrice_${rowId}"
            class="text-end"
            data-value="0">

            Rp0

        </td>


        <td
            id="salesEditSubtotal_${rowId}"
            class="text-end"
            data-value="0">

            Rp0

        </td>


        <td class="text-center">

            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="removeSalesEditRow(${rowId})"
                title="Hapus">

                <i class="bi bi-trash"></i>

            </button>

        </td>

    `;

    tbody.appendChild(row);


    const itemSelect =
        document.getElementById(
            `salesEditItem_${rowId}`
        );


    salesEditItems.forEach(
        function (item) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                `${item.code} - ${item.name}`;

            itemSelect.appendChild(
                option
            );

        }
    );


    if (detail) {

        itemSelect.value =
            String(detail.item_id);

        changeSalesEditItem(
            rowId,
            detail.color_id,
            detail.qty,
            detail.price
        );

    }

}

async function changeSalesEditItem(
    rowId,
    selectedColorId = null,
    selectedQty = null,
    selectedPrice = null
) {

    const itemSelect =
        document.getElementById(
            `salesEditItem_${rowId}`
        );

    const colorSelect =
        document.getElementById(
            `salesEditColor_${rowId}`
        );

    const stockElement =
        document.getElementById(
            `salesEditStock_${rowId}`
        );

    const priceElement =
        document.getElementById(
            `salesEditPrice_${rowId}`
        );


    if (
        !itemSelect ||
        !colorSelect
    ) {
        return;
    }


    const itemId =
        Number(
            itemSelect.value || 0
        );


    colorSelect.innerHTML = `
        <option value="">
            Pilih Warna
        </option>
    `;


    stockElement.textContent =
        "-";


    priceElement.dataset.value =
        "0";

    priceElement.textContent =
        "Rp0";


    if (!itemId) {

        calculateSalesEditRow(
            rowId
        );

        return;

    }


    const colors =
        salesEditInventory.filter(
            function (inventory) {

                return (
                    Number(inventory.item_id) ===
                    itemId &&
                    inventory.colors &&
                    inventory.colors.status === true
                );

            }
        );


    const uniqueColors = [];


    colors.forEach(
        function (inventory) {

            const exists =
                uniqueColors.some(
                    function (color) {

                        return Number(color.id) ===
                            Number(inventory.color_id);

                    }
                );


            if (!exists) {

                uniqueColors.push(
                    inventory.colors
                );

            }

        }
    );


    uniqueColors.forEach(
        function (color) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                color.id;

            option.textContent =
                `${color.color_no} - ${color.color_name}`;

            colorSelect.appendChild(
                option
            );

        }
    );


    if (selectedColorId) {

        colorSelect.value =
            String(selectedColorId);

        await changeSalesEditColor(
            rowId,
            selectedQty,
            selectedPrice
        );

    }

}

async function changeSalesEditColor(
    rowId,
    selectedQty = null,
    selectedPrice = null
) {

    const itemSelect =
        document.getElementById(
            `salesEditItem_${rowId}`
        );

    const colorSelect =
        document.getElementById(
            `salesEditColor_${rowId}`
        );

    const stockElement =
        document.getElementById(
            `salesEditStock_${rowId}`
        );

    const priceElement =
        document.getElementById(
            `salesEditPrice_${rowId}`
        );

    const qtyInput =
        document.getElementById(
            `salesEditQty_${rowId}`
        );


    if (
        !itemSelect ||
        !colorSelect
    ) {
        return;
    }


    const itemId =
        Number(
            itemSelect.value || 0
        );

    const colorId =
        Number(
            colorSelect.value || 0
        );


    if (
        !itemId ||
        !colorId
    ) {

        stockElement.textContent =
            "-";

        priceElement.dataset.value =
            "0";

        priceElement.textContent =
            "Rp0";

        calculateSalesEditRow(
            rowId
        );

        return;

    }


    const inventory =
        salesEditInventory.find(
            function (row) {

                return (
                    Number(row.item_id) === itemId &&
                    Number(row.color_id) === colorId
                );

            }
        );


    if (!inventory) {

        stockElement.innerHTML =
            `<span class="text-danger">
                Stock tidak ditemukan
            </span>`;

        return;

    }


    const stock =
        Number(
            inventory.stock || 0
        );


    stockElement.dataset.value =
        stock;


    if (stock <= 0) {

        stockElement.innerHTML =
            `<span class="text-danger fw-bold">
                Habis
            </span>`;

    } else if (stock <= 5) {

        stockElement.innerHTML =
            `<span class="text-warning fw-bold">
                ${formatStock(stock)}
            </span>`;

    } else {

        stockElement.textContent =
            formatStock(stock);

    }


    /*
     * Saat edit, harga awal kita tampilkan dari
     * harga detail transaksi lama.
     *
     * Kalau user mengganti item, harga akan
     * diambil dari price_history berdasarkan
     * tanggal transaksi.
     */

    if (
        selectedPrice !== null &&
        selectedPrice !== undefined
    ) {

        priceElement.dataset.value =
            Number(selectedPrice);

        priceElement.textContent =
            formatCurrency(
                selectedPrice
            );

    } else {

        const price =
            await getSalesEditPrice(
                itemId
            );

        priceElement.dataset.value =
            price;

        priceElement.textContent =
            formatCurrency(
                price
            );

    }


    if (
        selectedQty !== null &&
        selectedQty !== undefined
    ) {

        qtyInput.value =
            selectedQty;

    }


    qtyInput.max =
        stock;


    calculateSalesEditRow(
        rowId
    );

}

async function getSalesEditPrice(
    itemId
) {

    const date =
        document.getElementById(
            "salesEditDate"
        ).value;


    if (!date) {
        return 0;
    }


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
            itemId
        )
        .lte(
            "effective_from",
            `${date}T23:59:59`
        )
        .or(
            `effective_to.is.null,effective_to.gt.${date}T00:00:00`
        )
        .order(
            "effective_from",
            {
                ascending: false
            }
        )
        .limit(1);


    if (error) {
        throw error;
    }


    if (
        !data ||
        !data.length
    ) {
        return 0;
    }


    return Number(
        data[0].price || 0
    );

}

async function reloadSalesEditPrices() {

    const rows =
        document.querySelectorAll(
            "#salesEditTableBody tr"
        );


    for (
        const row of rows
    ) {

        const rowId =
            row.id.replace(
                "salesEditRow_",
                ""
            );


        const itemSelect =
            document.getElementById(
                `salesEditItem_${rowId}`
            );

        const colorSelect =
            document.getElementById(
                `salesEditColor_${rowId}`
            );

        if (
            !itemSelect ||
            !colorSelect ||
            !itemSelect.value ||
            !colorSelect.value
        ) {
            continue;
        }


        const price =
            await getSalesEditPrice(
                Number(
                    itemSelect.value
                )
            );


        const priceElement =
            document.getElementById(
                `salesEditPrice_${rowId}`
            );


        priceElement.dataset.value =
            price;

        priceElement.textContent =
            formatCurrency(
                price
            );


        calculateSalesEditRow(
            rowId
        );

    }

}

function calculateSalesEditRow(
    rowId
) {

    const qtyInput =
        document.getElementById(
            `salesEditQty_${rowId}`
        );

    const priceElement =
        document.getElementById(
            `salesEditPrice_${rowId}`
        );

    const subtotalElement =
        document.getElementById(
            `salesEditSubtotal_${rowId}`
        );


    if (
        !qtyInput ||
        !priceElement ||
        !subtotalElement
    ) {
        return;
    }


    let qty =
        Number(
            qtyInput.value || 0
        );


    const price =
        Number(
            priceElement.dataset.value || 0
        );


    if (qty < 1) {
        qty = 1;
        qtyInput.value = 1;
    }


    const subtotal =
        qty * price;


    subtotalElement.dataset.value =
        subtotal;

    subtotalElement.textContent =
        formatCurrency(
            subtotal
        );


    calculateSalesEditTotal();

}

function calculateSalesEditTotal() {

    const rows =
        document.querySelectorAll(
            "#salesEditTableBody tr"
        );


    let total = 0;


    rows.forEach(
        function (row) {

            const rowId =
                row.id.replace(
                    "salesEditRow_",
                    ""
                );


            const subtotalElement =
                document.getElementById(
                    `salesEditSubtotal_${rowId}`
                );


            if (subtotalElement) {

                total += Number(
                    subtotalElement.dataset.value || 0
                );

            }

        }
    );


    const totalElement =
        document.getElementById(
            "salesEditTotal"
        );


    if (totalElement) {

        totalElement.textContent =
            formatCurrency(
                total
            );

    }

}

function removeSalesEditRow(
    rowId
) {

    const row =
        document.getElementById(
            `salesEditRow_${rowId}`
        );


    if (!row) {
        return;
    }


    row.remove();


    calculateSalesEditTotal();

}

function validateSalesEditDuplicateItems() {

    const rows =
        document.querySelectorAll(
            "#salesEditTableBody tr"
        );


    const combinations =
        new Set();


    for (
        const row of rows
    ) {

        const rowId =
            row.id.replace(
                "salesEditRow_",
                ""
            );


        const itemId =
            Number(
                document.getElementById(
                    `salesEditItem_${rowId}`
                )?.value || 0
            );


        const colorId =
            Number(
                document.getElementById(
                    `salesEditColor_${rowId}`
                )?.value || 0
            );


        if (
            !itemId ||
            !colorId
        ) {
            continue;
        }


        const key =
            `${itemId}_${colorId}`;


        if (combinations.has(key)) {

            alert(
                "Item dan warna yang sama tidak boleh muncul lebih dari satu kali."
            );

            return false;

        }


        combinations.add(key);

    }


    return true;
}

async function saveSalesEdit() {

    if (!salesHistoryIsAdmin) {

        alert(
            "Hanya admin yang dapat mengedit transaksi."
        );

        return;

    }


    const modalElement =
        document.getElementById(
            "salesEditModal"
        );


    const saleId =
        Number(
            modalElement.dataset.saleId || 0
        );


    const customerId =
        Number(
            document.getElementById(
                "salesEditCustomer"
            ).value || 0
        );


    const saleDate =
        document.getElementById(
            "salesEditDate"
        ).value;


    if (!saleId) {

        alert(
            "ID transaksi tidak ditemukan."
        );

        return;

    }


    if (!customerId) {

        alert(
            "Customer harus dipilih."
        );

        return;

    }


    if (!saleDate) {

        alert(
            "Tanggal transaksi harus diisi."
        );

        return;

    }


    const rows =
        document.querySelectorAll(
            "#salesEditTableBody tr"
        );


    if (!rows.length) {

        alert(
            "Detail transaksi belum diisi."
        );

        return;

    }


    if (
        !validateSalesEditDuplicateItems()
    ) {
        return;
    }


    const details = [];


    for (
        const row of rows
    ) {

        const rowId =
            row.id.replace(
                "salesEditRow_",
                ""
            );


        const itemId =
            Number(
                document.getElementById(
                    `salesEditItem_${rowId}`
                )?.value || 0
            );


        const colorId =
            Number(
                document.getElementById(
                    `salesEditColor_${rowId}`
                )?.value || 0
            );


        const qty =
            Number(
                document.getElementById(
                    `salesEditQty_${rowId}`
                )?.value || 0
            );


        if (
            !itemId ||
            !colorId
        ) {

            alert(
                "Semua Item dan Warna harus dipilih."
            );

            return;

        }


        if (
            !qty ||
            qty <= 0
        ) {

            alert(
                "Qty harus lebih dari 0."
            );

            return;

        }


        details.push({
            item_id: itemId,
            color_id: colorId,
            qty: qty
        });

    }


    const button =
        modalElement.querySelector(
            ".btn-primary"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-1">
            </span>
            Menyimpan...
        `;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "edit_sale",
            {
                p_sale_id: saleId,
                p_customer_id: customerId,
                p_sale_date: saleDate,
                p_details: details
            }
        );


        if (error) {
            throw error;
        }


        console.log(
            "Edit sale result:",
            data
        );


        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }


        alert(
            "Transaksi berhasil diperbarui."
        );


        await loadSalesHistory();

        filterSalesHistory();


        if (
            currentSalesDetailId === saleId
        ) {

            const sale =
                salesHistoryData.find(
                    function (item) {

                        return Number(item.id) ===
                            Number(saleId);

                    }
                );


            if (sale) {

                await showSalesDetail(
                    saleId
                );

            }

        }


    } catch (error) {

        console.error(
            "Save sales edit error:",
            error
        );


        alert(
            "Gagal menyimpan perubahan: " +
            error.message
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="bi bi-check-lg me-1"></i>
                Simpan Perubahan
            `;

        }

    }

}

async function cancelSalesTransaction(
    saleId
) {

    if (!salesHistoryIsAdmin) {

        alert(
            "Hanya admin yang dapat membatalkan transaksi."
        );

        return;

    }


    const sale =
        salesHistoryData.find(
            function (item) {

                return Number(item.id) ===
                    Number(saleId);

            }
        );


    if (!sale) {

        alert(
            "Data transaksi tidak ditemukan."
        );

        return;

    }


    if (sale.status !== "COMPLETED") {

        alert(
            "Transaksi ini sudah tidak dapat dibatalkan."
        );

        return;

    }


    const reason =
        prompt(
            `Alasan pembatalan transaksi ${sale.invoice_no}:`
        );


    if (reason === null) {
        return;
    }


    const cleanReason =
        reason.trim();


    if (!cleanReason) {

        alert(
            "Alasan pembatalan harus diisi."
        );

        return;

    }


    const confirmed =
        confirm(
            `Yakin ingin membatalkan transaksi ${sale.invoice_no}?\n\nAlasan:\n${cleanReason}`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "cancel_sale",
            {
                p_sale_id: saleId,
                p_reason: cleanReason
            }
        );


        if (error) {
            throw error;
        }


        console.log(
            "Cancel sale result:",
            data
        );


        alert(
            "Transaksi berhasil dibatalkan."
        );


        const detailModal =
            document.getElementById(
                "salesDetailModal"
            );


        if (detailModal) {

            const modal =
                bootstrap.Modal.getInstance(
                    detailModal
                );

            if (modal) {
                modal.hide();
            }

        }


        await loadSalesHistory();

        filterSalesHistory();


    } catch (error) {

        console.error(
            "Cancel sales error:",
            error
        );


        alert(
            "Gagal membatalkan transaksi: " +
            error.message
        );

    }

}

function editCurrentSalesTransaction() {

    if (!currentSalesDetailId) {

        alert(
            "Data transaksi tidak ditemukan."
        );

        return;

    }


    const detailModal =
        document.getElementById(
            "salesDetailModal"
        );


    const modal =
        bootstrap.Modal.getInstance(
            detailModal
        );


    if (modal) {
        modal.hide();
    }


    setTimeout(
        function () {

            editSalesTransaction(
                currentSalesDetailId
            );

        },
        200
    );

}

function cancelCurrentSalesTransaction() {

    if (!currentSalesDetailId) {

        alert(
            "Data transaksi tidak ditemukan."
        );

        return;

    }


    cancelSalesTransaction(
        currentSalesDetailId
    );

}