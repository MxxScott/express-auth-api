/* Dedicated login page - reuses the shared auth card */

initPage(() => {
    const forms = initAuthForms({ redirectTo: '/profile' })
    const loginForm = document.getElementById('loginForm')
    const registerForm = document.getElementById('registerForm')
    const forgotForm = document.getElementById('forgotForm')
    const resetForm = document.getElementById('resetForm')
    const tabs = document.querySelector('.tabs')
    const forgotLink = document.getElementById('forgotPasswordLink')
    const backToLoginLink = document.getElementById('backToLoginLink')
    const message = document.getElementById('message')
    const heading = document.getElementById('heading')
    const subtitle = document.getElementById('subtitle')
    const resetToken = new URLSearchParams(window.location.search).get('token')

    const showPanel = (panel) => {
        loginForm.classList.toggle('hidden', panel !== 'login')
        registerForm.classList.toggle('hidden', panel !== 'register')
        forgotForm.classList.toggle('hidden', panel !== 'forgot')
        resetForm.classList.toggle('hidden', panel !== 'reset')
        tabs.classList.toggle('hidden', panel === 'forgot' || panel === 'reset')

        if (panel === 'forgot') {
            heading.textContent = 'Account recovery'
            subtitle.textContent = 'Get a secure link to choose a new password.'
            message.className = 'message'
            forgotForm.elements.email.focus()
        }

        if (panel === 'reset') {
            heading.textContent = 'Finish the reset'
            subtitle.textContent = 'Your reset link is ready. Choose a new password below.'
            message.className = 'message'
            resetForm.elements.newPassword.focus()
        }
    }

    const showMessage = (text, type) => {
        message.textContent = text
        message.className = `message ${type}`
    }

    forgotLink.addEventListener('click', () => showPanel('forgot'))
    backToLoginLink.addEventListener('click', () => {
        showPanel('login')
        forms.showForm('login')
    })

    forgotForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const email = forgotForm.elements.email.value.trim()
        const button = forgotForm.querySelector('.btn')

        if (!email) {
            showMessage('Enter the email address on your account.', 'error')
            return
        }

        button.disabled = true
        button.textContent = 'Sending...'
        const result = await request('/forgot-password', {
            method: 'POST',
            body: { email },
            auth: false
        })

        showMessage(
            result.ok
                ? messageFrom(result, 'If an account exists, a reset link is on its way.')
                : messageFrom(result, 'We could not start the reset. Try again.'),
            result.ok ? 'success' : 'error'
        )
        button.disabled = false
        button.textContent = 'Send reset link'
    })

    resetForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const newPassword = resetForm.elements.newPassword.value
        const confirmPassword = resetForm.elements.confirmPassword.value
        const button = resetForm.querySelector('.btn')

        if (!resetToken) {
            showMessage('This reset link is missing its token. Request a new one.', 'error')
            return
        }
        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters.', 'error')
            return
        }
        if (newPassword !== confirmPassword) {
            showMessage('The passwords do not match.', 'error')
            return
        }

        button.disabled = true
        button.textContent = 'Updating...'
        const result = await request('/reset-password', {
            method: 'POST',
            body: { token: resetToken, newPassword },
            auth: false
        })

        if (result.ok) {
            showMessage(messageFrom(result, 'Password updated. You can now sign in.'), 'success')
            resetForm.reset()
            setTimeout(() => {
                window.location.href = '/login'
            }, 1200)
        } else {
            showMessage(messageFrom(result, 'This reset link is invalid or expired.'), 'error')
        }

        button.disabled = false
        button.textContent = 'Update password'
    })

    if (resetToken) {
        showPanel('reset')
    }

    // Already signed in? No reason to show the form.
    if (session.isLoggedIn() && !resetToken) {
        forms.showMessage('You are already logged in. Taking you to your profile...', 'info')
        setTimeout(() => {
            window.location.href = '/profile'
        }, 800)
    }
})
