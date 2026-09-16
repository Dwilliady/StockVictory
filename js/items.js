let itemData = [];


/* =====================================================
   INITIALIZE
===================================================== */

async function initItems() {

    try {

        await loadItems();

    } catch (error) {

        console.error(
            "Load items error:",
            error
        );

        alert(
            "Gagal mengambil data Item: " +
            error.message
        );

    }

}


/* =====================================================
   LOAD ITEMS
===================================================== */

async function loadItems() {

    const {
        data,
        error
    } = await supabaseClient
        .from("items")
        .select(`
            id,
            code,
            name,
            status,
            created_at,
            updated_at
        `)
        .order("id");


    if (error) {
        throw error;
    }


    itemData = data || [];

    renderItems(itemData);

}


/* =====================================================
   RENDER ITEMS
===================================================== */

function renderItems(data) {

    const tbody =
        document.getElementById(
            "itemTableBody"
        );


    tbody.innerHTML = "";


    if (!data.length) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="5"
                    class="text-center text-muted py-4">

                    Belum ada data Item.

                </td>

            </tr>
        `;

        return;

    }


    data.forEach(function (item, index) {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td class="ps-3">
                ${index + 1}
            </td>

            <td>
                <span class="fw-semibold">
                    ${escapeHtml(item.code)}
                </span>
            </td>

            <td>
                ${escapeHtml(item.name)}
            </td>

            <td class="text-center">

                ${
                    item.status
                    ?
                    `
                    <span class="badge bg-success">
                        Aktif
                    </span>
                    `
                    :
                    `
                    <span class="badge bg-secondary">
                        Nonaktif
                    </span>
                    `
                }

            </td>

            <td class="text-center">

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary me-1"
                    onclick="editItem(${item.id})"
                    title="Edit">

                    <i class="bi bi-pencil"></i>

                </button>


                <button
                    type="button"
                    class="btn btn-sm ${
                        item.status
                        ? "btn-outline-danger"
                        : "btn-outline-success"
                    }"
                    onclick="toggleItemStatus(
                        ${item.id},
                        ${item.status}
                    )"
                    title="${
                        item.status
                        ? "Nonaktifkan"
                        : "Aktifkan"
                    }">

                    <i class="bi ${
                        item.status
                        ? "bi-toggle-off"
                        : "bi-toggle-on"
                    }"></i>

                </button>

            </td>

        `;


        tbody.appendChild(tr);

    });

}


/* =====================================================
   OPEN ADD MODAL
===================================================== */

function openItemModal() {

    document.getElementById(
        "itemModalTitle"
    ).innerHTML = `
        <i class="bi bi-box me-2"></i>
        Tambah Item
    `;


    document.getElementById(
        "itemId"
    ).value = "";


    document.getElementById(
        "itemCode"
    ).value = "";


    document.getElementById(
        "itemName"
    ).value = "";


    document.getElementById(
        "itemStatus"
    ).value = "true";


    const modalElement =
        document.getElementById(
            "itemModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =====================================================
   EDIT ITEM
===================================================== */

function editItem(id) {

    const item =
        itemData.find(
            x => x.id === id
        );


    if (!item) {
        return;
    }


    document.getElementById(
        "itemModalTitle"
    ).innerHTML = `
        <i class="bi bi-pencil me-2"></i>
        Edit Item
    `;


    document.getElementById(
        "itemId"
    ).value = item.id;


    document.getElementById(
        "itemCode"
    ).value = item.code;


    document.getElementById(
        "itemName"
    ).value = item.name;


    document.getElementById(
        "itemStatus"
    ).value = String(
        item.status
    );


    const modalElement =
        document.getElementById(
            "itemModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =====================================================
   SAVE ITEM
===================================================== */

async function saveItem() {

    const id =
        document.getElementById(
            "itemId"
        ).value;


    const code =
        document.getElementById(
            "itemCode"
        ).value
        .trim()
        .toUpperCase();


    const name =
        document.getElementById(
            "itemName"
        ).value
        .trim();


    const status =
        document.getElementById(
            "itemStatus"
        ).value === "true";


    /* VALIDATION */

    if (!code) {

        alert(
            "Kode Item wajib diisi."
        );

        return;

    }


    if (!name) {

        alert(
            "Nama Item wajib diisi."
        );

        return;

    }


    try {

        let error;


        /* ==========================================
           INSERT
        ========================================== */

        if (!id) {

            const result =
                await supabaseClient
                    .from("items")
                    .insert({
                        code: code,
                        name: name,
                        status: status
                    });


            error =
                result.error;

        }


        /* ==========================================
           UPDATE
        ========================================== */

        else {

            const result =
                await supabaseClient
                    .from("items")
                    .update({
                        code: code,
                        name: name,
                        status: status
                    })
                    .eq("id", id);


            error =
                result.error;

        }


        if (error) {

            console.error(
                "Save item error:",
                error
            );


            if (
                error.code === "23505"
            ) {

                alert(
                    "Kode atau Nama Item sudah digunakan."
                );

            }
            else {

                alert(
                    "Gagal menyimpan Item: " +
                    error.message
                );

            }

            return;

        }


        /* CLOSE MODAL */

        const modalElement =
            document.getElementById(
                "itemModal"
            );


        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }


        /* REFRESH */

        await loadItems();


        alert(
            id
            ? "Item berhasil diperbarui."
            : "Item berhasil ditambahkan."
        );

        window.location.assign("app.html?page=items");


    } catch (error) {

        console.error(error);

        alert(
            "Terjadi kesalahan: " +
            error.message
        );

    }

}


/* =====================================================
   TOGGLE STATUS
===================================================== */

async function toggleItemStatus(
    id,
    currentStatus
) {

    const newStatus =
        !currentStatus;


    const message =
        newStatus
        ? "Aktifkan item ini?"
        : "Nonaktifkan item ini?";


    if (!confirm(message)) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("items")
        .update({
            status: newStatus
        })
        .eq("id", id);


    if (error) {

        console.error(
            "Toggle status error:",
            error
        );


        alert(
            "Gagal mengubah status: " +
            error.message
        );

        return;

    }


    await loadItems();

    window.location.assign("app.html?page=items");
}


/* =====================================================
   SEARCH
===================================================== */

function filterItems() {

    const keyword =
        document.getElementById(
            "itemSearch"
        ).value
        .trim()
        .toLowerCase();


    if (!keyword) {

        renderItems(itemData);

        return;

    }


    const filtered =
        itemData.filter(function (item) {

            return (
                item.code
                    .toLowerCase()
                    .includes(keyword)
                ||
                item.name
                    .toLowerCase()
                    .includes(keyword)
            );

        });


    renderItems(filtered);

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}