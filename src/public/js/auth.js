/* Shared auth + UI helpers used by every page */

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const session = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY)
    },
    getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY))
        } catch (error) {
            console.error('Stored user is not valid JSON:', error)
            return null
        }
    },
    save(token, user) {
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    clear() {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    },
    isLoggedIn() {
        return Boolean(localStorage.getItem(TOKEN_KEY))
    }
}

// Wrapper around fetch that always returns { ok, status, data }
async function request(url, options = {}) {
    const headers = { ...(options.headers || {}) }

    if (options.body) {
        headers['Content-Type'] = 'application/json'
    }

    const token = session.getToken()
    if (token && options.auth !== false) {
        headers.Authorization = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        })

        let data = null
        if ((response.headers.get('content-type') || '').includes('application/json')) {
            data = await response.json()
        }

        return { ok: response.ok, status: response.status, data }
    } catch (error) {
        console.error(`Request to ${url} failed:`, error)
        return { ok: false, status: 0, data: null, networkError: true }
    }
}

// Pull a readable message out of any response shape
function messageFrom(result, fallback) {
    if (result.networkError) {
        return 'Unable to reach the server. Is it running?'
    }
    return result.data?.message || fallback
}

function logout() {
    session.clear()
    window.location.href = '/login'
}

// Show/hide elements based on auth state and mark the current nav link.
// Toggles a .visible class instead of inline styles, because the CSS
// default for [data-auth] is display:none (inline '' would not win).
function renderNav() {
    const loggedIn = session.isLoggedIn()
    const isAdmin = session.getUser()?.role === 'admin'

    document.querySelectorAll('[data-auth]').forEach(el => {
        const needs = el.dataset.auth
        let visible = false

        if (needs === 'in') {
            visible = loggedIn
        } else if (needs === 'out') {
            visible = !loggedIn
        } else if (needs === 'admin') {
            visible = loggedIn && isAdmin
        }

        el.classList.toggle('visible', visible)
    })

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === window.location.pathname)
    })

    // dataset flag stops duplicate listeners when renderNav runs again
    document.querySelectorAll('[data-logout]').forEach(button => {
        if (button.dataset.logoutBound) {
            return
        }
        button.dataset.logoutBound = 'true'
        button.addEventListener('click', logout)
    })
}

// Runs a page's setup once the DOM exists, with the nav already rendered
function initPage(setup) {
    const start = () => {
        renderNav()
        if (typeof setup === 'function') {
            setup()
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start)
    } else {
        start()
    }
}

function formatDate(value) {
    if (!value) {
        return 'Not available'
    }
    const date = new Date(value)
    return isNaN(date) ? 'Not available' : date.toLocaleString()
}

// Fill an avatar/name/email/role block from a user object
function renderIdentity(user, ids) {
    if (ids.avatar) {
        document.getElementById(ids.avatar).textContent = (user.name || '?').charAt(0).toUpperCase()
    }
    if (ids.name) {
        document.getElementById(ids.name).textContent = user.name || 'Unknown'
    }
    if (ids.email) {
        document.getElementById(ids.email).textContent = user.email || ''
    }
    if (ids.role) {
        const role = user.role || 'user'
        const badge = document.getElementById(ids.role)
        badge.textContent = role
        badge.classList.toggle('admin', role === 'admin')
    }
}

/*
 * Wires up the shared login/register card.
 * Used by both the home page and the dedicated login page.
 */
function initAuthForms({ redirectTo = '/profile', onSuccess } = {}) {
    const message = document.getElementById('message')
    const loginForm = document.getElementById('loginForm')
    const registerForm = document.getElementById('registerForm')
    const loginTab = document.getElementById('loginTab')
    const registerTab = document.getElementById('registerTab')
    const heading = document.getElementById('heading')
    const subtitle = document.getElementById('subtitle')

    if (!loginForm || !registerForm) {
        return
    }

    const showMessage = (text, type) => {
        message.textContent = text
        message.className = `message ${type}`
    }

    const clearMessage = () => {
        message.textContent = ''
        message.className = 'message'
    }

    const showForm = (name) => {
        clearMessage()
        const isLogin = name === 'login'

        loginForm.classList.toggle('hidden', !isLogin)
        registerForm.classList.toggle('hidden', isLogin)
        loginTab.classList.toggle('active', isLogin)
        registerTab.classList.toggle('active', !isLogin)

        if (heading) {
            heading.textContent = isLogin ? 'Welcome back' : 'Create your account'
        }
        if (subtitle) {
            subtitle.textContent = isLogin
                ? 'Sign in to view your profile.'
                : 'Register to get started. It only takes a moment.'
        }
    }

    const submitAuth = async (url, payload, form) => {
        const button = form.querySelector('.btn')
        const originalText = button.textContent

        clearMessage()
        button.disabled = true
        button.textContent = 'Please wait...'

        const result = await request(url, { method: 'POST', body: payload, auth: false })

        if (!result.ok) {
            showMessage(messageFrom(result, 'Something went wrong. Please try again.'), 'error')
            button.disabled = false
            button.textContent = originalText
            return
        }

        session.save(result.data.token, result.data.user)
        showMessage(`${result.data.message}. One moment...`, 'success')

        if (typeof onSuccess === 'function') {
            // Let the page decide what to do (e.g. swap the view in place)
            setTimeout(() => onSuccess(result.data.user), 500)
        } else {
            setTimeout(() => { window.location.href = redirectTo }, 600)
        }
    }

    loginTab.addEventListener('click', () => showForm('login'))
    registerTab.addEventListener('click', () => showForm('register'))

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault()

        const email = document.getElementById('loginEmail').value.trim()
        const password = document.getElementById('loginPassword').value

        if (!email || !password) {
            return showMessage('Please enter both your email and password.', 'error')
        }

        submitAuth('/login', { email, password }, loginForm)
    })

    registerForm.addEventListener('submit', (event) => {
        event.preventDefault()

        const name = document.getElementById('registerName').value.trim()
        const email = document.getElementById('registerEmail').value.trim()
        const password = document.getElementById('registerPassword').value

        if (!name || !email || !password) {
            return showMessage('Please fill in every field.', 'error')
        }

        if (password.length < 6) {
            return showMessage('Password must be at least 6 characters.', 'error')
        }

        submitAuth('/register', { name, email, password }, registerForm)
    })

    return { showMessage, clearMessage, showForm }
}
