let reportSalesData = [];
let reportDetailData = [];
let reportStockData = [];


async function initReports() {

    try {

        setDefaultReportDate();

        await loadReports();

    } catch (error) {

        console.error(
            "Init reports error:",
            error
        );

        alert(
            "Gagal memuat laporan: " +
            error.message
        );

    }

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultReportDate() {

    const dateFrom =
        document.getElementById(
            "reportDateFrom"
        );

    const dateTo =
        document.getElementById(
            "reportDateTo"
        );


    if (!dateFrom || !dateTo) {
        return;
    }


    const today =
        new Date();


    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    dateFrom.value =
        formatInputDate(firstDay);

    dateTo.value =
        formatInputDate(today);

}


/* =========================================================
   LOAD REPORT
========================================================= */

async function loadReports() {

    try {

        const dateFrom =
            document.getElementById(
                "reportDateFrom"
            ).value;

        const dateTo =
            document.getElementById(
                "reportDateTo"
            ).value;


        if (!dateFrom || !dateTo) {

            alert(
                "Tanggal dari dan tanggal sampai harus diisi."
            );

            return;
        }


        if (dateFrom > dateTo) {

            alert(
                "Tanggal Dari tidak boleh lebih besar dari Tanggal Sampai."
            );

            return;
        }


        const {
            data,
            error
        } = await supabaseClient

            .from("sales")

            .select(`
                id,
                invoice_no,
                sale_date,
                total,
                customer_id,

                customers (
                    id,
                    customer_code,
                    company_name
                ),

                sales_detail (
                    id,
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
                )
            `)

            .gte(
                "sale_date",
                dateFrom
            )

            .lte(
                "sale_date",
                dateTo
            )

            .order(
                "sale_date",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        reportSalesData =
            data || [];

        const {
            data: stockData,
            error: stockError
        } = await supabaseClient

            .from("stock_movements")

            .select(`
                id,
                item_id,
                color_id,
                movement_type,
                qty,
                reference_id,
                reference_type,
                notes,
                created_at,

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

            .gte(
                "created_at",
                `${dateFrom}T00:00:00`
            )

            .lt(
                "created_at",
                `${getNextDate(dateTo)}T00:00:00`
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (stockError) {
            throw stockError;
        }


        reportStockData =
            stockData || [];

        const saleIds =
            reportStockData
                .filter(
                    movement =>
                        movement.reference_type === "SALE" &&
                        movement.reference_id
                )
                .map(
                    movement =>
                        movement.reference_id
                );


        if (saleIds.length > 0) {

            const {
                data: saleReferences,
                error: saleReferenceError
            } = await supabaseClient

                .from("sales")

                .select(`
                    id,
                    invoice_no
                `)

                .in(
                    "id",
                    saleIds
                );


            if (saleReferenceError) {
                throw saleReferenceError;
            }


            const saleMap =
                new Map(
                    (saleReferences || []).map(
                        sale => [
                            sale.id,
                            sale.invoice_no
                        ]
                    )
                );


            reportStockData =
                reportStockData.map(
                    movement => ({

                        ...movement,

                        invoice_no:
                            saleMap.get(
                                movement.reference_id
                            ) || null

                    })
                );

        }

        buildReportDetailData();


        renderReportSummary();

        renderReportByItem();

        renderReportDetail();

        renderReportStock();


    } catch (error) {

        console.error(
            "Load reports error:",
            error
        );

        alert(
            "Gagal memuat laporan: " +
            error.message
        );

    }

}

function getNextDate(value) {

    const date =
        new Date(
            value + "T00:00:00"
        );


    date.setDate(
        date.getDate() + 1
    );


    return formatInputDate(date);

}

function renderReportStock() {

    const tbody =
        document.getElementById(
            "reportStockTableBody"
        );


    if (!reportStockData.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center text-muted py-4">

                    Tidak ada mutasi stock

                </td>

            </tr>

        `;


        document.getElementById(
            "reportStockIn"
        ).textContent =
            "IN: 0";


        document.getElementById(
            "reportStockOut"
        ).textContent =
            "OUT: 0";


        return;

    }


    let html = "";


    let totalIn = 0;

    let totalOut = 0;


    reportStockData.forEach(
        function (movement) {

            const item =
                movement.items || {};


            const color =
                movement.colors || {};


            const qty =
                Number(
                    movement.qty || 0
                );


            if (
                movement.movement_type === "IN"
            ) {

                totalIn += qty;

            } else if (
                movement.movement_type === "OUT"
            ) {

                totalOut += qty;

            }


            let reference = "-";


            if (
                movement.reference_type === "SALE"
            ) {

                reference =
                    movement.invoice_no ||
                    `Sale #${movement.reference_id}`;

            } else if (
                movement.reference_type === "STOCK_IN"
            ) {

                reference =
                    "STOCK IN";

            } else if (
                movement.reference_type
            ) {

                reference =
                    movement.reference_type;

            }


            const typeBadge =
                movement.movement_type === "IN"

                    ? `
                        <span class="badge bg-success">
                            IN
                        </span>
                    `

                    : `
                        <span class="badge bg-danger">
                            OUT
                        </span>
                    `;


            html += `

                <tr>

                    <td>

                        ${formatReportDateTime(
                            movement.created_at
                        )}

                    </td>


                    <td>

                        <div class="fw-semibold">

                            ${escapeHtml(
                                item.code || "-"
                            )}

                        </div>

                        <div class="text-muted small">

                            ${escapeHtml(
                                item.name || "-"
                            )}

                        </div>

                    </td>


                    <td>

                        ${escapeHtml(
                            color.color_no || "-"
                        )}
                        -
                        ${escapeHtml(
                            color.color_name || "-"
                        )}

                    </td>


                    <td class="text-center">

                        ${typeBadge}

                    </td>


                    <td class="text-end fw-semibold">

                        ${formatStock(
                            qty
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            reference
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            movement.notes || "-"
                        )}

                    </td>

                </tr>

            `;

        }
    );


    tbody.innerHTML =
        html;


    document.getElementById(
        "reportStockIn"
    ).textContent =
        `IN: ${formatStock(totalIn)}`;


    document.getElementById(
        "reportStockOut"
    ).textContent =
        `OUT: ${formatStock(totalOut)}`;

}

function formatReportDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}

/* =========================================================
   BUILD DETAIL
========================================================= */

function buildReportDetailData() {

    reportDetailData = [];


    reportSalesData.forEach(
        function (sale) {

            const details =
                sale.sales_detail || [];


            details.forEach(
                function (detail) {

                    reportDetailData.push({

                        sale_id:
                            sale.id,

                        invoice_no:
                            sale.invoice_no,

                        sale_date:
                            sale.sale_date,

                        customer:
                            sale.customers || {},

                        item:
                            detail.items || {},

                        color:
                            detail.colors || {},

                        qty:
                            Number(
                                detail.qty || 0
                            ),

                        price:
                            Number(
                                detail.price || 0
                            ),

                        subtotal:
                            Number(
                                detail.subtotal || 0
                            )

                    });

                }
            );

        }
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function renderReportSummary() {

    const totalTransaction =
        reportSalesData.length;


    const totalSales =
        reportSalesData.reduce(
            function (sum, sale) {

                return sum +
                    Number(
                        sale.total || 0
                    );

            },
            0
        );


    const totalQty =
        reportDetailData.reduce(
            function (sum, detail) {

                return sum +
                    Number(
                        detail.qty || 0
                    );

            },
            0
        );


    document.getElementById(
        "reportTotalTransaction"
    ).textContent =
        totalTransaction.toLocaleString(
            "id-ID"
        );


    document.getElementById(
        "reportTotalSales"
    ).textContent =
        formatCurrency(
            totalSales
        );


    document.getElementById(
        "reportTotalQty"
    ).textContent =
        formatStock(
            totalQty
        );

}


/* =========================================================
   SALES BY ITEM
========================================================= */

function renderReportByItem() {

    const tbody =
        document.getElementById(
            "reportItemTableBody"
        );


    if (!reportDetailData.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-muted py-4">

                    Tidak ada data penjualan

                </td>

            </tr>

        `;


        document.getElementById(
            "reportItemTotalQty"
        ).textContent = "0";


        document.getElementById(
            "reportItemTotalSales"
        ).textContent =
            formatCurrency(0);


        return;

    }


    const itemMap =
        new Map();


    reportDetailData.forEach(
        function (detail) {

            const itemId =
                detail.item.id;


            if (!itemMap.has(itemId)) {

                itemMap.set(
                    itemId,
                    {

                        code:
                            detail.item.code,

                        name:
                            detail.item.name,

                        qty: 0,

                        total: 0

                    }
                );

            }


            const item =
                itemMap.get(itemId);


            item.qty +=
                detail.qty;

            item.total +=
                detail.subtotal;

        }
    );


    const items =
        Array.from(
            itemMap.values()
        );


    items.sort(
        function (a, b) {

            return b.total - a.total;

        }
    );


    let html = "";


    let totalQty = 0;

    let totalSales = 0;


    items.forEach(
        function (item, index) {

            totalQty +=
                item.qty;

            totalSales +=
                item.total;


            html += `

                <tr>

                    <td class="text-center">
                        ${index + 1}
                    </td>

                    <td>

                        <div class="fw-semibold">

                            ${escapeHtml(
                                item.code
                            )}

                        </div>

                        <div class="text-muted small">

                            ${escapeHtml(
                                item.name
                            )}

                        </div>

                    </td>

                    <td class="text-end">

                        ${formatStock(
                            item.qty
                        )}

                    </td>

                    <td class="text-end">

                        ${formatCurrency(
                            item.total
                        )}

                    </td>

                </tr>

            `;

        }
    );


    tbody.innerHTML =
        html;


    document.getElementById(
        "reportItemTotalQty"
    ).textContent =
        formatStock(
            totalQty
        );


    document.getElementById(
        "reportItemTotalSales"
    ).textContent =
        formatCurrency(
            totalSales
        );

}


/* =========================================================
   DETAIL
========================================================= */

function renderReportDetail() {

    const tbody =
        document.getElementById(
            "reportDetailTableBody"
        );

    console.log(reportDetailData);

    if (!reportDetailData.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center text-muted py-4">

                    Tidak ada data penjualan

                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    reportDetailData.forEach(
        function (detail) {

            const customer =
                detail.customer;


            html += `

                <tr>

                    <td>

                        <span class="fw-semibold">

                            ${escapeHtml(
                                detail.invoice_no
                            )}

                        </span>

                    </td>


                    <td>

                        ${formatReportDate(
                            detail.sale_date
                        )}

                    </td>


                    <td>

                        <div class="fw-semibold">

                            ${escapeHtml(
                                customer.company_name || "-"
                            )}

                        </div>

                        <div class="text-muted small">

                            ${escapeHtml(
                                customer.customer_code || ""
                            )}

                        </div>

                    </td>


                    <td>

                        <div class="fw-semibold">

                            ${escapeHtml(
                                detail.item.code || "-"
                            )}

                        </div>

                        <div class="text-muted small">

                            ${escapeHtml(
                                detail.item.name || "-"
                            )}

                        </div>

                    </td>


                    <td>

                        ${escapeHtml(
                            detail.color.color_no || "-"
                        )}
                        -
                        ${escapeHtml(
                            detail.color.color_name || "-"
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


                    <td class="text-end fw-semibold">

                        ${formatCurrency(
                            detail.subtotal
                        )}

                    </td>

                </tr>

            `;

        }
    );


    tbody.innerHTML =
        html;

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetReportFilter() {

    setDefaultReportDate();

    loadReports();

}


/* =========================================================
   FORMAT
========================================================= */

function formatInputDate(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function formatReportDate(value) {

    if (!value) {
        return "-";
    }

    const text = String(value);

    const datePart = text.substring(0, 10);

    const parts = datePart.split("-");

    if (parts.length !== 3) {
        return "-";
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    return `${day}/${month}/${year}`;

}


function formatStock(value) {

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


function formatCurrency(value) {

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


function escapeHtml(value) {

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