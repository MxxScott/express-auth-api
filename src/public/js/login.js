/* Dedicated login page - reuses the shared auth card */

initPage(() => {
    const forms = initAuthForms({ redirectTo: '/profile' })

    // Already signed in? No reason to show the form.
    if (session.isLoggedIn()) {
        forms.showMessage('You are already logged in. Taking you to your profile...', 'info')
        setTimeout(() => {
            window.location.href = '/profile'
        }, 800)
    }
})
