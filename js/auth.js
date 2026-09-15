document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        let role = null;

        if (
            username === "admin" &&
            password === "admin123"
        ) {

            role = "admin";

        } else if (
            username === "kasir" &&
            password === "kasir123"
        ) {

            role = "kasir";

        }

        if (!role) {

            document
                .getElementById("loginError")
                .classList.remove("d-none");

            return;
        }

        sessionStorage.setItem(
            "inventory_user",
            JSON.stringify({
                username: username,
                role: role
            })
        );

        window.location.href = "app.html";

    });

});