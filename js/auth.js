async function login() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert("Username dan password wajib diisi.");
        return;
    }

    // Mapping username → email Supabase Auth
    const emailMap = {
        admin: "admin.victory@gmail.com",
        kasir: "kasir.victory@gmail.com"
    };

    const email = emailMap[username];
 
    if (!email) {
        alert("Username tidak ditemukan.");
        return;
    }

    // Login ke Supabase Auth
    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        console.error("Login error:", error);
        alert("Login gagal: " + error.message);
        return;
    }

    // Ambil profile berdasarkan Auth User ID
    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                full_name,
                role,
                is_active
            `)
            .eq("id", data.user.id)
            .single();

    if (profileError) {
        console.error("Profile error:", profileError);

        await supabaseClient.auth.signOut();

        alert("Profile user tidak ditemukan.");
        return;
    }

    // Pastikan user aktif
    if (!profile.is_active) {

        await supabaseClient.auth.signOut();

        alert("User tidak aktif.");
        return;
    }

    // Simpan informasi untuk kebutuhan tampilan UI
    sessionStorage.setItem(
        "inventory_user",
        JSON.stringify(profile)
    );

    console.log("Login berhasil:", profile);

    // Masuk aplikasi
    window.location.href = "app.html";
}

async function logout() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
        alert("Gagal logout.");
        return;
    }

    sessionStorage.removeItem("user");

    window.location.href = "index.html";
}