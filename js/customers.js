let customerData = [];


/* =====================================================
   INIT
===================================================== */

async function initCustomers() {

    try {

        await loadCustomers();

        renderCustomers(customerData);

    } catch (error) {

        console.error(
            "Customer error:",
            error
        );

        alert(
            "Gagal mengambil data customer: " +
            error.message
        );

    }

}


/* =====================================================
   LOAD
===================================================== */

async function loadCustomers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("customers")
        .select(`
            id,
            customer_code,
            company_name,
            npwp,
            address,
            city,
            phone,
            email,
            status,
            created_at,
            updated_at
        `)
        .order("company_name");


    if (error) {
        throw error;
    }


    customerData = data || [];

}


/* =====================================================
   RENDER
===================================================== */

function renderCustomers(data) {

    const tbody =
        document.getElementById(
            "customerTableBody"
        );


    tbody.innerHTML = "";


    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center text-muted py-4">

                    Belum ada data customer

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(function (customer) {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>

                <span class="fw-semibold">

                    ${escapeHtml(
                        customer.customer_code
                    )}

                </span>

            </td>


            <td>

                ${escapeHtml(
                    customer.company_name
                )}

            </td>


            <td>

                ${escapeHtml(
                    customer.npwp || "-"
                )}

            </td>


            <td>

                ${escapeHtml(
                    customer.city || "-"
                )}

            </td>


            <td>

                ${escapeHtml(
                    customer.phone || "-"
                )}

            </td>


            <td class="text-center">

                ${
                    customer.status

                    ?

                    `<span class="badge bg-success">
                        Aktif
                    </span>`

                    :

                    `<span class="badge bg-secondary">
                        Nonaktif
                    </span>`
                }

            </td>


            <td class="text-center">

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary me-1"
                    onclick="editCustomer(${customer.id})"
                    title="Edit">

                    <i class="bi bi-pencil"></i>

                </button>


                <button
                    type="button"
                    class="btn btn-sm ${
                        customer.status
                        ? "btn-outline-danger"
                        : "btn-outline-success"
                    }"
                    onclick="toggleCustomerStatus(
                        ${customer.id},
                        ${customer.status}
                    )"
                    title="${
                        customer.status
                        ? "Nonaktifkan"
                        : "Aktifkan"
                    }">

                    <i class="bi ${
                        customer.status
                        ? "bi-x-circle"
                        : "bi-check-circle"
                    }"></i>

                </button>

            </td>

        `;


        tbody.appendChild(tr);

    });

}


/* =====================================================
   OPEN MODAL
===================================================== */

function openCustomerModal() {

    document.getElementById(
        "customerModalTitle"
    ).textContent =
        "Tambah Customer";


    document.getElementById(
        "customerId"
    ).value = "";


    document.getElementById(
        "customerCode"
    ).value = "";


    document.getElementById(
        "companyName"
    ).value = "";


    document.getElementById(
        "customerNpwp"
    ).value = "";


    document.getElementById(
        "customerAddress"
    ).value = "";


    document.getElementById(
        "customerCity"
    ).value = "";


    document.getElementById(
        "customerPhone"
    ).value = "";


    document.getElementById(
        "customerEmail"
    ).value = "";


    document.getElementById(
        "customerStatus"
    ).value = "true";


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "customerModal"
            )
        );


    modal.show();

}


/* =====================================================
   EDIT
===================================================== */

function editCustomer(id) {

    const customer =
        customerData.find(function (row) {

            return Number(row.id) ===
                Number(id);

        });


    if (!customer) {

        alert(
            "Data customer tidak ditemukan."
        );

        return;

    }


    document.getElementById(
        "customerModalTitle"
    ).textContent =
        "Edit Customer";


    document.getElementById(
        "customerId"
    ).value =
        customer.id;


    document.getElementById(
        "customerCode"
    ).value =
        customer.customer_code || "";


    document.getElementById(
        "companyName"
    ).value =
        customer.company_name || "";


    document.getElementById(
        "customerNpwp"
    ).value =
        customer.npwp || "";


    document.getElementById(
        "customerAddress"
    ).value =
        customer.address || "";


    document.getElementById(
        "customerCity"
    ).value =
        customer.city || "";


    document.getElementById(
        "customerPhone"
    ).value =
        customer.phone || "";


    document.getElementById(
        "customerEmail"
    ).value =
        customer.email || "";


    document.getElementById(
        "customerStatus"
    ).value =
        customer.status
            ? "true"
            : "false";


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "customerModal"
            )
        );


    modal.show();

}


/* =====================================================
   SAVE
===================================================== */

async function saveCustomer() {

    const id =
        document.getElementById(
            "customerId"
        ).value;


    const customerCode =
        document.getElementById(
            "customerCode"
        ).value
        .trim();


    const companyName =
        document.getElementById(
            "companyName"
        ).value
        .trim();


    const npwp =
        document.getElementById(
            "customerNpwp"
        ).value
        .trim();


    const address =
        document.getElementById(
            "customerAddress"
        ).value
        .trim();


    const city =
        document.getElementById(
            "customerCity"
        ).value
        .trim();


    const phone =
        document.getElementById(
            "customerPhone"
        ).value
        .trim();


    const email =
        document.getElementById(
            "customerEmail"
        ).value
        .trim();


    const status =
        document.getElementById(
            "customerStatus"
        ).value === "true";


    /* VALIDATION */

    if (!companyName) {

        alert(
            "Nama Customer harus diisi."
        );

        return;

    }


    try {

        let error;


        /* EDIT */

        if (id) {

            const result =
                await supabaseClient
                    .from("customers")
                    .update({
                        customer_code:
                            customerCode,

                        company_name:
                            companyName,

                        npwp:
                            npwp || null,

                        address:
                            address || null,

                        city:
                            city || null,

                        phone:
                            phone || null,

                        email:
                            email || null,

                        status:
                            status,

                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "id",
                        Number(id)
                    );


            error =
                result.error;

        }

        /* INSERT */

        else {

            const result =
                await supabaseClient.rpc(
                    "create_customer",
                    {
                        p_company_name: companyName,
                        p_npwp: npwp || null,
                        p_address: address || null,
                        p_city: city || null,
                        p_phone: phone || null,
                        p_email: email || null
                    }
                );

            error =
                result.error;

        }


        if (error) {

            console.error(
                "Save customer error:",
                error
            );


            if (
                error.code ===
                "23505"
            ) {

                alert(
                    "Kode Customer sudah digunakan."
                );

            } else {

                alert(
                    "Gagal menyimpan customer: " +
                    error.message
                );

            }

            return;

        }


        alert(
            id
                ? "Customer berhasil diperbarui."
                : "Customer berhasil ditambahkan."
        );


        window.location.href =
            "app.html?page=customers";


    } catch (error) {

        console.error(
            "Save customer error:",
            error
        );


        alert(
            "Terjadi kesalahan: " +
            error.message
        );

    }

}


/* =====================================================
   TOGGLE STATUS
===================================================== */

async function toggleCustomerStatus(
    id,
    currentStatus
) {

    const action =
        currentStatus
            ? "menonaktifkan"
            : "mengaktifkan";


    if (
        !confirm(
            `Yakin ingin ${action} customer ini?`
        )
    ) {

        return;

    }


    try {

        const {
            error
        } = await supabaseClient
            .from("customers")
            .update({
                status:
                    !currentStatus,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                Number(id)
            );


        if (error) {
            throw error;
        }


        window.location.href =
            "app.html?page=customers";


    } catch (error) {

        console.error(
            "Toggle customer error:",
            error
        );


        alert(
            "Gagal mengubah status customer: " +
            error.message
        );

        window.location.href =
            "app.html?page=customers";

    }

}


/* =====================================================
   SEARCH
===================================================== */

function filterCustomers() {

    const keyword =
        document.getElementById(
            "customerSearch"
        ).value
        .toLowerCase()
        .trim();


    const filtered =
        customerData.filter(
            function (customer) {

                return (

                    (
                        customer.customer_code ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (
                        customer.company_name ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (
                        customer.npwp ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (
                        customer.city ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    (
                        customer.phone ||
                        ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                );

            }
        );


    renderCustomers(filtered);

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
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