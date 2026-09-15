const inventoryData = [

    {
        item: "Polyester",
        colorNo: "001",
        colorName: "Merah",
        stock: 120
    },

    {
        item: "Polyester",
        colorNo: "002",
        colorName: "Biru",
        stock: 80
    },

    {
        item: "Polyester",
        colorNo: "003",
        colorName: "Hitam",
        stock: 50
    },

    {
        item: "Nylon",
        colorNo: "001",
        colorName: "Putih",
        stock: 150
    },

    {
        item: "Nylon",
        colorNo: "005",
        colorName: "Navy",
        stock: 60
    },

    {
        item: "Nylon",
        colorNo: "007",
        colorName: "Grey",
        stock: 90
    }

];


function initInventory() {

    renderInventoryGrid(
        "Polyester",
        "polyesterStockGrid",
        "polyesterTotalStock"
    );

    renderInventoryGrid(
        "Nylon",
        "nylonStockGrid",
        "nylonTotalStock"
    );

}


function renderInventoryGrid(
    itemName,
    gridId,
    totalId
) {

    const data =
        inventoryData.filter(
            x => x.item === itemName
        );


    const grid =
        document.getElementById(gridId);


    const totalElement =
        document.getElementById(totalId);


    let totalStock = 0;


    grid.innerHTML = data.map(item => {

        totalStock += item.stock;


        const isLowStock =
            item.stock <= 20;


        return `
            <tr>

                <td class="ps-3 fw-semibold">
                    ${item.colorNo}
                </td>

                <td>
                    ${item.colorName}
                </td>

                <td class="text-end fw-semibold">
                    ${item.stock.toLocaleString("id-ID")}
                </td>

                <td class="text-center">

                    ${
                        isLowStock

                        ? `<span class="badge bg-danger">
                            Low Stock
                          </span>`

                        : `<span class="badge bg-success">
                            Available
                          </span>`
                    }

                </td>

            </tr>
        `;

    }).join("");


    totalElement.textContent =
        totalStock.toLocaleString("id-ID");

}


/* =========================
   TAMBAH STOCK
========================= */

function openAddStockModal() {

    document.getElementById(
        "stockItem"
    ).value = "";


    document.getElementById(
        "stockColor"
    ).innerHTML = `
        <option value="">
            -- Pilih Warna --
        </option>
    `;


    document.getElementById(
        "stockQty"
    ).value = "";


    document.getElementById(
        "stockNotes"
    ).value = "";


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "addStockModal"
            )
        );


    modal.show();

}


/* =========================
   LOAD WARNA
========================= */

function loadStockColors() {

    const item =
        document.getElementById(
            "stockItem"
        ).value;


    const colorSelect =
        document.getElementById(
            "stockColor"
        );


    colorSelect.innerHTML = `
        <option value="">
            -- Pilih Warna --
        </option>
    `;


    if (!item) {
        return;
    }


    const colors =
        inventoryData.filter(
            x => x.item === item
        );


    colors.forEach(color => {

        colorSelect.innerHTML += `
            <option value="${color.colorNo}">
                ${color.colorNo} - ${color.colorName}
            </option>
        `;

    });

}


/* =========================
   SAVE
========================= */

function saveAddStock() {

    const item =
        document.getElementById(
            "stockItem"
        ).value;


    const colorNo =
        document.getElementById(
            "stockColor"
        ).value;


    const qty =
        Number(
            document.getElementById(
                "stockQty"
            ).value
        );


    if (!item) {

        alert("Silakan pilih Item.");

        return;

    }


    if (!colorNo) {

        alert("Silakan pilih Warna.");

        return;

    }


    if (!qty || qty <= 0) {

        alert(
            "Jumlah stock harus lebih dari 0."
        );

        return;

    }


    /*
       NANTI BACKEND:

       API.post("addStock", {
           item: item,
           colorNo: colorNo,
           qty: qty,
           notes: ...
       });
    */


    alert(
        `Stock ${item} ${colorNo} berhasil ditambahkan sebanyak ${qty}.`
    );


    const modal =
        bootstrap.Modal.getInstance(
            document.getElementById(
                "addStockModal"
            )
        );


    modal.hide();

}