/* Profile page behaviour */

initPage(() => {
    const state = document.getElementById('state')
    const profile = document.getElementById('profile')
    const refreshBtn = document.getElementById('refreshBtn')
    const deleteBtn = document.getElementById('deleteBtn')

    const showState = (text, isError) => {
        state.textContent = text
        state.className = isError ? 'state error' : 'state'
        state.classList.remove('hidden')
        profile.classList.add('hidden')
    }

    const renderProfile = (user) => {
        renderIdentity(user, { avatar: 'avatar', name: 'name', email: 'email', role: 'role' })
        document.getElementById('userId').textContent = user._id
        document.getElementById('createdAt').textContent = formatDate(user.createdAt)
        document.getElementById('updatedAt').textContent = formatDate(user.updatedAt)

        state.classList.add('hidden')
        profile.classList.remove('hidden')
        renderNav()
    }

    const loadProfile = async () => {
        if (!session.isLoggedIn()) {
            showState('You are not logged in. Redirecting to login...', true)
            setTimeout(() => { window.location.href = '/login' }, 800)
            return
        }

        // Paint cached data instantly, then refresh from the server
        const cached = session.getUser()
        if (cached) {
            renderProfile(cached)
        } else {
            showState('Loading your profile...', false)
        }

        refreshBtn.disabled = true
        const result = await request('/me')
        refreshBtn.disabled = false

        if (result.status === 401) {
            showState('Your session expired. Redirecting to login...', true)
            setTimeout(logout, 900)
            return
        }

        if (!result.ok) {
            // Keep showing cached data if we have it, just report the problem
            if (cached) {
                console.error('Could not refresh profile:', messageFrom(result, 'unknown error'))
            } else {
                showState(messageFrom(result, 'Unable to load your profile.'), true)
            }
            return
        }

        session.save(session.getToken(), result.data.user)
        renderProfile(result.data.user)
    }

    const handleDelete = async () => {
        if (!confirm('Permanently delete your account? This cannot be undone.')) {
            return
        }

        deleteBtn.disabled = true
        deleteBtn.textContent = 'Deleting...'

        const result = await request('/me', { method: 'DELETE' })

        if (!result.ok) {
            alert(messageFrom(result, 'Could not delete your account.'))
            deleteBtn.disabled = false
            deleteBtn.textContent = 'Delete account'
            return
        }

        alert('Your account has been deleted.')
        logout()
    }

    refreshBtn.addEventListener('click', loadProfile)
    deleteBtn.addEventListener('click', handleDelete)

    loadProfile()
})
