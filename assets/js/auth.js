// assets/js/auth.js
// Note: Replace 'YOUR_CLIENT_ID' with actual client IDs from Google/Microsoft developer consoles.

const googleConfig = {
    authority: "https://accounts.google.com",
    client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Replace with your Google Client ID
    redirect_uri: `${window.location.origin}/callback.html`,
    response_type: "id_token token",
    scope: "openid profile email",
    loadUserInfo: true,
};

const microsoftConfig = {
    authority: "https://login.microsoftonline.com/common",
    client_id: "YOUR_MICROSOFT_CLIENT_ID", // Replace with your Microsoft Client ID
    redirect_uri: `${window.location.origin}/callback.html`,
    response_type: "id_token token",
    scope: "openid profile email",
    loadUserInfo: true,
};

const googleUserManager = new Oidc.UserManager(googleConfig);
const microsoftUserManager = new Oidc.UserManager(microsoftConfig);

function loginWithGoogle() {
    localStorage.setItem('vimpl_provider', 'google');
    googleUserManager.signinRedirect();
}

function loginWithMicrosoft() {
    localStorage.setItem('vimpl_provider', 'microsoft');
    microsoftUserManager.signinRedirect();
}

function logout() {
    const provider = localStorage.getItem('vimpl_provider');
    localStorage.removeItem('vimpl-user');
    localStorage.removeItem('vimpl_provider');

    if (provider === 'google') {
        googleUserManager.signoutRedirect({ post_logout_redirect_uri: window.location.origin });
    } else if (provider === 'microsoft') {
        microsoftUserManager.signoutRedirect({ post_logout_redirect_uri: window.location.origin });
    } else {
        window.location.href = window.location.origin;
    }
}

function getCurrentUser() {
    const userString = localStorage.getItem('vimpl-user');
    if (userString) {
        return JSON.parse(userString);
    }
    return null;
}

// Function for the callback page to handle the redirect and store user data
async function handleAuthCallback() {
    const provider = localStorage.getItem('vimpl_provider');
    let userManager = provider === 'google' ? googleUserManager : microsoftUserManager;

    try {
        const user = await userManager.signinRedirectCallback();
        if (user) {
            const userData = {
                id: user.profile.sub,
                name: user.profile.name,
                email: user.profile.email,
                provider: provider
            };
            localStorage.setItem('vimpl-user', JSON.stringify(userData));
            window.location.href = localStorage.getItem('vimpl_redirect_url') || '/';
            localStorage.removeItem('vimpl_redirect_url');
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error("Authentication callback error:", error);
        window.location.href = '/';
    }
}
