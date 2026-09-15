const permissions = {

    admin: [
        "dashboard",
        "inventory",
        "sales",
        "sales-history",
        "items",
        "colors",
        "prices",
        "customers",
        "reports"
    ],

    kasir: [
        "dashboard",
        "inventory",
        "sales"
    ]

};


const menuConfig = [

    {
        section: "MENU UTAMA"
    },

    {
        id: "dashboard",
        title: "Dashboard",
        icon: "bi-speedometer2"
    },

    {
        id: "inventory",
        title: "Inventory",
        icon: "bi-boxes"
    },

    {
        section: "PENJUALAN"
    },

    {
        id: "sales",
        title: "Transaksi Baru",
        icon: "bi-cart-plus"
    },

    {
        id: "sales-history",
        title: "Riwayat Penjualan",
        icon: "bi-receipt"
    },

    {
        section: "MASTER"
    },

    {
        id: "items",
        title: "Master Item",
        icon: "bi-box"
    },

    {
        id: "colors",
        title: "Master Warna",
        icon: "bi-palette"
    },

    {
        id: "prices",
        title: "Master Harga",
        icon: "bi-tags"
    },

    {
        id: "customers",
        title: "Master Customer",
        icon: "bi-building"
    },

    {
        section: "LAPORAN"
    },

    {
        id: "reports",
        title: "Laporan",
        icon: "bi-bar-chart"
    }

];


let currentPage = "dashboard";


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const user =
            JSON.parse(
                sessionStorage.getItem(
                    "inventory_user"
                )
            );

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        document.getElementById(
            "currentUsername"
        ).textContent =
            user.username;


        document.getElementById(
            "currentRole"
        ).textContent =
            user.role.toUpperCase();


        buildSidebar(user.role);


        document.getElementById(
            "logoutButton"
        ).addEventListener(
            "click",
            logout
        );


        document.getElementById(
            "sidebarToggle"
        ).addEventListener(
            "click",
            function () {

                document
                    .getElementById("sidebar")
                    .classList.toggle("show");

            }
        );


        loadPage("dashboard");

    }
);


function buildSidebar(role) {

    const container =
        document.getElementById(
            "sidebarMenu"
        );

    container.innerHTML = "";


    const allowedPages =
        permissions[role] || [];


    menuConfig.forEach(
        function (menu) {

            if (menu.section) {

                const section =
                    document.createElement("div");

                section.className =
                    "sidebar-section";

                section.textContent =
                    menu.section;

                container.appendChild(section);

                return;
            }


            if (
                !allowedPages.includes(menu.id)
            ) {
                return;
            }


            const link =
                document.createElement("a");

            link.className =
                "sidebar-link";

            link.dataset.page =
                menu.id;


            link.innerHTML = `
                <i class="bi ${menu.icon}"></i>
                <span>${menu.title}</span>
            `;


            link.addEventListener(
                "click",
                function () {

                    loadPage(menu.id);

                }
            );


            container.appendChild(link);

        }
    );

}


function loadPage(page) {

    const user =
        JSON.parse(
            sessionStorage.getItem(
                "inventory_user"
            )
        );


    if (
        !user ||
        !permissions[user.role]?.includes(page)
    ) {

        page = "dashboard";

    }


    currentPage = page;


    fetch(
        `pages/${page}.html`
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Page tidak ditemukan"
                );

            }

            return response.text();

        })

        .then(html => {

            document.getElementById(
                "pageContent"
            ).innerHTML = html;


            updateActiveMenu(page);


            initializePage(page);

        })

        .catch(error => {

            document.getElementById(
                "pageContent"
            ).innerHTML = `
                <div class="alert alert-danger">
                    Gagal membuka halaman.
                    <br>
                    ${error.message}
                </div>
            `;

        });

}


function updateActiveMenu(page) {

    document
        .querySelectorAll(".sidebar-link")
        .forEach(
            link => {

                link.classList.toggle(
                    "active",
                    link.dataset.page === page
                );

            }
        );

}


function initializePage(page) {

    switch (page) {

        case "dashboard":
            if (typeof initDashboard === "function")
                initDashboard();
            break;

        case "inventory":
            if (typeof initInventory === "function")
                initInventory();
            break;

        case "sales":
            if (typeof initSales === "function")
                initSales();
            break;

        case "sales-history":
            if (typeof initSalesHistory === "function")
                initSalesHistory();
            break;

        case "items":
            if (typeof initItems === "function")
                initItems();
            break;

        case "colors":
            if (typeof initColors === "function")
                initColors();
            break;

        case "prices":
            if (typeof initPrices === "function")
                initPrices();
            break;

        case "customers":
            if (typeof initCustomers === "function")
                initCustomers();
            break;

        case "reports":
            if (typeof initReports === "function")
                initReports();
            break;

    }

}


function logout() {

    sessionStorage.removeItem(
        "inventory_user"
    );

    window.location.href =
        "index.html";

}