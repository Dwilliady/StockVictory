function initDashboard() {

    document.getElementById(
        "totalItems"
    ).textContent = "2";


    document.getElementById(
        "totalStock"
    ).textContent = "550";


    document.getElementById(
        "todaySales"
    ).textContent = "Rp 4.250.000";


    document.getElementById(
        "todayTransactions"
    ).textContent = "8";


    const sales = [

        {
            invoice: "INV-20260915-001",
            customer: "PT ABC",
            date: "15-09-2026",
            total: 1250000
        },

        {
            invoice: "INV-20260915-002",
            customer: "PT XYZ",
            date: "15-09-2026",
            total: 850000
        },

        {
            invoice: "INV-20260914-015",
            customer: "PT DEF",
            date: "14-09-2026",
            total: 2150000
        }

    ];


    const tbody =
        document.getElementById(
            "recentSales"
        );


    tbody.innerHTML =
        sales.map(
            sale => `

                <tr>

                    <td>
                        ${sale.invoice}
                    </td>

                    <td>
                        ${sale.customer}
                    </td>

                    <td>
                        ${sale.date}
                    </td>

                    <td>
                        Rp ${sale.total.toLocaleString("id-ID")}
                    </td>

                </tr>

            `
        ).join("");

}