/* Admin panel: list, promote/demote and delete accounts */

initPage(() => {
    const state = document.getElementById('state')
    const panel = document.getElementById('panel')
    const message = document.getElementById('message')
    const userRows = document.getElementById('userRows')
    const tableState = document.getElementById('tableState')
    const search = document.getElementById('search')
    const roleFilter = document.getElementById('roleFilter')
    const reloadBtn = document.getElementById('reloadBtn')

    // Refreshed from the server in init(), never trusted from cache alone
    let me = session.getUser()

    const showMessage = (text, type) => {
        message.textContent = text
        message.className = `message ${type}`
    }

    const clearMessage = () => {
        message.textContent = ''
        message.className = 'message'
    }

    const showState = (text, isError) => {
        state.textContent = text
        state.className = isError ? 'state error' : 'state'
        state.classList.remove('hidden')
        panel.classList.add('hidden')
    }

    const cell = (text) => {
        const td = document.createElement('td')
        td.textContent = text
        return td
    }

    // Built with DOM nodes, never innerHTML, so names/emails cannot inject HTML
    const buildRow = (user) => {
        const isSelf = user._id === me?._id
        const row = document.createElement('tr')

        const nameCell = cell(user.name)
        if (isSelf) {
            const you = document.createElement('span')
            you.className = 'you'
            you.textContent = ' (you)'
            nameCell.append(you)
        }

        const roleCell = document.createElement('td')
        const badge = document.createElement('span')
        badge.className = `badge${user.role === 'admin' ? ' admin' : ''}`
        badge.textContent = user.role
        roleCell.append(badge)

        const actions = document.createElement('td')
        actions.className = 'row-actions'

        const nextRole = user.role === 'admin' ? 'user' : 'admin'
        const roleBtn = document.createElement('button')
        roleBtn.type = 'button'
        roleBtn.className = 'mini secondary'
        roleBtn.textContent = user.role === 'admin' ? 'Demote' : 'Promote'
        roleBtn.disabled = isSelf
        roleBtn.title = isSelf ? 'You cannot change your own role' : `Make this user ${nextRole}`
        roleBtn.addEventListener('click', () => changeRole(user, nextRole))

        const delBtn = document.createElement('button')
        delBtn.type = 'button'
        delBtn.className = 'mini danger'
        delBtn.textContent = 'Delete'
        delBtn.disabled = isSelf
        delBtn.title = isSelf ? 'You cannot delete your own account here' : 'Delete this user'
        delBtn.addEventListener('click', () => removeUser(user))

        actions.append(roleBtn, delBtn)
        row.append(nameCell, cell(user.email), roleCell, cell(formatDate(user.createdAt)), actions)
        return row
    }

    const loadStats = async () => {
        const result = await request('/admin/stats')
        if (!result.ok) {
            return
        }
        document.getElementById('statTotal').textContent = result.data.stats.total
        document.getElementById('statAdmins').textContent = result.data.stats.admins
        document.getElementById('statUsers').textContent = result.data.stats.users
    }

    const loadUsers = async () => {
        clearMessage()
        tableState.textContent = 'Loading users...'
        userRows.replaceChildren()

        const params = new URLSearchParams()
        if (search.value.trim()) {
            params.set('search', search.value.trim())
        }
        if (roleFilter.value) {
            params.set('role', roleFilter.value)
        }

        const query = params.toString()
        const result = await request(`/admin/users${query ? '?' + query : ''}`)

        if (result.status === 401) {
            showState('Your session expired. Redirecting to login...', true)
            return setTimeout(logout, 900)
        }

        if (result.status === 403) {
            return showState('Admins only. This page is not available for your account.', true)
        }

        if (!result.ok) {
            tableState.textContent = ''
            return showMessage(messageFrom(result, 'Could not load users.'), 'error')
        }

        userRows.append(...result.data.users.map(buildRow))
        tableState.textContent = result.data.count === 0
            ? 'No users match your filters.'
            : `Showing ${result.data.count} user${result.data.count === 1 ? '' : 's'}.`
    }

    async function changeRole(user, role) {
        const result = await request(`/admin/users/${user._id}/role`, {
            method: 'PATCH',
            body: { role }
        })

        if (!result.ok) {
            return showMessage(messageFrom(result, 'Could not update the role.'), 'error')
        }

        showMessage(`${user.name} is now ${role}.`, 'success')
        await Promise.all([loadUsers(), loadStats()])
    }

    async function removeUser(user) {
        if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) {
            return
        }

        const result = await request(`/admin/users/${user._id}`, { method: 'DELETE' })

        if (!result.ok) {
            return showMessage(messageFrom(result, 'Could not delete the user.'), 'error')
        }

        showMessage(`${user.name} was deleted.`, 'success')
        await Promise.all([loadUsers(), loadStats()])
    }

    // Debounce the search box so we do not spam the server
    let searchTimer
    search.addEventListener('input', () => {
        clearTimeout(searchTimer)
        searchTimer = setTimeout(loadUsers, 300)
    })

    roleFilter.addEventListener('change', loadUsers)
    reloadBtn.addEventListener('click', () => Promise.all([loadUsers(), loadStats()]))

    const init = async () => {
        if (!session.isLoggedIn()) {
            showState('You are not logged in. Redirecting to login...', true)
            return setTimeout(() => { window.location.href = '/login' }, 800)
        }

        showState('Checking your permissions...', false)

        // Ask the server who we are, so a demoted admin cannot rely on stale cache
        const mine = await request('/me')

        if (mine.status === 401) {
            showState('Your session expired. Redirecting to login...', true)
            return setTimeout(logout, 900)
        }

        if (!mine.ok) {
            return showState(messageFrom(mine, 'Could not verify your account.'), true)
        }

        me = mine.data.user
        session.save(session.getToken(), me)
        renderNav()

        if (me.role !== 'admin') {
            return showState('Admins only. This page is not available for your account.', true)
        }

        state.classList.add('hidden')
        panel.classList.remove('hidden')
        await Promise.all([loadUsers(), loadStats()])
    }

    init()
})
