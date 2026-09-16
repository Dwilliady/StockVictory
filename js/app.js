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


let currentPage = null;


// =========================================
// DEFAULT PAGE BERDASARKAN ROLE
// =========================================

function getDefaultPage(role) {

    role = String(role || "")
        .trim()
        .toLowerCase();

    if (role === "admin") {
        return "dashboard";
    }

    if (role === "kasir") {
        return "inventory";
    }

    return null;
}


// =========================================
// INIT APPLICATION
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // =========================================
        // CEK SESSION
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
        // NORMALISASI ROLE
        // =========================================

        user.role = String(user.role || "")
            .trim()
            .toLowerCase();


        // =========================================
        // CEK ROLE VALID
        // =========================================

        if (!permissions[user.role]) {

            console.error(
                "Role tidak valid:",
                user.role
            );

            await supabaseClient.auth.signOut();

            alert("Role user tidak valid.");

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
        // SIMPAN PROFILE
        // =========================================

        sessionStorage.setItem(
            "inventory_user",
            JSON.stringify(user)
        );


        // =========================================
        // TAMPILKAN USERNAME
        // =========================================

        const usernameElement =
            document.getElementById("currentUsername");

        if (usernameElement) {

            usernameElement.textContent =
                user.username;

        }


        // =========================================
        // TAMPILKAN ROLE
        // =========================================

        const roleElement =
            document.getElementById("currentRole");

        if (roleElement) {

            roleElement.textContent =
                user.role.toUpperCase();

        }


        // =========================================
        // BUILD SIDEBAR
        // =========================================

        buildSidebar(user.role);


        // =========================================
        // LOGOUT
        // =========================================

        const logoutButton =
            document.getElementById("logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }


        // =========================================
        // SIDEBAR TOGGLE
        // =========================================

        initSidebarToggle();


        // =========================================
        // LOAD PAGE
        // =========================================

        const params =
            new URLSearchParams(
                window.location.search
            );

        const requestedPage =
            params.get("page");


        // Kalau URL tidak punya ?page=
        // gunakan default berdasarkan role
        if (!requestedPage) {

            loadPage(
                getDefaultPage(user.role)
            );

            return;
        }


        // Kalau URL punya page,
        // loadPage akan cek permission
        loadPage(requestedPage);

    }
);


// =========================================
// SIDEBAR TOGGLE
// =========================================

function initSidebarToggle() {

    const sidebar =
        document.getElementById("sidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");


    if (!sidebar || !sidebarToggle) {
        return;
    }


    sidebarToggle.addEventListener(
        "click",
        function () {

            if (window.innerWidth <= 991.98) {

                sidebar.classList.toggle("show");

            } else {

                sidebar.classList.toggle("collapsed");

            }

        }
    );

}


// =========================================
// BUILD SIDEBAR
// =========================================

function buildSidebar(role) {

    const container =
        document.getElementById("sidebarMenu");


    if (!container) {

        console.error(
            "sidebarMenu tidak ditemukan."
        );

        return;
    }


    container.innerHTML = "";


    role = String(role || "")
        .trim()
        .toLowerCase();


    const allowedPages =
        permissions[role] || [];


    let currentSection = null;


    menuConfig.forEach(function (menu) {

        // =====================================
        // SECTION
        // =====================================

        if (menu.section) {

            currentSection = menu;

            return;
        }


        // =====================================
        // CEK PERMISSION
        // =====================================

        if (!allowedPages.includes(menu.id)) {
            return;
        }


        // =====================================
        // BUAT MENU
        // =====================================

        if (
            currentSection &&
            !currentSection.rendered
        ) {

            const section =
                document.createElement("div");

            section.className =
                "sidebar-section";

            section.textContent =
                currentSection.section;

            container.appendChild(section);

            currentSection.rendered = true;
        }


        const link =
            document.createElement("a");

        link.href =
            `app.html?page=${menu.id}`;

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
            function (e) {

                e.preventDefault();

                loadPage(menu.id);


                // Tutup sidebar di mobile
                if (window.innerWidth <= 991.98) {

                    const sidebar =
                        document.getElementById("sidebar");

                    if (sidebar) {

                        sidebar.classList.remove("show");

                    }

                }

            }
        );


        container.appendChild(link);

    });


    // Reset flag section
    menuConfig.forEach(function (menu) {

        if (menu.section) {
            menu.rendered = false;
        }

    });

}


// =========================================
// LOAD PAGE
// =========================================

function loadPage(page) {

    const user =
        JSON.parse(
            sessionStorage.getItem(
                "inventory_user"
            )
        );


    // =========================================
    // USER TIDAK ADA
    // =========================================

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    const role =
        String(user.role || "")
            .trim()
            .toLowerCase();


    const allowedPages =
        permissions[role] || [];


    // =========================================
    // CEK PAGE
    // =========================================

    if (
        !page ||
        !allowedPages.includes(page)
    ) {

        page =
            getDefaultPage(role);

    }


    // Kalau tetap tidak ada page
    if (!page) {

        console.error(
            "Tidak ada default page untuk role:",
            role
        );

        return;
    }


    currentPage = page;


    // =========================================
    // UPDATE URL
    // =========================================

    const currentUrl =
        `app.html?page=${page}`;


    if (
        window.location.href !==
        new URL(currentUrl, window.location.href).href
    ) {

        window.history.pushState(
            {
                page: page
            },
            "",
            currentUrl
        );

    }


    // =========================================
    // LOAD HTML
    // =========================================

    fetch(
        `pages/${page}.html`
    )

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Page tidak ditemukan"
                );

            }

            return response.text();

        })


        .then(function (html) {

            const pageContent =
                document.getElementById(
                    "pageContent"
                );


            if (!pageContent) {
                return;
            }


            pageContent.innerHTML =
                html;


            updateActiveMenu(page);


            initializePage(page);

        })


        .catch(function (error) {

            console.error(
                "Load page error:",
                error
            );


            const pageContent =
                document.getElementById(
                    "pageContent"
                );


            if (pageContent) {

                pageContent.innerHTML = `
                    <div class="alert alert-danger">
                        Gagal membuka halaman.
                        <br>
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                `;

            }

        });

}


// =========================================
// ACTIVE MENU
// =========================================

function updateActiveMenu(page) {

    document
        .querySelectorAll(".sidebar-link")
        .forEach(function (link) {

            link.classList.toggle(
                "active",
                link.dataset.page === page
            );

        });

}


// =========================================
// INITIALIZE PAGE
// =========================================

function initializePage(page) {

    switch (page) {

        case "dashboard":

            if (
                typeof initDashboard ===
                "function"
            ) {

                initDashboard();

            }

            break;


        case "inventory":

            if (
                typeof initInventory ===
                "function"
            ) {

                initInventory();

            }

            break;


        case "sales":

            if (
                typeof initSales ===
                "function"
            ) {

                initSales();

            }

            break;


        case "sales-history":

            if (
                typeof initSalesHistory ===
                "function"
            ) {

                initSalesHistory();

            }

            break;


        case "items":

            if (
                typeof initItems ===
                "function"
            ) {

                initItems();

            }

            break;


        case "colors":

            if (
                typeof initColors ===
                "function"
            ) {

                initColors();

            }

            break;


        case "prices":

            if (
                typeof initPrices ===
                "function"
            ) {

                initPrices();

            }

            break;


        case "customers":

            if (
                typeof initCustomers ===
                "function"
            ) {

                initCustomers();

            }

            break;


        case "reports":

            if (
                typeof initReports ===
                "function"
            ) {

                initReports();

            }

            break;

    }

}


// =========================================
// CHECK AUTH
// =========================================

async function checkAuth() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error || !session) {

        window.location.href =
            "index.html";

        return null;
    }


    return session;

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}