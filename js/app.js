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
    async function () {

        // =========================================
        // CEK SESSION SUPABASE
        // =========================================

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error || !session) {

            window.location.href = "index.html";

            return;
        }


        // =========================================
        // AMBIL PROFILE USER
        // =========================================

        const {
            data: user,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                full_name,
                role,
                is_active
            `)
            .eq("id", session.user.id)
            .single();


        if (profileError || !user) {

            console.error(
                "Profile error:",
                profileError
            );

            await supabaseClient.auth.signOut();

            window.location.href = "index.html";

            return;
        }


        // =========================================
        // CEK USER AKTIF
        // =========================================

        if (!user.is_active) {

            await supabaseClient.auth.signOut();

            alert("User tidak aktif.");

            window.location.href = "index.html";

            return;
        }


        // =========================================
        // SIMPAN PROFILE UNTUK UI
        // =========================================

        sessionStorage.setItem(
            "inventory_user",
            JSON.stringify(user)
        );


        // =========================================
        // TAMPILKAN USERNAME
        // =========================================

        document.getElementById(
            "currentUsername"
        ).textContent =
            user.username;


        // =========================================
        // TAMPILKAN ROLE
        // =========================================

        document.getElementById(
            "currentRole"
        ).textContent =
            user.role.toUpperCase();


        // =========================================
        // BUILD SIDEBAR
        // =========================================

        buildSidebar(user.role);


        // =========================================
        // LOGOUT
        // =========================================

        document.getElementById(
            "logoutButton"
        ).addEventListener(
            "click",
            logout
        );


        // =========================================
        // SIDEBAR MOBILE
        // =========================================

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


        // =========================================
        // LOAD DEFAULT PAGE
        // =========================================

        loadPage("dashboard");

    }
);

console.log("PROFILE USER:", user);
console.log("ROLE:", user.role);
console.log("ROLE TYPE:", typeof user.role);
console.log("ALLOWED PAGES:", permissions[user.role]);

function buildSidebar(role) {

    const container =
        document.getElementById("sidebarMenu");

    if (!container) {
        console.error("sidebarMenu tidak ditemukan.");
        return;
    }

    container.innerHTML = "";

    // Pastikan role selalu lowercase
    role = String(role || "").trim().toLowerCase();

    console.log("Building sidebar for role:", role);

    const allowedPages =
        permissions[role] || [];

    console.log("Allowed pages:", allowedPages);

    menuConfig.forEach(function (menu) {

        // Section
        if (menu.section) {

            // Jangan tampilkan section kalau tidak ada
            // menu yang boleh ditampilkan di bawahnya.
            const section =
                document.createElement("div");

            section.className =
                "sidebar-section";

            section.textContent =
                menu.section;

            container.appendChild(section);

            return;
        }

        // Cek permission
        if (!allowedPages.includes(menu.id)) {
            return;
        }

        const link =
            document.createElement("a");

        link.href = "#";
        link.className = "sidebar-link";
        link.dataset.page = menu.id;

        link.innerHTML = `
            <i class="bi ${menu.icon}"></i>
            <span>${menu.title}</span>
        `;

        link.addEventListener("click", function (e) {

            e.preventDefault();

            loadPage(menu.id);

        });

        container.appendChild(link);

    });

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

async function checkAuth() {
    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "index.html";
        return null;
    }

    return session;
}
