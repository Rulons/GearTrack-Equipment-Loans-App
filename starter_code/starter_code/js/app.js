
/**
 * Application entry point for rendering equipment and loan data.
 * @module app
 */

import { dataService } from './dataService.js';

window.addEventListener('DOMContentLoaded', start);

/**
 * Initialise the application.
 */
function start() {
    setupCategoryFilter();
    setupCheckoutModal();

    renderEquipmentList();
    renderActiveLoans();
}

/**
 * GT-102: Generate category options using equipment data.
 */
async function setupCategoryFilter() {
    const select = document.getElementById('category-select');
    const equipment = await dataService.getEquipment();

    const categories = [...new Set(
        equipment.map(item => item.category)
    )].sort();

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;

        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        renderEquipmentList();
    });
}

/**
 * GT-101 / GT-102: Render equipment cards,
 * applying the selected category filter.
 */
async function renderEquipmentList() {
    const container = document.getElementById('equipment-list');
    const select = document.getElementById('category-select');

    const items = await dataService.getEquipment();
    const selectedCategory = select.value;

    const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter(item => item.category === selectedCategory);

    container.replaceChildren();

    if (filteredItems.length === 0) {
        const message = document.createElement('li');
        message.textContent = 'No equipment found in this category.';
        container.appendChild(message);
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement('li');
        card.classList.add('equipment-card');

        const heading = document.createElement('h3');
        heading.textContent = item.name;

        const category = document.createElement('span');
        category.classList.add('badge');
        category.textContent = item.category;

        const status = document.createElement('p');
        status.textContent = `Status: ${item.status}`;

        card.append(heading, category, status);

        if (item.status === 'available') {
            card.classList.add('status-available');

            const checkoutButton = document.createElement('button');
            checkoutButton.type = 'button';
            checkoutButton.classList.add('btn');
            checkoutButton.textContent = 'Checkout';

            checkoutButton.addEventListener('click', () => {
                openCheckoutModal(item);
            });

            card.appendChild(checkoutButton);
        } else {
            card.classList.add('status-loaned');
        }

        container.appendChild(card);
    });
}

/**
 * Render active loan records.
 */
async function renderActiveLoans() {
    const container = document.getElementById('active-loans-list');

    const loans = await dataService.getLoans();
    const equipment = await dataService.getEquipment();

    const activeLoans = loans.filter(loan => loan.status === 'active');

    container.replaceChildren();

    if (activeLoans.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No active loans.';
        container.appendChild(message);
        return;
    }

    activeLoans.forEach(loan => {
        const item = equipment.find(
            equipmentItem => equipmentItem.id === loan.equipmentId
        );

        const card = document.createElement('div');
        card.classList.add('loan-card');
        card.dataset.loanId = loan.id;

        const heading = document.createElement('h4');
        heading.textContent = item ? item.name : 'Unknown Equipment';

        const borrower = document.createElement('p');
        borrower.textContent =
            `Borrower: ${loan.borrowerName} (${loan.borrowerEmail})`;

        const dueDate = document.createElement('p');
        dueDate.textContent = `Due Date: ${loan.dueDate}`;

        card.append(heading, borrower, dueDate);
        container.appendChild(card);
    });
}

/**
 * GT-101: Open the checkout form for selected equipment.
 * @param {Object} item - Selected equipment item.
 */
function openCheckoutModal(item) {
    const modal = document.getElementById('checkout-modal');
    const form = document.getElementById('checkout-form');

    form.reset();

    document.getElementById('equipment-id').value = item.id;

    document.getElementById('checkout-equipment-name').textContent =
        `Equipment: ${item.name}`;

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    document.getElementById('return-date').min = localToday;

    document.getElementById('checkout-error').hidden = true;

    modal.showModal();
}

/**
 * GT-101: Handle checkout form events and submissions.
 */
function setupCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const form = document.getElementById('checkout-form');
    const cancelButton = document.getElementById('cancel-checkout');
    const errorMessage = document.getElementById('checkout-error');
    const submitButton = form.querySelector('button[type="submit"]');

    cancelButton.addEventListener('click', () => {
        modal.close();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const loanData = {
            equipmentId: document.getElementById('equipment-id').value,
            borrowerName: document.getElementById('borrower-name').value.trim(),
            borrowerEmail: document.getElementById('borrower-email').value.trim(),
            dueDate: document.getElementById('return-date').value
        };

        if (!loanData.borrowerName ||
            !loanData.borrowerEmail ||
            !loanData.dueDate) {

            errorMessage.textContent = 'Please complete all fields.';
            errorMessage.hidden = false;
            return;
        }

        submitButton.disabled = true;
        errorMessage.hidden = true;

        try {
            await dataService.saveLoan(loanData);

            modal.close();

            await Promise.all([
                renderEquipmentList(),
                renderActiveLoans()
            ]);

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;

            console.error('Checkout failed:', error);

        } finally {
            submitButton.disabled = false;
        }
    });
}
