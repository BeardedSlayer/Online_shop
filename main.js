const productCards = document.querySelector('.product-cards');
const cart = document.querySelector('.header__items');
const cartDrawer = document.querySelector('.cart-drawer')
const cartOverlay = document.querySelector('.cart-overlay')
const drawerList = document.querySelector('.cart-drawer__item');
const cartCount = document.querySelector('.header__cart-count');
const drawerCount = document.querySelector('.cart-drawer__count');
const orderBtn = document.querySelector('.cart-drawer__order');
const searchInput = document.querySelector('.catalog__search');
const filterBtn = document.querySelector('.catalog__filters');
const orderForm = document.querySelector('.cart-drawer__form');
const nameInput = document.querySelector('#customer-name');
const phoneInput = document.querySelector('#customer-phone');


const BOT_TOKEN = '';
const CHAT_ID = ''

let products = [];

async function loadProducts() {
    try {

        const savedProducts = localStorage.getItem('products');

        if (savedProducts) {
            products = JSON.parse(savedProducts);
            renderProducts();
            return;
        }
        const response = await fetch('./products.json');
        if (!response.ok){
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        const data = await response.json();

        products = data;
        renderProducts();

    } catch (error) {
        console.error('Не удалось загрузить товары:', error);
        productCards.innerHTML= '<p class="catalog__empty">Ошибка загрузки каталога. Попробуйте позже.</p>'
    }
}


function openCart() {
    cartDrawer.classList.add('cart-drawer--active');
    cartOverlay.classList.add('cart-overlay--active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartDrawer.classList.remove('cart-drawer--active');
    cartOverlay.classList.remove('cart-overlay--active');
    document.body.style.overflow = '';
}

cart.addEventListener('click', (e) => {
    const cartBtn = e.target.closest('.header__cart-btn');
    if (!cartBtn) {
        return;
    }
    openCart();
})

cartDrawer.addEventListener('click', (e) => {
    const cartBtn = e.target.closest('.cart-drawer__btn');
    if (!cartBtn) {
        return;
    }
    closeCart();
})

cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCart();
    }
});

let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

let currentCategory = 'all'

function filterProducts() {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(query);

        const matchesCategory = currentCategory === 'all' || product.category === currentCategory;

        return matchesSearch && matchesCategory;
    })

    renderProducts(filtered);
}

function renderProducts(productsToRender = products) {
    let html = '';

    if (productsToRender.length === 0) {
        productCards.innerHTML = '<p class="catalog__empty">По вашему запросу ничего не найдено</p>';
        return;
    }

    productsToRender.forEach(product => {

        const isOutOfStock = product.stock === 0

        html += `

        <article class="product-card" data-id="${product.id}">
         <img class="product-card__image" src="${product.imgSrc}" alt="${product.title}">
         <h2 class="product-card__title">${product.title}</h2>
         <p class="product-card__stock">В наличии: ${product.stock} шт.</p>
            <div class="product-card__price">
                <del class="product-card__old-price">${product.oldPrice} $</del>
                <div class="product-card__new-price">${product.price} $</div>
            </div>
         <div class="product-card__badge">${product.badge}</div>
         <button class="product-card__button" type="button" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'Нет в наличии' : 'Добавить в корзину'}</button>
        </article>
        `
    })
    productCards.innerHTML = html;
}

searchInput.addEventListener('input', filterProducts);

filterBtn.addEventListener('click', (e) => {
    const btn = e.target.closest('.catalog__filter-btn');
    if (!btn) {
        return;
    }

    const activeBtn = filterBtn.querySelector('.catalog__filter-btn--active');

    activeBtn.classList.remove('catalog__filter-btn--active');
    btn.classList.add('catalog__filter-btn--active');


    currentCategory = btn.dataset.category;
    filterProducts();
});

productCards.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-card__button');
    if (!btn) {
        return;
    }
    const card = e.target.closest('.product-card');
    const productId = Number(card.dataset.id);

    const product = products.find(product => product.id === productId);
    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            alert('Больше нет на складе')
        }
    } else {
        cartItems.push({
            ...product,
            quantity: 1
        });
    }
    renderCart();

    console.log(cartItems);
})

function renderCart() {
    let totalPrice = 0;
    let totalCount = 0;
    let html = '';

    if (cartItems.length === 0) {
        html += `
        <p class="cart-drawer__empty">Корзина грустит, ей пусто :(</p>
        `;
    }

    cartItems.forEach(item => {

        html += `
        <div class="cart-item" data-id="${item.id}">
            <img class="cart-item__image" src="${item.imgSrc}" alt="${item.title}">
            <div class="cart-item__info">
            <span class="cart-item__title">${item.title}</span>
            <b class="cart-item__price">${item.price * item.quantity} $</b>
                <div class="cart-item__controls">
                    <button class="cart-item__btn" data-action="minus" type="button">-</button>
                    <span class="cart-item__quantity">${item.quantity} шт.</span>
                    <button class="cart-item__btn" data-action="plus" type="button">+</button>
                </div>
            </div>
            <button class="cart-item__remove" type="button">×</button>
        </div>
        `


        totalPrice += item.price * item.quantity;
        totalCount += item.quantity;
    })

    drawerList.innerHTML = html;
    drawerCount.textContent = `Итого ${totalPrice} $`;
    cartCount.textContent = totalCount;
    orderBtn.disabled = cartItems.length === 0;

    localStorage.setItem('cart', JSON.stringify(cartItems));

}

drawerList.addEventListener('click', (e) => {
    const card = e.target.closest('.cart-item');

    if (!card) {
        return;
    }
    const productId = Number(card.dataset.id);

    if (e.target.closest('.cart-item__remove')) {
        cartItems = cartItems.filter(item => item.id !== productId);
        renderCart();
        return;
    }

    const actionBtn = e.target.closest('.cart-item__btn');
    if (!actionBtn) {
        return;
    }
    const currentItem = cartItems.find(item => item.id === productId);
    if (actionBtn.dataset.action === 'plus') {
        if (currentItem.quantity < currentItem.stock) {
            currentItem.quantity += 1;
        } else {
            alert('Больше нет на складе')
        }
    } else if (actionBtn.dataset.action === 'minus') {
        if (currentItem.quantity > 1) {
            currentItem.quantity -= 1;
        } else {
            cartItems = cartItems.filter(item => item.id !== productId);
        }
    }
    renderCart();
})

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
        return;
    }

    const customerName = nameInput.value.trim();
    const customerPhone = phoneInput.value.trim();

    let message = 'Новый заказ с сайта!\n\n';
    message += `Покупатель: ${customerName}\n`;
    message += `Телефон: ${customerPhone}\n\n`;
    message += `Товары:\n`;

    let totalOrderPrice = 0;

    cartItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalOrderPrice += itemTotal;
        message += `${index + 1}. ${item.title} — ${item.quantity} шт. (${itemTotal} $)\n`
    });

    message += `\nИтого: ${totalOrderPrice} $`;

    orderBtn.disabled = true;
    orderBtn.textContent = 'Отправка заказа...';

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка отправки: ${response.status}`);
        }

        cartItems.forEach(item => {
            const product = products.find(product => product.id === item.id);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        localStorage.setItem('products', JSON.stringify(products));

        alert('Заказ успешно отправлен менеджеру!');
        cartItems = [];
        orderForm.reset()
        closeCart();
        renderCart();
        filterProducts()
    } catch (error) {
        console.error('Ошибка при оформлении:', error);
        alert('Не удалось отправить заказ. Проверьте соединение.');
        orderBtn.disabled = false;
    } finally {
        orderBtn.textContent = 'Перейти к оформлению';
    }
});

renderCart();
loadProducts();