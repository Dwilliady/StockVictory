let saleCustomerData = [];
let saleItemData = [];
let saleInventoryData = [];
let saleRowCounter = 0;

let savedSaleId = null;

let saleBarcodeScannerInitialized = false;

let saleCameraScanner = null;

let saleCameraProcessing = false;

let saleCameraDevices = [];

let saleCameraIndex = 0;

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


        document.getElementById("saleDate").value =
            new Date().toISOString().split("T")[0];


        addSaleRow();


        /*
           Setup USB + Camera scanner
           setelah halaman transaksi selesai dibuat.
        */

        setTimeout(
            function () {

                setupSaleBarcodeScanner();

            },
            100
        );


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
   BARCODE SCANNER
===================================================== */

function setupSaleBarcodeScanner() {

    /*
       Kalau scanner UI sudah ada,
       cukup pastikan input kembali fokus.
    */

    const existingScanner =
        document.getElementById("saleBarcodeScan");

    if (existingScanner) {

        existingScanner.focus();

        return;
    }

    const switchCameraButton =
        document.getElementById(
            "btnSwitchSaleCamera"
        );


    if (switchCameraButton) {

        switchCameraButton.addEventListener(
            "click",
            async function () {

                await switchSaleCamera();

            }
        );

    }


    /*
       Cari tbody transaksi
    */

    const tbody =
        document.getElementById("saleDetailBody");

    if (!tbody) {

        console.warn(
            "saleDetailBody tidak ditemukan."
        );

        return;
    }


    /*
       Cari table transaksi
    */

    const table =
        tbody.closest("table");

    if (!table) {

        console.warn(
            "Table transaksi tidak ditemukan."
        );

        return;
    }


    /*
       Wrapper utama
    */

    const scannerWrapper =
        document.createElement("div");

    scannerWrapper.className =
        "mb-3 px-3";


    scannerWrapper.innerHTML = `

        <!-- MODE SCANNER -->

        <div class="d-flex justify-content-between align-items-center mb-2">

            <label class="form-label mb-3 py-2 fw-semibold mb-0">

                <i class="bi bi-upc-scan me-1"></i>
                Scan Barang

            </label>

            <div
                class="btn-group"
                role="group"
                aria-label="Mode scanner">

                <input
                    type="radio"
                    class="btn-check"
                    name="saleScanMode"
                    id="saleScanModeUsb"
                    value="usb"
                    checked
                    autocomplete="off">

                <label
                    class="btn btn-outline-primary"
                    for="saleScanModeUsb">

                    <i class="bi bi-usb-drive me-1"></i>
                    Scanner USB

                </label>


                <input
                    type="radio"
                    class="btn-check"
                    name="saleScanMode"
                    id="saleScanModeCamera"
                    value="camera"
                    autocomplete="off">

                <label
                    class="btn btn-outline-primary"
                    for="saleScanModeCamera">

                    <i class="bi bi-camera me-1"></i>
                    Kamera

                </label>

            </div>

        </div>


        <!-- USB -->

        <div id="saleUsbScannerArea">

            <div class="input-group input-group-sm mb-1">

                <span class="input-group-text">

                    <i class="bi bi-qr-code-scan"></i>

                </span>


                <input
                    type="text"
                    class="form-control"
                    id="saleBarcodeScan"
                    placeholder="Scan barcode / QR..."
                    autocomplete="off"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false">


                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    id="btnClearSaleBarcode"
                    title="Kosongkan">

                    <i class="bi bi-x-lg"></i>

                </button>

            </div>


            <small class="text-muted">

                Gunakan scanner USB.
                Contoh: <strong>PLY-001</strong>

            </small>

        </div>


        <!-- CAMERA -->

        <div
            id="saleCameraScannerArea"
            class="d-none">

            <div
                id="saleCameraReader"
                 style="
                        width: 280px;
                        max-width: 100%;
                        margin: 0 auto;
                        border-radius: 10px;
                        overflow: hidden;
                    ">
            </div>

             <div class="text-center mt-2">

                <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    id="btnSwitchSaleCamera">

                    <i class="bi bi-camera-rotate me-1"></i>
                    Ganti Kamera

                </button>

            </div>


            <div
                id="saleCameraStatus"
                class="small text-muted mt-2">

                Kamera belum aktif.

            </div>

        </div>

    `;


    /*
       Masukkan sebelum table
    */

    table.parentNode.insertBefore(
        scannerWrapper,
        table
    );


    /*
       Element
    */

    const scannerInput =
        document.getElementById(
            "saleBarcodeScan"
        );

    const usbArea =
        document.getElementById(
            "saleUsbScannerArea"
        );

    const cameraArea =
        document.getElementById(
            "saleCameraScannerArea"
        );

    const usbMode =
        document.getElementById(
            "saleScanModeUsb"
        );

    const cameraMode =
        document.getElementById(
            "saleScanModeCamera"
        );

    const clearButton =
        document.getElementById(
            "btnClearSaleBarcode"
        );


    /*
       ==========================================
       USB SCANNER
       ==========================================
    */

    scannerInput.addEventListener(
        "keydown",
        async function (event) {

            if (event.key !== "Enter") {

                return;

            }


            event.preventDefault();


            const barcode =
                scannerInput.value
                    .trim();


            if (!barcode) {

                return;

            }


            await processSaleBarcode(
                barcode
            );


            playSaleScanBeep();
        }
    );


    /*
       Clear button
    */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                scannerInput.value = "";

                scannerInput.classList.remove(
                    "is-valid",
                    "is-invalid"
                );

                scannerInput.focus();

            }
        );

    }


    /*
       ==========================================
       MODE USB
       ==========================================
    */

    usbMode.addEventListener(
        "change",
        function () {

            if (!usbMode.checked) {

                return;

            }


            stopSaleCameraScanner();


            cameraArea.classList.add(
                "d-none"
            );

            usbArea.classList.remove(
                "d-none"
            );


            scannerInput.focus();

        }
    );


    /*
       ==========================================
       MODE CAMERA
       ==========================================
    */

    cameraMode.addEventListener(
        "change",
        async function () {

            if (!cameraMode.checked) {

                return;

            }


            usbArea.classList.add(
                "d-none"
            );

            cameraArea.classList.remove(
                "d-none"
            );


            await startSaleCameraScanner();

        }
    );


    /*
       Fokus awal USB
    */

    setTimeout(
        function () {

            const input =
                document.getElementById(
                    "saleBarcodeScan"
                );

            if (input) {

                input.focus();

            }

        },
        300
    );

}

/* =====================================================
   PROCESS BARCODE
===================================================== */

async function processSaleBarcode(
    barcode
) {

    const scannerInput =
        document.getElementById(
            "saleBarcodeScan"
        );


    const cleanBarcode =
        String(barcode || "")
            .trim()
            .toUpperCase();


    if (!cleanBarcode) {
        return;
    }


    console.log(
        "SCAN BARCODE:",
        cleanBarcode
    );


    /*
       Cari inventory berdasarkan:
       
       ITEM CODE + "-" + COLOR NO

       Contoh:
       POLY-091
    */

    const inventory =
        saleInventoryData.find(
            function (row) {

                if (
                    !row.items ||
                    !row.colors
                ) {

                    return false;

                }


                if (
                    row.colors.status !== true
                ) {

                    return false;

                }


                const itemCode =
                    String(
                        row.items.code || ""
                    )
                        .trim()
                        .toUpperCase();


                const colorNo =
                    String(
                        row.colors.color_no || ""
                    )
                        .trim()
                        .toUpperCase();


                const rowBarcode =
                    `${itemCode}-${colorNo}`;


                return (
                    rowBarcode ===
                    cleanBarcode
                );

            }
        );


    /*
       Barcode tidak ditemukan
    */

    if (!inventory) {

        alert(
            `Barcode "${cleanBarcode}" tidak ditemukan.`
        );


        scannerInput.value = "";


        scannerInput.focus();


        return;

    }


    const itemId =
        Number(
            inventory.item_id
        );


    const colorId =
        Number(
            inventory.color_id
        );


    /*
       Cari apakah Item + Warna
       sudah ada di grid
    */

    const existingRow =
        findSaleRow(
            itemId,
            colorId
        );


    /*
       Kalau sudah ada:
       Qty + 1
    */

    if (existingRow) {

        const rowId =
            existingRow.id.replace(
                "saleRow_",
                ""
            );


        const qtyInput =
            document.getElementById(
                `saleQty_${rowId}`
            );


        const currentQty =
            Number(
                qtyInput.value || 0
            );

        const stock = 
            Number(inventory.stock || 0);


        qtyInput.value =
            currentQty + 1;

        if (currentQty >= stock) {

            alert(
                `Qty ${inventory.items.code} - ${inventory.colors.color_no} tidak boleh lebih dari stock ${stock}.`
            );

            scannerInput.value = "";
            scannerInput.focus();

            return false;
        }

        calculateSaleRow(
            rowId
        );


        showSaleBarcodeFeedback(
            `${inventory.items.code} - ${inventory.colors.color_no} berhail ditambahkan. Qty sekarang: ${qtyInput.value}`
        );


        scannerInput.value = "";


        scannerInput.focus();


        return;

    }


    /*
       Cari row kosong yang pertama.
       
       Karena initSales() membuat
       satu row kosong.
    */

    let rowId =
        findEmptySaleRow();


    /*
       Kalau tidak ada row kosong,
       buat row baru.
    */

    if (!rowId) {

        addSaleRow();

        rowId =
            saleRowCounter;

    }


    /*
       Pilih ITEM
    */

    const itemSelect =
        document.getElementById(
            `saleItem_${rowId}`
        );


    itemSelect.value =
        String(itemId);


    /*
       Jalankan change item supaya:
       - warna di-load
       - harga di-load
    */

    await changeSaleItem(
        rowId
    );


    /*
       Setelah warna tersedia,
       pilih warna
    */

    const colorSelect =
        document.getElementById(
            `saleColor_${rowId}`
        );


    colorSelect.value =
        String(colorId);


    /*
       Jalankan change color supaya:
       - stock muncul
       - subtotal dihitung
    */

    changeSaleColor(
        rowId
    );


    /*
       Qty pertama = 1
    */

    const qtyInput =
        document.getElementById(
            `saleQty_${rowId}`
        );


    qtyInput.value =
        1;


    calculateSaleRow(
        rowId
    );


    showSaleBarcodeFeedback(
        `${inventory.items.code} - ${inventory.colors.color_no} ${inventory.colors.color_name} ditambahkan`
    );


    /*
       Bersihkan input scanner
    */

    scannerInput.value =
        "";


    scannerInput.focus();

}


/* =====================================================
   FIND SALE ROW
===================================================== */

function findSaleRow(
    itemId,
    colorId
) {

    const rows =
        document.querySelectorAll(
            "#saleDetailBody tr"
        );


    for (
        const row of rows
    ) {

        const rowId =
            row.id.replace(
                "saleRow_",
                ""
            );


        const rowItemElement =
            document.getElementById(
                `saleItem_${rowId}`
            );


        const rowColorElement =
            document.getElementById(
                `saleColor_${rowId}`
            );


        if (
            !rowItemElement ||
            !rowColorElement
        ) {

            continue;

        }


        const rowItemId =
            Number(
                rowItemElement.value || 0
            );


        const rowColorId =
            Number(
                rowColorElement.value || 0
            );


        if (
            rowItemId === Number(itemId) &&
            rowColorId === Number(colorId)
        ) {

            return row;

        }

    }


    return null;

}


/* =====================================================
   FIND EMPTY SALE ROW
===================================================== */

function findEmptySaleRow() {

    const rows =
        document.querySelectorAll(
            "#saleDetailBody tr"
        );


    for (
        const row of rows
    ) {

        const rowId =
            row.id.replace(
                "saleRow_",
                ""
            );


        const itemSelect =
            document.getElementById(
                `saleItem_${rowId}`
            );


        const colorSelect =
            document.getElementById(
                `saleColor_${rowId}`
            );


        if (
            itemSelect &&
            colorSelect &&
            !itemSelect.value &&
            !colorSelect.value
        ) {

            return rowId;

        }

    }


    return null;

}


/* =====================================================
   BARCODE FEEDBACK
===================================================== */

function showSaleBarcodeFeedback(
    message
) {

    const scannerInput =
        document.getElementById(
            "saleBarcodeScan"
        );


    if (!scannerInput) {
        return;
    }


    scannerInput.classList.remove(
        "is-invalid"
    );


    scannerInput.classList.add(
        "is-valid"
    );


    setTimeout(
        function () {

            scannerInput.classList.remove(
                "is-valid"
            );

        },
        800
    );

    showSaleScanSuccess(message);
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

        <td class="sale-qty-cell">
            <input
                type="number"
                class="form-control form-control-sm text-center sale-qty-input"
                id="saleQty_${rowId}"
                min="1"
                step="1"
                value="1"
                style="min-width: 65px;"
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

    console.log(
        "CHANGE ITEM START",
        rowId
    );


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


    priceElement.dataset.value =
        0;


    document.getElementById(
        `saleSubtotal_${rowId}`
    ).textContent =
        "Rp0";


    document.getElementById(
        `saleSubtotal_${rowId}`
    ).dataset.value =
        0;


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


    console.log(
        "GET PRICE DONE",
        rowId
    );


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


    calculateSaleRow(
        rowId
    );

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
                changeSaleItem(
                    rowId
                )
            );

        }

    }


    await Promise.all(
        promises
    );

}


/* =====================================================
   Validasi untuk Jenis Item yang sama dengan Warna yang sama gaboleh pisah rows
===================================================== */

function validateSaleDuplicateItems(
    details
) {

    const used =
        new Set();


    for (
        const detail of details
    ) {

        const key =
            `${detail.item_id}_${detail.color_id}`;


        if (
            used.has(key)
        ) {

            return false;

        }


        used.add(key);

    }


    return true;

}


/* =====================================================
   CALCULATE ROW
===================================================== */

function calculateSaleRow(
    rowId
) {

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

    const stockElement =
        Number(
            document.getElementById(
                `saleStock_${rowId}`
            ).dataset.value || 0
        );

    if (stockElement !== 0 && qty > stockElement) {  
        alert(
            'Qty melebihi dari Stock yang ada'
        );


        qty =
            stockElement;

        qtyInput.value =
            stockElement;
    }


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

function removeSaleRow(
    rowId
) {

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
        formatCurrency(
            total
        );

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

async function getSalePrice(
    itemId,
    saleDate
) {

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

        const customerId =
            document.getElementById(
                "saleCustomer"
            ).value;


        const saleDate =
            document.getElementById(
                "saleDate"
            ).value;


        const rows =
            document.querySelectorAll(
                "#saleDetailBody tr"
            );


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


        if (rows.length === 0) {

            alert(
                "Detail transaksi belum diisi."
            );

            return;

        }


        const details = [];


        for (
            const row of rows
        ) {

            const rowId =
                row.id.replace(
                    "saleRow_",
                    ""
                );


            const itemId =
                document.getElementById(
                    `saleItem_${rowId}`
                ).value;


            const colorId =
                document.getElementById(
                    `saleColor_${rowId}`
                ).value;


            const qty =
                Number(
                    document.getElementById(
                        `saleQty_${rowId}`
                    ).value || 0
                );


            if (!itemId) {

                alert(
                    "Item harus dipilih pada semua baris."
                );

                return;

            }


            if (!colorId) {

                alert(
                    "Warna harus dipilih pada semua baris."
                );

                return;

            }


            if (qty <= 0) {

                alert(
                    "Quantity harus lebih dari 0."
                );

                return;

            }


            details.push({

                item_id:
                    Number(itemId),

                color_id:
                    Number(colorId),

                qty:
                    qty

            });

        }


        // Cek duplicate Item + Warna

        if (
            !validateSaleDuplicateItems(
                details
            )
        ) {

            alert(
                "Item dan warna yang sama tidak boleh dimasukkan lebih dari satu kali."
            );

            return;

        }


        const saveButton =
            document.getElementById(
                "btnSaveSale"
            );


        if (saveButton) {

            saveButton.disabled =
                true;


            saveButton.innerHTML =
                '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

        }


        const result =
            await supabaseClient.rpc(
                "create_sale",
                {
                    p_customer_id:
                        customerId,

                    p_sale_date:
                        saleDate,

                    p_details:
                        details
                }
            );


        if (result.error) {

            throw result.error;

        }


        const saleData =
            result.data;


        showSaleSuccessModal(
            saleData
        );


    } catch (error) {

        console.error(
            "saveSale error:",
            error
        );


        alert(
            error.message ||
            "Terjadi kesalahan saat menyimpan transaksi."
        );


        const saveButton =
            document.getElementById(
                "btnSaveSale"
            );


        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.innerHTML =
                "Simpan Transaksi";

        }

    }

}


function showSaleSuccessModal(
    saleData
) {

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

function formatStock(
    value
) {

    return Number(
        value || 0
    )
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

function formatCurrency(
    value
) {

    return Number(
        value || 0
    )
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

async function startSaleCameraScanner() {

    const reader =
        document.getElementById(
            "saleCameraReader"
        );

    const status =
        document.getElementById(
            "saleCameraStatus"
        );


    if (!reader) {

        return;

    }


    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        if (status) {

            status.innerHTML =
                `<span class="text-danger">
                    Library kamera belum tersedia.
                 </span>`;

        }

        return;

    }


    try {

        /*
           Ambil semua kamera
        */

        saleCameraDevices =
            await Html5Qrcode.getCameras();


        if (
            !saleCameraDevices ||
            saleCameraDevices.length === 0
        ) {

            throw new Error(
                "Tidak ada kamera ditemukan."
            );

        }


        /*
           Coba cari kamera belakang
        */

        const backCameraIndex =
            saleCameraDevices.findIndex(
                camera =>
                    /back|rear|environment/i.test(
                        camera.label
                    )
            );


        if (backCameraIndex >= 0) {

            saleCameraIndex =
                backCameraIndex;

        } else {

            saleCameraIndex = 0;

        }


        /*
           Buat scanner
        */

        saleCameraScanner =
            new Html5Qrcode(
                "saleCameraReader"
            );


        await startSelectedSaleCamera();


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        if (status) {

            status.innerHTML =
                `<span class="text-danger">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    Kamera gagal dibuka.
                    Pastikan izin kamera diberikan.
                 </span>`;

        }


        saleCameraScanner = null;

    }

}

async function startSelectedSaleCamera() {
    const status = document.getElementById("saleCameraStatus");

    if (!saleCameraScanner) return;
    if (!saleCameraDevices || saleCameraDevices.length === 0) return;

    const camera = saleCameraDevices[saleCameraIndex];

    if (!camera) return;

    saleCameraProcessing = false;

    if (status) {
        status.innerHTML =
            `<span class="text-primary">
                <i class="bi bi-camera me-1"></i>
                Mengaktifkan kamera...
            </span>`;
    }

    try {
        await saleCameraScanner.start(
            camera.id,
            {
                fps: 10,
                qrbox: {
                    width: 200,
                    height: 200
                },
                aspectRatio: 1.0
            },

            async function (decodedText) {
                if (saleCameraProcessing) return;

                saleCameraProcessing = true;

                try {
                    const success =
                        await processSaleBarcode(decodedText);

                    if (success) {
                        playSaleScanBeep();

                        if (status) {
                            status.innerHTML =
                                `<span class="text-success">
                                    <i class="bi bi-check-circle me-1"></i>
                                    ${escapeHtml(decodedText)}
                                </span>`;
                        }
                    }

                } finally {
                    setTimeout(function () {
                        saleCameraProcessing = false;
                    }, 700);
                }
            },

            function () {
                // ignore scan failure
            }
        );

        if (status) {
            status.innerHTML =
                `<span class="text-success">
                    <i class="bi bi-camera-fill me-1"></i>
                    ${escapeHtml(camera.label || "Kamera aktif")}
                </span>`;
        }

    } catch (error) {
        console.error("Start selected camera error:", error);

        if (status) {
            status.innerHTML =
                `<span class="text-danger">
                    Gagal membuka kamera.
                </span>`;
        }
    }
}

async function switchSaleCamera() {
    if (!saleCameraDevices || saleCameraDevices.length < 2) {
        alert("Perangkat hanya memiliki satu kamera.");
        return;
    }

    saleCameraIndex++;

    if (saleCameraIndex >= saleCameraDevices.length) {
        saleCameraIndex = 0;
    }

    const reader = document.getElementById("saleCameraReader");
    const status = document.getElementById("saleCameraStatus");

    if (!reader) return;

    try {
        // Stop kamera lama
        if (saleCameraScanner) {
            try {
                await saleCameraScanner.stop();
            } catch (error) {
                console.warn("Camera stop error:", error);
            }

            try {
                saleCameraScanner.clear();
            } catch (error) {
                console.warn("Camera clear error:", error);
            }

            saleCameraScanner = null;
        }

        saleCameraProcessing = false;

        // Bersihkan container
        reader.innerHTML = "";

        if (status) {
            status.innerHTML =
                `<span class="text-primary">
                    <i class="bi bi-camera-rotate me-1"></i>
                    Mengganti kamera...
                </span>`;
        }

        // Buat instance baru
        saleCameraScanner =
            new Html5Qrcode("saleCameraReader");

        await startSelectedSaleCamera();

    } catch (error) {
        console.error("Switch camera error:", error);

        if (status) {
            status.innerHTML =
                `<span class="text-danger">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    Gagal mengganti kamera.
                </span>`;
        }
    }
}

async function stopSaleCameraScanner() {

    if (!saleCameraScanner) {

        return;

    }


    try {

        await saleCameraScanner.stop();

    } catch (error) {

        console.warn(
            "Camera stop error:",
            error
        );

    }


    try {

        saleCameraScanner.clear();

    } catch (error) {

        console.warn(
            "Camera clear error:",
            error
        );

    }


    saleCameraScanner = null;

    saleCameraProcessing = false;


    const status =
        document.getElementById(
            "saleCameraStatus"
        );


    if (status) {

        status.innerHTML =
            "Kamera belum aktif.";

    }

}

function playSaleScanBeep() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {

            return;

        }


        const audioContext =
            new AudioContext();


        const oscillator =
            audioContext.createOscillator();


        const gainNode =
            audioContext.createGain();


        oscillator.type = "sine";

        oscillator.frequency.value =
            1000;


        gainNode.gain.setValueAtTime(
            0.15,
            audioContext.currentTime
        );

        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.12
        );


        oscillator.connect(
            gainNode
        );

        gainNode.connect(
            audioContext.destination
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.12
        );


    } catch (error) {

        console.warn(
            "Scan beep error:",
            error
        );

    }

}

function showSaleScanSuccess(message) {
    let toast = document.getElementById("saleScanSuccessToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "saleScanSuccessToast";

        toast.style.position = "fixed";
        toast.style.top = "20px";
        toast.style.right = "20px";
        toast.style.zIndex = "99999";
        toast.style.minWidth = "280px";

        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="alert alert-success shadow-lg mb-0 d-flex align-items-center">
            <i class="bi bi-check-circle-fill fs-4 me-2"></i>
            <div>
                <div class="fw-bold">Scan berhasil</div>
                <div class="small">${escapeHtml(message)}</div>
            </div>
        </div>
    `;

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        toast.remove();
    }, 1200);
}