let colorData = [];
let colorItemData = [];
let colorItemsLoaded = false;


// =====================================================
// INITIALIZE
// =====================================================

async function initColors() {

    await Promise.all([
        loadColors(),
        loadColorItems()
    ]);

}


// =====================================================
// LOAD COLORS
// =====================================================

async function loadColors() {

    const { data, error } =
        await supabaseClient
            .from("colors")
            .select(`
                id,
                item_id,
                color_no,
                color_name,
                status,
                created_at,
                updated_at,
                items (
                    id,
                    code,
                    name,
                    status
                )
            `)
            .eq("items.status", true)
            .order("item_id")
            .order("color_no");


    if (error) {

        console.error(
            "Error load colors:",
            error
        );

        alert(
            "Gagal mengambil data warna."
        );

        return;
    }


    colorData = data || [];

    renderColors(colorData);

}


// =====================================================
// LOAD ITEM
// =====================================================

async function loadColorItems(
    forceReload = false
) {

    if (
        colorItemsLoaded &&
        !forceReload
    ) {

        fillColorItemDropdown();

        return true;
    }


    const { data, error } =
        await supabaseClient
            .from("items")
            .select(`
                id,
                code,
                name,
                status
            `)
            .eq("status", true)
            .order("id");


    if (error) {

        console.error(
            "Error load items:",
            error
        );

        alert(
            "Gagal mengambil data Item."
        );

        return false;
    }


    colorItemData = data || [];

    colorItemsLoaded = true;


    fillColorItemDropdown();

    return true;
}


// =====================================================
// FILL ITEM DROPDOWN
// =====================================================

function fillColorItemDropdown() {

    const select =
        document.getElementById(
            "colorItem"
        );

    if (!select) return;


    select.innerHTML = `
        <option value="">
            -- Pilih Item --
        </option>
    `;


    colorItemData.forEach(
        function (item) {

            select.innerHTML += `
                <option value="${item.id}">
                    ${escapeHtml(item.name)}
                    (${escapeHtml(item.code)})
                </option>
            `;

        }
    );

}


// =====================================================
// RENDER ALL COLOR GRIDS
// =====================================================

function renderColors(data) {

    const container =
        document.getElementById(
            "colorGrid"
        );

    if (!container) return;


    container.innerHTML = "";


    // =============================================
    // BELUM ADA ITEM
    // =============================================

    if (!colorItemData.length) {

        container.innerHTML = `
            <div class="col-12">

                <div class="alert alert-info mb-0">

                    <i class="bi bi-info-circle me-2"></i>

                    Belum ada Item aktif.
                    Silakan tambahkan Item terlebih dahulu
                    di Master Item.

                </div>

            </div>
        `;

        return;
    }


    // =============================================
    // BUAT CARD SETIAP ITEM
    // =============================================

    colorItemData.forEach(
        function (item) {

            const itemColors =
                data.filter(
                    function (color) {

                        return (
                            Number(color.item_id) ===
                            Number(item.id)
                        );

                    }
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "col-12 col-xl-6";


            card.innerHTML = `

                <div class="card dashboard-card h-100">

                    <div class="card-header bg-white py-3">

                        <h5 class="fw-bold mb-0">

                            <i class="bi bi-palette me-2"></i>

                            ${escapeHtml(item.name)}

                        </h5>

                        <small class="text-muted">

                            Daftar warna
                            ${escapeHtml(item.name)}

                            (${escapeHtml(item.code)})

                        </small>

                    </div>


                    <div class="card-body p-0">

                        <div class="table-responsive">

                            <table
                                class="table table-hover align-middle mb-0"
                            >

                                <thead class="table-light">

                                    <tr>

                                        <th class="ps-3">
                                            No. Warna
                                        </th>

                                        <th>
                                            Nama Warna
                                        </th>

                                        <th class="text-center">
                                            Status
                                        </th>

                                        <th class="text-center">
                                            Aksi
                                        </th>

                                    </tr>

                                </thead>


                                <tbody
                                    id="colorRows_${item.id}"
                                >
                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            `;


            container.appendChild(card);


            const tbody =
                document.getElementById(
                    `colorRows_${item.id}`
                );


            renderColorRows(
                tbody,
                itemColors
            );

        }
    );

}


// =====================================================
// RENDER COLOR ROWS
// =====================================================

function renderColorRows(
    tbody,
    data
) {

    if (!tbody) return;


    // =============================================
    // BELUM ADA WARNA
    // =============================================

    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-muted py-4"
                >

                    <i class="bi bi-palette me-1"></i>

                    Belum ada warna

                </td>

            </tr>

        `;

        return;
    }


    // =============================================
    // RENDER DATA
    // =============================================

    tbody.innerHTML =
        data.map(
            function (color) {

                const statusBadge =
                    color.status

                        ? `
                            <span class="badge bg-success">
                                Aktif
                            </span>
                          `

                        : `
                            <span class="badge bg-secondary">
                                Tidak Aktif
                            </span>
                          `;


                const toggleButton =
                    color.status

                        ? `
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-danger"
                                onclick="toggleColorStatus(
                                    ${color.id},
                                    false
                                )"
                                title="Nonaktifkan"
                            >

                                <i class="bi bi-x-circle"></i>

                            </button>
                          `

                        : `
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-success"
                                onclick="toggleColorStatus(
                                    ${color.id},
                                    true
                                )"
                                title="Aktifkan"
                            >

                                <i class="bi bi-check-circle"></i>

                            </button>
                          `;


                return `

                    <tr>

                        <td class="ps-3">

                            ${escapeHtml(
                                color.color_no
                            )}

                        </td>


                        <td>

                            ${escapeHtml(
                                color.color_name
                            )}

                        </td>


                        <td class="text-center">

                            ${statusBadge}

                        </td>


                        <td class="text-center">


                            <!-- PRINT 12 LABEL -->

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-dark me-1"
                                onclick="printColorLabels(
                                    ${color.id}
                                )"
                                title="Print 12 Label"
                            >

                                <i class="bi bi-printer"></i>

                            </button>


                            <!-- EDIT -->

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary me-1"
                                onclick="editColor(
                                    ${color.id}
                                )"
                                title="Edit"
                            >

                                <i class="bi bi-pencil"></i>

                            </button>


                            ${toggleButton}

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


// =====================================================
// PRINT 12 COLOR LABEL
// TJ LABEL 103
// =====================================================

function printColorLabels(id) {

    const color =
        colorData.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );


    if (!color) {

        alert(
            "Data warna tidak ditemukan."
        );

        return;
    }


    const item =
        color.items;


    if (!item) {

        alert(
            "Data Item tidak ditemukan."
        );

        return;
    }


    // =============================================
    // DATA
    // =============================================

    const itemName =
        item.name || "";


    const itemCode =
        item.code || "";


    const colorNo =
        color.color_no || "";


    const colorName =
        color.color_name || "";


    // =============================================
    // VALUE QR
    // =============================================

    const qrValue =
        `${itemCode}-${colorNo}`;


    // =============================================
    // TEMPORARY QR CONTAINER
    // =============================================

    const qrContainer =
        document.createElement(
            "div"
        );


    qrContainer.style.position =
        "absolute";


    qrContainer.style.left =
        "-99999px";


    qrContainer.style.top =
        "-99999px";


    document.body.appendChild(
        qrContainer
    );


    // =============================================
    // GENERATE QR
    // =============================================

    new QRCode(
        qrContainer,
        {

            text:
                qrValue,

            width:
                300,

            height:
                300,

            correctLevel:
                QRCode.CorrectLevel.H

        }
    );


    // =============================================
    // WAIT QR
    // =============================================

    setTimeout(
        function () {

            const canvas =
                qrContainer.querySelector(
                    "canvas"
                );


            if (!canvas) {

                alert(
                    "Gagal membuat QR Code."
                );


                qrContainer.remove();

                return;
            }


            const qrImage =
                canvas.toDataURL(
                    "image/png"
                );


            qrContainer.remove();


            // =========================================
            // OPEN PRINT WINDOW
            // =========================================

            const printWindow =
                window.open(
                    "",
                    "_blank"
                );


            if (!printWindow) {

                alert(
                    "Popup diblokir browser. Silakan izinkan popup untuk website ini."
                );

                return;
            }


            // =========================================
            // GENERATE 12 LABEL
            // =========================================

            let labels = "";


            for (
                let i = 0;
                i < 12;
                i++
            ) {

                labels += `

                    <div class="label">

                        <!-- QR KIRI -->

                        <div class="qr-area">

                            <img
                                src="${qrImage}"
                                class="qr"
                            >

                        </div>


                        <!-- INFORMASI KANAN -->

                        <div class="info">

                            <img
                                src="images/logo.png"
                                class="logo"
                                onerror="
                                    this.style.display='none';
                                "
                            >


                            <div class="item-name">

                                ${escapeHtml(
                                    itemName
                                )}

                            </div>


                            <div class="color-no">

                                ${escapeHtml(
                                    colorNo
                                )}

                            </div>


                            <div class="color-name">

                                ${escapeHtml(
                                    colorName
                                )}

                            </div>

                        </div>

                    </div>

                `;

            }


            // =========================================
            // PRINT DOCUMENT
            // =========================================

            printWindow.document.write(`

                <!DOCTYPE html>

                <html lang="id">

                <head>

                    <meta charset="UTF-8">

                    <title>
                        Label ${escapeHtml(
                            colorNo
                        )}
                    </title>


                    <style>

                        @page {

                            size: A4 portrait;

                            margin: 0;

                        }


                        * {

                            box-sizing: border-box;

                        }


                        html,
                        body {

                            margin: 0;

                            padding: 0;

                            width: 210mm;

                            height: 297mm;

                        }


                        body {

                            font-family:
                                Arial,
                                Helvetica,
                                sans-serif;

                        }


                        /* ================================= */

                        /* SHEET A4                         */

                        /* ================================= */

                        .sheet {

                            width: 210mm;

                            height: 297mm;

                            display: grid;

                            grid-template-columns:
                                64mm 64mm 64mm;

                            grid-template-rows:
                                32mm 32mm 32mm 32mm;

                            column-gap:
                                2mm;

                            row-gap:
                                2mm;

                            /*
                             * Posisi awal TJ Label 103.
                             * Nanti bisa dikalibrasi
                             * berdasarkan hasil printer.
                             */

                            padding-top:
                                25mm;

                            padding-left:
                                8mm;

                        }


                        /* ================================= */

                        /* LABEL                            */

                        /* ================================= */

                        .label {

                            width:
                                64mm;

                            height:
                                32mm;

                            display:
                                flex;

                            flex-direction:
                                row;

                            align-items:
                                center;

                            overflow:
                                hidden;

                            padding:
                                2mm;

                        }


                        /* ================================= */

                        /* QR KIRI                          */

                        /* ================================= */

                        .qr-area {

                            width:
                                27mm;

                            height:
                                27mm;

                            flex-shrink:
                                0;

                            display:
                                flex;

                            justify-content:
                                center;

                            align-items:
                                center;

                        }


                        .qr {

                            width:
                                25mm;

                            height:
                                25mm;

                            object-fit:
                                contain;

                        }


                        /* ================================= */

                        /* BAGIAN KANAN                     */

                        /* ================================= */

                        .info {

                            height:
                                27mm;

                            flex:
                                1;

                            min-width:
                                0;

                            display:
                                flex;

                            flex-direction:
                                column;

                            align-items:
                                center;

                            justify-content:
                                center;

                            text-align:
                                center;

                            padding-left:
                                1mm;

                        }


                        /* ================================= */

                        /* LOGO                             */

                        /* ================================= */

                        .logo {

                            width:
                                17mm;

                            max-height:
                                6mm;

                            object-fit:
                                contain;

                            margin-bottom:
                                0.8mm;

                        }


                        /* ================================= */

                        /* ITEM NAME                        */

                        /* ================================= */

                        .item-name {

                            font-size:
                                8px;

                            font-weight:
                                bold;

                            line-height:
                                1.05;

                            white-space:
                                pre-line;

                            word-break:
                                break-word;

                        }


                        /* ================================= */

                        /* COLOR NO                         */

                        /* ================================= */

                        .color-no {

                            font-size:
                                12px;

                            font-weight:
                                bold;

                            line-height:
                                1.1;

                            margin-top:
                                1mm;

                        }


                        /* ================================= */

                        /* COLOR NAME                       */

                        /* ================================= */

                        .color-name {

                            font-size:
                                8px;

                            line-height:
                                1.05;

                            max-width:
                                30mm;

                            overflow:
                                hidden;

                            text-overflow:
                                ellipsis;

                            white-space:
                                nowrap;

                        }

                    </style>

                </head>


                <body>


                    <div class="sheet">

                        ${labels}

                    </div>


                    <script>

                        window.onload =
                            function() {

                                setTimeout(
                                    function() {

                                        window.print();

                                    },
                                    500
                                );

                            };

                    <\/script>


                </body>

                </html>

            `);


            printWindow.document.close();

        },

        300
    );

}


// =====================================================
// OPEN ADD COLOR MODAL
// =====================================================

function openColorModal() {

    const colorId =
        document.getElementById(
            "colorId"
        );

    const colorItem =
        document.getElementById(
            "colorItem"
        );

    const colorNo =
        document.getElementById(
            "colorNo"
        );

    const colorName =
        document.getElementById(
            "colorName"
        );

    const colorStatus =
        document.getElementById(
            "colorStatus"
        );

    const modalTitle =
        document.getElementById(
            "colorModalTitle"
        );


    if (
        !colorId ||
        !colorItem ||
        !colorNo ||
        !colorName ||
        !colorStatus ||
        !modalTitle
    ) {

        console.error(
            "Element modal warna tidak ditemukan."
        );

        return;
    }


    // RESET FORM

    colorId.value = "";

    colorNo.value = "";

    colorName.value = "";

    colorStatus.value = "true";


    modalTitle.textContent =
        "Tambah Warna";


    // LOAD DROPDOWN DARI CACHE

    fillColorItemDropdown();


    // TAMPILKAN MODAL

    const modalElement =
        document.getElementById(
            "colorModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


// =====================================================
// EDIT COLOR
// =====================================================

function editColor(id) {

    const color =
        colorData.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );


    if (!color) {

        alert(
            "Data warna tidak ditemukan."
        );

        return;
    }


    const colorId =
        document.getElementById(
            "colorId"
        );

    const colorItem =
        document.getElementById(
            "colorItem"
        );

    const colorNo =
        document.getElementById(
            "colorNo"
        );

    const colorName =
        document.getElementById(
            "colorName"
        );

    const colorStatus =
        document.getElementById(
            "colorStatus"
        );

    const modalTitle =
        document.getElementById(
            "colorModalTitle"
        );


    if (
        !colorId ||
        !colorItem ||
        !colorNo ||
        !colorName ||
        !colorStatus ||
        !modalTitle
    ) {

        console.error(
            "Element modal warna tidak ditemukan."
        );

        return;
    }


    // =============================================
    // SET MODAL TITLE
    // =============================================

    modalTitle.textContent =
        "Edit Warna";


    // =============================================
    // FILL DROPDOWN
    // =============================================

    fillColorItemDropdown();


    // =============================================
    // FILL FORM
    // =============================================

    colorId.value =
        color.id;

    colorItem.value =
        String(color.item_id);

    colorNo.value =
        color.color_no;

    colorName.value =
        color.color_name;

    colorStatus.value =
        String(color.status);


    // =============================================
    // SHOW MODAL
    // =============================================

    const modalElement =
        document.getElementById(
            "colorModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


// =====================================================
// SAVE COLOR
// =====================================================

async function saveColor() {

    const id =
        document.getElementById(
            "colorId"
        ).value.trim();


    const itemId =
        document.getElementById(
            "colorItem"
        ).value;


    const colorNo =
        document.getElementById(
            "colorNo"
        ).value.trim();


    const colorName =
        document.getElementById(
            "colorName"
        ).value.trim();


    const status =
        document.getElementById(
            "colorStatus"
        ).value === "true";


    // =============================================
    // VALIDATION
    // =============================================

    if (!itemId) {

        alert(
            "Silakan pilih Item."
        );

        return;
    }


    if (!colorNo) {

        alert(
            "No. Warna wajib diisi."
        );

        return;
    }


    if (!colorName) {

        alert(
            "Nama Warna wajib diisi."
        );

        return;
    }


    // =============================================
    // DATA
    // =============================================

    const payload = {

        item_id:
            Number(itemId),

        color_no:
            colorNo,

        color_name:
            colorName,

        status:
            status

    };


    let error;


    // =============================================
    // UPDATE
    // =============================================

    if (id) {

        const result =
            await supabaseClient
                .from("colors")
                .update(payload)
                .eq(
                    "id",
                    Number(id)
                );


        error =
            result.error;

    }


    // =============================================
    // INSERT
    // =============================================

    else {

        const result =
            await supabaseClient
                .from("colors")
                .insert(
                    payload
                );


        error =
            result.error;

    }


    // =============================================
    // ERROR
    // =============================================

    if (error) {

        console.error(
            "Error save color:",
            error
        );


        if (
            error.code ===
            "23505"
        ) {

            alert(
                "No. Warna tersebut sudah digunakan pada Item yang dipilih."
            );

        } else {

            alert(
                "Gagal menyimpan data warna."
            );

        }

        return;
    }


    // =============================================
    // SUCCESS
    // =============================================

    alert(
        id
            ? "Data warna berhasil diperbarui."
            : "Data warna berhasil ditambahkan."
    );


    // Tutup modal

    const modalElement =
        document.getElementById(
            "colorModal"
        );


    const modal =
        bootstrap.Modal.getInstance(
            modalElement
        );


    if (modal) {

        modal.hide();

    }


    // =============================================
    // RELOAD KE MASTER WARNA
    // =============================================

    window.location.href =
        "app.html?page=colors";

}


// =====================================================
// TOGGLE COLOR STATUS
// =====================================================

async function toggleColorStatus(
    id,
    newStatus
) {

    const message =
        newStatus
            ? "Aktifkan warna ini?"
            : "Nonaktifkan warna ini?";


    if (!confirm(message)) {

        return;
    }


    const { error } =
        await supabaseClient
            .from("colors")
            .update({
                status:
                    newStatus
            })
            .eq(
                "id",
                Number(id)
            );


    if (error) {

        console.error(
            "Error toggle color:",
            error
        );

        alert(
            "Gagal mengubah status warna."
        );

        return;
    }


    // =============================================
    // RELOAD KE MASTER WARNA
    // =============================================

    window.location.href =
        "app.html?page=colors";

}


// =====================================================
// FILTER COLORS
// =====================================================

function filterColors() {

    const input =
        document.getElementById(
            "colorSearch"
        );


    if (!input) return;


    const keyword =
        input.value
            .toLowerCase()
            .trim();


    // =============================================
    // TANPA SEARCH
    // =============================================

    if (!keyword) {

        renderColors(
            colorData
        );

        return;
    }


    // =============================================
    // FILTER
    // =============================================

    const filtered =
        colorData.filter(
            function (color) {

                const itemName =
                    color.items?.name ||
                    "";


                const itemCode =
                    color.items?.code ||
                    "";


                const colorNo =
                    color.color_no ||
                    "";


                const colorName =
                    color.color_name ||
                    "";


                return (

                    itemName
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    itemCode
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    colorNo
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    colorName
                        .toLowerCase()
                        .includes(keyword)

                );

            }
        );


    renderColors(
        filtered
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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