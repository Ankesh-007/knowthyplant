function showTab(tab) {
    document.querySelectorAll(".auth-form").forEach(f => f.classList.add("hidden"));
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    hideMessage();

    if (tab === "signin") {
        document.getElementById("signin-form").classList.remove("hidden");
        document.getElementById("tab-signin").classList.add("active");
    } else if (tab === "signup") {
        document.getElementById("signup-form").classList.remove("hidden");
        document.getElementById("tab-signup").classList.add("active");
    } else if (tab === "reset") {
        document.getElementById("reset-form").classList.remove("hidden");
    }
}

function showMessage(text, isError) {
    const msg = document.getElementById("auth-message");
    msg.textContent = text;
    msg.className = "auth-message " + (isError ? "error" : "success");
    msg.classList.remove("hidden");
}

function hideMessage() {
    document.getElementById("auth-message").classList.add("hidden");
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showMessage(error.message, true);
    } else {
        window.location.href = "index.html";
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;

    if (password !== confirm) {
        showMessage("Passwords do not match.", true);
        return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage("Check your email for a confirmation link!", false);
    }
}

async function handleReset(e) {
    e.preventDefault();
    const email = document.getElementById("reset-email").value;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth.html",
    });

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage("Password reset link sent to your email!", false);
    }
}

// Redirect to app if already signed in
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = "index.html";
    }
});
