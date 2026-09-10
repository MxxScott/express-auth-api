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
    initAuthForms({
        onSuccess: (user) => {
            renderWelcome(user)
            renderNav()
        }
    })

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
