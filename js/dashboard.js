let salesYtdChart = null;
let salesMtdChart = null;

async function initDashboard() {
    try {
        await Promise.all([
            loadDashboardSummary(),
            loadRecentSales(),
            loadSalesCharts()
        ]);
    } catch (error) {
        console.error("Dashboard error:", error);
    }
}


/* =========================================================
   SUMMARY
========================================================= */

async function loadDashboardSummary() {

    try {

        /* =========================
           TOTAL ITEM
        ========================= */

        const {
            count: itemCount,
            error: itemError
        } = await supabaseClient

            .from("items")

            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "status",
                true
            );


        if (itemError) {
            throw itemError;
        }

        /* =========================
           TOTAL STOCK
        ========================= */

        const {
            data: inventoryData,
            error: inventoryError
        } = await supabaseClient

            .from("inventory")

            .select("stock");


        if (inventoryError) {
            throw inventoryError;
        }


        const totalStock =
            (inventoryData || []).reduce(
                function (sum, row) {

                    return sum +
                        Number(
                            row.stock || 0
                        );

                },
                0
            );


        document.getElementById(
            "totalStock"
        ).textContent =
            formatDashboardStock(
                totalStock
            );


        /* =========================
           TODAY
        ========================= */

        const today =
            getDashboardDate();


        const tomorrow =
            getDashboardNextDate(
                today
            );


        const {
            data: todaySalesData,
            error: todaySalesError
        } = await supabaseClient

            .from("sales")

            .select(`
                id,
                total
            `)

            .gte(
                "sale_date",
                today
            )

            .lt(
                "sale_date",
                tomorrow
            );


        if (todaySalesError) {
            throw todaySalesError;
        }


        const salesToday =
            todaySalesData || [];


        const todaySales =
            salesToday.reduce(
                function (sum, sale) {

                    return sum +
                        Number(
                            sale.total || 0
                        );

                },
                0
            );


        document.getElementById(
            "todaySales"
        ).textContent =
            formatDashboardCurrency(
                todaySales
            );


        document.getElementById(
            "todayTransactions"
        ).textContent =
            salesToday.length.toLocaleString(
                "id-ID"
            );


    } catch (error) {

        console.error(
            "Dashboard summary error:",
            error
        );

        throw error;

    }

}


/* =========================================================
   RECENT SALES
========================================================= */

async function loadRecentSales() {

    try {

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

                customers (
                    company_name
                )
            `)

            .order(
                "sale_date",
                {
                    ascending: false
                }
            )

            .limit(5);


        if (error) {
            throw error;
        }


        const tbody =
            document.getElementById(
                "recentSales"
            );


        if (!data || data.length === 0) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="text-center text-muted py-4">

                        Belum ada transaksi

                    </td>

                </tr>

            `;

            return;

        }


        let html = "";


        data.forEach(
            function (sale) {

                const customer =
                    sale.customers?.company_name ||
                    "-";


                html += `

                    <tr>

                        <td>

                            <span class="fw-semibold">

                                ${escapeHtml(
                                    sale.invoice_no
                                )}

                            </span>

                        </td>


                        <td>

                            ${escapeHtml(
                                customer
                            )}

                        </td>


                        <td>

                            ${formatDashboardDate(
                                sale.sale_date
                            )}

                        </td>


                        <td class="text-end">

                            ${formatDashboardCurrency(
                                sale.total
                            )}

                        </td>

                    </tr>

                `;

            }
        );


        tbody.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Recent sales error:",
            error
        );

        throw error;

    }

}


/* =========================================================
   DATE
========================================================= */

function getDashboardDate() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function getDashboardNextDate(
    value
) {

    const parts =
        value.split("-");


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    date.setDate(
        date.getDate() + 1
    );


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


/* =========================================================
   FORMAT
========================================================= */

function formatDashboardDate(
    value
) {

    if (!value) {
        return "-";
    }


    const text =
        String(value);


    const datePart =
        text.substring(
            0,
            10
        );


    const parts =
        datePart.split("-");


    if (parts.length !== 3) {
        return "-";
    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


function formatDashboardStock(
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


function formatDashboardCurrency(
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


/* =========================================================
   CHART PENJUALAN YTD MTD
========================================================= */

async function loadSalesCharts() {
    try {
        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth();

        // =========================
        // YTD
        // =========================

        const ytdStart =
            `${year}-01-01`;

        const ytdEnd =
            `${year + 1}-01-01`;

        const { data: ytdData, error: ytdError } =
            await supabaseClient
                .from("sales")
                .select("sale_date, total")
                .gte("sale_date", ytdStart)
                .lt("sale_date", ytdEnd)
                .order("sale_date", { ascending: true });

        if (ytdError) throw ytdError;

        const ytdMonthly = {};

        for (let i = 0; i <= month; i++) {
            ytdMonthly[i] = 0;
        }

        (ytdData || []).forEach(function (sale) {

            const dateText = String(sale.sale_date);
            const datePart = dateText.substring(0, 10);

            const saleMonth =
                Number(datePart.substring(5, 7)) - 1;

            if (ytdMonthly[saleMonth] !== undefined) {
                ytdMonthly[saleMonth] +=
                    Number(sale.total || 0);
            }
        });

        const monthNames = [
            "Jan", "Feb", "Mar", "Apr",
            "Mei", "Jun", "Jul", "Agu",
            "Sep", "Okt", "Nov", "Des"
        ];

        const ytdLabels = [];
        const ytdValues = [];

        for (let i = 0; i <= month; i++) {
            ytdLabels.push(monthNames[i]);
            ytdValues.push(ytdMonthly[i]);
        }

        renderSalesYtdChart(ytdLabels, ytdValues);


        // =========================
        // MTD
        // =========================

        const monthStart =
            `${year}-${String(month + 1).padStart(2, "0")}-01`;

        const nextMonthDate =
            new Date(year, month + 1, 1);

        const nextMonth =
            `${nextMonthDate.getFullYear()}-${String(
                nextMonthDate.getMonth() + 1
            ).padStart(2, "0")}-01`;

        const { data: mtdData, error: mtdError } =
            await supabaseClient
                .from("sales")
                .select("sale_date, total")
                .gte("sale_date", monthStart)
                .lt("sale_date", nextMonth)
                .order("sale_date", { ascending: true });

        if (mtdError) throw mtdError;

        const today = now.getDate();

        const mtdDaily = {};

        for (let i = 1; i <= today; i++) {
            mtdDaily[i] = 0;
        }

        (mtdData || []).forEach(function (sale) {

            const dateText = String(sale.sale_date);
            const datePart = dateText.substring(0, 10);

            const saleDay =
                Number(datePart.substring(8, 10));

            if (mtdDaily[saleDay] !== undefined) {
                mtdDaily[saleDay] +=
                    Number(sale.total || 0);
            }
        });

        const mtdLabels = [];
        const mtdValues = [];

        for (let i = 1; i <= today; i++) {
            mtdLabels.push(String(i));
            mtdValues.push(mtdDaily[i]);
        }

        renderSalesMtdChart(mtdLabels, mtdValues);

    } catch (error) {
        console.error("Sales chart error:", error);
    }
}

function renderSalesYtdChart(labels, values) {

    const canvas =
        document.getElementById("salesYtdChart");

    if (!canvas) return;

    if (salesYtdChart) {
        salesYtdChart.destroy();
    }

    salesYtdChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Penjualan",
                data: values,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatDashboardCurrency(
                                context.raw
                            );
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function (value) {
                            return formatDashboardCompactCurrency(
                                value
                            );
                        }
                    }
                }
            }
        }
    });
}

function renderSalesMtdChart(labels, values) {

    const canvas =
        document.getElementById("salesMtdChart");

    if (!canvas) return;

    if (salesMtdChart) {
        salesMtdChart.destroy();
    }

    salesMtdChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Penjualan",
                data: values,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatDashboardCurrency(
                                context.raw
                            );
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function (value) {
                            return formatDashboardCompactCurrency(
                                value
                            );
                        }
                    }
                }
            }
        }
    });
}

function formatDashboardCompactCurrency(value) {

    value = Number(value || 0);

    if (value >= 1000000000) {
        return "Rp " +
            (value / 1000000000).toFixed(1) +
            " M";
    }

    if (value >= 1000000) {
        return "Rp " +
            (value / 1000000).toFixed(1) +
            " jt";
    }

    if (value >= 1000) {
        return "Rp " +
            (value / 1000).toFixed(0) +
            " rb";
    }

    return "Rp " + value.toLocaleString("id-ID");
}