let invoiceSale = null;
let invoiceDetails = [];


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initPrintSale
);


async function initPrintSale() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const saleId =
            params.get("id");


        if (!saleId) {

            throw new Error(
                "ID transaksi tidak ditemukan."
            );

        }


        await loadInvoice(
            saleId
        );


        renderInvoice();

    } catch (error) {

        console.error(
            "Print invoice error:",
            error
        );


        document.getElementById(
            "invoiceContent"
        ).innerHTML = `

            <div class="alert alert-danger">

                Gagal mengambil data invoice:

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }

}


/* =====================================================
   LOAD INVOICE
===================================================== */

async function loadInvoice(
    saleId
) {

    /*
     * SALES
     */

    const {
        data: sale,
        error: saleError
    } = await supabaseClient
        .from("sales")
        .select(`
            id,
            invoice_no,
            customer_id,
            sale_date,
            total,
            created_by,
            customers (
                id,
                customer_code,
                company_name,
                npwp,
                address,
                city,
                phone,
                email
            ),
            profiles (
                id,
                username,
                full_name
            )
        `)
        .eq(
            "id",
            saleId
        )
        .single();


    if (saleError) {

        throw saleError;

    }


    /*
     * SALES DETAIL
     */

    const {
        data: details,
        error: detailError
    } = await supabaseClient
        .from("sales_detail")
        .select(`
            id,
            sale_id,
            item_id,
            color_id,
            qty,
            price,
            subtotal,
            items (
                id,
                code,
                name
            ),
            colors (
                id,
                color_no,
                color_name
            )
        `)
        .eq(
            "sale_id",
            saleId
        )
        .order(
            "id",
            {
                ascending: true
            }
        );


    if (detailError) {

        throw detailError;

    }


    invoiceSale =
        sale;


    invoiceDetails =
        details || [];

}


/* =====================================================
   RENDER
===================================================== */

function renderInvoice() {

    const sale =
        invoiceSale;


    const customer =
        sale.customers || {};


    const createdBy =
        sale.profiles?.full_name ||
        sale.profiles?.username ||
        "-";


    const customerName =
        customer.company_name ||
        "-";


    const customerCode =
        customer.customer_code ||
        "-";


    const detailRows =
        invoiceDetails.map(
            function (detail, index) {

                const item =
                    detail.items
                    ? `${detail.items.code} - ${detail.items.name}`
                    : "-";


                const color =
                    detail.colors
                    ? `${detail.colors.color_no} - ${detail.colors.color_name}`
                    : "-";


                return `

                    <tr>

                        <td class="text-center">
                            ${index + 1}
                        </td>

                        <td>

                            <div class="fw-semibold">

                                ${escapeHtml(
                                    item
                                )}

                            </div>

                            <div class="text-muted small">

                                ${escapeHtml(
                                    color
                                )}

                            </div>

                        </td>

                        <td class="text-end">

                            ${formatStock(
                                detail.qty
                            )}

                        </td>

                        <td class="text-end">

                            ${formatCurrency(
                                detail.price
                            )}

                        </td>

                        <td class="text-end">

                            ${formatCurrency(
                                detail.subtotal
                            )}

                        </td>

                    </tr>

                `;

            }
        ).join("");


    document.getElementById(
        "invoiceContent"
    ).innerHTML = `

        <!-- HEADER -->

        <div class="row align-items-start mb-4">

            <div class="col-7">

                <div>
                    <img
                        src="images/logo.png"
                        alt="Victory Solo"
                        class="company-logo">
                </div>
 
                <div class="mt-2">

                    Jalan Diponegoro No.5 Grogol Sukoharjo 57552 Jawa Tengah

                </div>

                <div>

                    Telp: 021-620837

                </div>

                <div>

                    Email: Dwilliady@gmail.com

                </div>

            </div>


            <div class="col-5">

                <div class="invoice-title">

                    INVOICE

                </div>

                <div class="text-end mt-2">

                    <strong>
                        ${escapeHtml(
                            sale.invoice_no
                        )}
                    </strong>

                </div>

            </div>

        </div>


        <hr>


        <!-- INFO -->

        <div class="row mt-4 mb-4">

            <div class="col-7">

                <div class="text-muted small">

                    CUSTOMER

                </div>

                <div class="fw-semibold">

                    ${escapeHtml(
                        customerCode
                    )}
                    -
                    ${escapeHtml(
                        customerName
                    )}

                </div>


                ${
                    customer.address
                    ? `
                        <div>
                            ${escapeHtml(
                                customer.address
                            )}
                        </div>
                    `
                    : ""
                }


                ${
                    customer.city
                    ? `
                        <div>
                            ${escapeHtml(
                                customer.city
                            )}
                        </div>
                    `
                    : ""
                }


                ${
                    customer.phone
                    ? `
                        <div>
                            Telp: ${escapeHtml(
                                customer.phone
                            )}
                        </div>
                    `
                    : ""
                }

            </div>


            <div class="col-5">

                <table class="table table-sm table-borderless mb-0">

                    <tr>

                        <td>
                            Tanggal
                        </td>

                        <td class="text-end fw-semibold">

                            ${formatInvoiceDate(
                                sale.sale_date
                            )}

                        </td>

                    </tr>


                    <tr>

                        <td>
                            Dibuat Oleh
                        </td>

                        <td class="text-end fw-semibold">

                            ${escapeHtml(
                                createdBy
                            )}

                        </td>

                    </tr>

                </table>

            </div>

        </div>


        <!-- DETAIL -->

        <table class="table table-bordered align-middle">

            <thead>

                <tr>

                    <th
                        style="width: 50px;"
                        class="text-center">

                        No

                    </th>

                    <th>

                        Item / Warna

                    </th>

                    <th
                        style="width: 100px;"
                        class="text-end">

                        Qty

                    </th>

                    <th
                        style="width: 150px;"
                        class="text-end">

                        Harga

                    </th>

                    <th
                        style="width: 170px;"
                        class="text-end">

                        Subtotal

                    </th>

                </tr>

            </thead>


            <tbody>

                ${detailRows}

            </tbody>


            <tfoot>

                <tr>

                    <td
                        colspan="4"
                        class="text-end total-label">

                        TOTAL

                    </td>

                    <td
                        class="text-end total-value">

                        ${formatCurrency(
                            sale.total
                        )}

                    </td>

                </tr>

            </tfoot>

        </table>


        <!-- FOOTER -->

        <div class="row mt-5">

            <div class="col-6">

                <div class="fw-semibold">

                    Catatan:

                </div>

                <div class="text-muted">

                    Terima kasih atas kepercayaan Anda.

                </div>

            </div>


            <div class="col-6 text-center">

                <div>

                    Hormat Kami,

                </div>


                <div style="height: 70px;">

                </div>


                <div class="fw-semibold">

                    ${escapeHtml(
                        createdBy
                    )}

                </div>

            </div>

        </div>


        <div class="footer-note">

            Dokumen ini dibuat secara elektronik.

        </div>

    `;

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatInvoiceDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* =====================================================
   FORMAT STOCK
===================================================== */

function formatStock(
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


/* =====================================================
   FORMAT CURRENCY
===================================================== */

function formatCurrency(
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