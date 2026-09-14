/* Home page: auth card when signed out, welcome + data fetcher when signed in */

initPage(() => {
    const output = document.getElementById('output')
    const dataMessage = document.getElementById('dataMessage')
    const fetchBtn = document.getElementById('fetchBtn')

    const renderWelcome = (user) => {
        if (!user) {
            return
        }
        renderIdentity(user, { avatar: 'homeAvatar', email: 'homeEmail', role: 'homeRole' })
        document.getElementById('homeName').textContent = `Welcome, ${user.name}`
    }

    // Log in / register without leaving the home page
    const authForms = initAuthForms({
        onSuccess: (user) => {
            renderWelcome(user)
            renderNav()
        }
    })

    const loginForm = document.getElementById('loginForm')
    const registerForm = document.getElementById('registerForm')
    const forgotForm = document.getElementById('forgotForm')
    const resetForm = document.getElementById('resetForm')
    const forgotLink = document.getElementById('forgotPasswordLink')
    const backToLoginLink = document.getElementById('backToLoginLink')
    const resetBackToLoginLink = document.getElementById('resetBackToLoginLink')
    const tabs = document.querySelector('.tabs')
    const message = document.getElementById('message')
    const heading = document.getElementById('heading')
    const subtitle = document.getElementById('subtitle')
    const resetToken = new URLSearchParams(window.location.search).get('token')

    const showMessage = (text, type) => {
        message.textContent = text
        message.className = `message ${type}`
    }

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

    forgotLink.addEventListener('click', () => showPanel('forgot'))
    backToLoginLink.addEventListener('click', () => {
        showPanel('login')
        authForms.showForm('login')
        message.className = 'message'
    })
    resetBackToLoginLink.addEventListener('click', () => {
        window.history.replaceState({}, '', '/')
        showPanel('login')
        authForms.showForm('login')
        message.className = 'message'
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

    renderWelcome(session.getUser())

    const handleFetch = async () => {
        dataMessage.className = 'message'
        dataMessage.textContent = ''
        fetchBtn.disabled = true
        fetchBtn.textContent = 'Loading...'

        // Relative URL, so this works on whatever port the server uses
        const result = await request('/api', { auth: false })

        if (!result.ok) {
            dataMessage.textContent = messageFrom(result, 'Could not load the data')
            dataMessage.classList.add('error')
            output.classList.add('hidden')
        } else {
            output.textContent = JSON.stringify(result.data, null, 2)
            output.classList.remove('hidden')
        }

        fetchBtn.disabled = false
        fetchBtn.textContent = 'Fetch data'
    }

    fetchBtn.addEventListener('click', handleFetch)
})
