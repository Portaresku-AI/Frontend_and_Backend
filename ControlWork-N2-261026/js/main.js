'use strict';

// JavaScript дополняет Bootstrap: фильтры, выбор товара и учебная заявка.
// Никаких fetch, localStorage и отправки персональных данных здесь нет.
const formatPrice = (value) => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
}).format(value);
const findProduct = (id) => PARK_PRODUCTS.find((product) => product.id === id);
const params = new URLSearchParams(window.location.search);

// Каталог: поиск + категория + сортировка работают вместе.
const filters = document.getElementById('catalogFilters');
if (filters) {
  const grid = document.getElementById('catalogGrid');
  const items = [...grid.querySelectorAll('[data-product-card]')];
  const applyFilters = () => {
    const query = filters.elements.search.value.trim().toLocaleLowerCase('ru-RU');
    const category = filters.elements.category.value;
    const sort = filters.elements.sort.value;
    const ordered = [...PARK_PRODUCTS];
    if (sort === 'price-asc') ordered.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') ordered.sort((a, b) => b.price - a.price);
    if (sort === 'name') ordered.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    let count = 0;
    for (const product of ordered) {
      const item = items.find((element) => element.dataset.productCard === product.id);
      const text = `${product.name} ${product.short} ${product.description}`.toLocaleLowerCase('ru-RU');
      const visible = (category === 'all' || category === product.category) && text.includes(query);
      item.hidden = !visible;
      grid.append(item);
      if (visible) count++;
    }
    document.getElementById('catalogCount').textContent = `Найдено: ${count} из ${PARK_PRODUCTS.length}`;
    document.getElementById('catalogEmpty').hidden = count > 0;
  };
  filters.addEventListener('input', applyFilters);
  filters.addEventListener('change', applyFilters);
  filters.addEventListener('submit', (event) => event.preventDefault());
  // reset происходит после события; микрозадача читает уже сброшенные поля.
  filters.addEventListener('reset', () => queueMicrotask(applyFilters));
  applyFilters();
}

// product.html остаётся полноценной HTML-страницей; id выбирает один из разделов.
const details = document.querySelectorAll('[data-product-detail]');
if (details.length) {
  const requested = params.get('id');
  const product = findProduct(requested || 'safari') || findProduct('safari');
  for (const section of details) section.hidden = section.dataset.productDetail !== product.id;
  document.getElementById('productNotFound').hidden = !requested || Boolean(findProduct(requested));
  document.getElementById('productPageTitle').textContent = product.name;
  document.title = `${product.name} — Jurassic Park`;
  document.querySelector('meta[name="description"]').content = product.short;
}

const orderForm = document.getElementById('orderForm');
if (orderForm) {
  const productSelect = document.getElementById('product');
  const quantity = document.getElementById('quantity');
  const date = document.getElementById('visitDate');
  const time = document.getElementById('visitTime');
  const name = document.getElementById('name');
  const email = document.getElementById('email');
  const submit = document.getElementById('submitOrder');
  // Локальная дата пользователя, а не UTC: возле полуночи это разные дни.
  const localToday = () => {
    const now = new Date();
    const pad = (number) => String(number).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };
  const preset = findProduct(params.get('product'));
  if (preset) productSelect.value = preset.id;

  const updateSummary = () => {
    const product = findProduct(productSelect.value);
    const count = Number(quantity.value);
    const validCount = Number.isInteger(count) && count >= 1 && count <= 10;
    const isVisit = Boolean(product && product.category !== 'souvenirs');
    const hasTime = Boolean(product && product.category === 'expeditions');
    document.getElementById('dateField').hidden = !isVisit;
    date.disabled = !isVisit;
    date.required = isVisit;
    date.min = localToday();
    document.getElementById('timeField').hidden = !hasTime;
    time.disabled = !hasTime;
    time.required = hasTime;
    document.getElementById('summaryName').textContent = product ? product.name : 'Выберите приключение';
    document.getElementById('summaryDetails').textContent = product && validCount
      ? `${formatPrice(product.price)} × ${count} ${isVisit ? 'гост.' : 'шт.'}`
      : 'Выберите предложение и количество от 1 до 10.';
    document.getElementById('summaryTotal').textContent = product && validCount ? formatPrice(product.price * count) : '—';
    document.getElementById('productNote').textContent = product ? product.note : 'Выберите предложение, чтобы увидеть условия.';
    name.setCustomValidity(name.value && name.value.trim().length < 2 ? 'Введите имя длиной не менее двух символов.' : '');
    // Нативный type=email + доменная часть для понятной учебной проверки.
    email.setCustomValidity(email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? 'Введите адрес вида name@example.com.' : '');
  };
  orderForm.addEventListener('input', updateSummary);
  orderForm.addEventListener('change', updateSummary);
  orderForm.addEventListener('reset', () => queueMicrotask(updateSummary));
  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateSummary();
    if (!orderForm.reportValidity()) return;
    const product = findProduct(productSelect.value);
    if (!product) return;
    const count = Number(quantity.value);
    const dateLabel = date.disabled ? 'Самовывоз в магазине парка' : `Посещение: ${date.value.split('-').reverse().join('.')}${time.disabled ? '' : `, ${time.value}`}`;
    // textContent не исполняет разметку из полей пользователя.
    document.getElementById('resultSummary').textContent = `${product.name} · ${count} ${product.category === 'souvenirs' ? 'шт.' : 'гост.'} · ${formatPrice(product.price * count)}. ${dateLabel}.`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('resultModal')).show();
  });
  document.getElementById('resultModal').addEventListener('hidden.bs.modal', () => submit.focus());
  updateSummary();
  submit.disabled = false;
}
