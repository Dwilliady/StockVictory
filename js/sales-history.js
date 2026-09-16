let salesHistoryData = [];
let salesDetailData = [];
let currentSalesDetailId = null;


/* =====================================================
   INIT
===================================================== */

async function initSalesHistory() {

    try {

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
                    colspan="6"
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

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary"
                                onclick="showSalesDetail(${sale.id})">

                                <i class="bi bi-eye me-1"></i>
                                Detail

                            </button>

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