
/**
 * Storage keys used in localStorage for this application.
 * @readonly
 * @enum {string}
 */
const STORAGE_KEYS = {
    EQUIPMENT: 'geartrack_equipment',
    LOANS: 'geartrack_loans'
};

/**
 * @typedef {Object} Equipment
 * @property {string} id - Unique equipment identifier.
 * @property {string} name - Human-readable equipment name.
 * @property {string} category - Equipment category.
 * @property {'available'|'loaned'} status - Equipment availability.
 */

/**
 * @typedef {Object} Loan
 * @property {string} id - Unique loan identifier.
 * @property {string} equipmentId - ID of the loaned equipment.
 * @property {string} borrowerName - Borrower's name.
 * @property {string} borrowerEmail - Borrower's email address.
 * @property {string} dueDate - Return due date.
 * @property {'active'|'returned'} status - Current loan status.
 */

/**
 * @typedef {Object} NewLoanData
 * @property {string} equipmentId - Equipment being loaned.
 * @property {string} borrowerName - Borrower's name.
 * @property {string} borrowerEmail - Borrower's email.
 * @property {string} dueDate - Expected return date.
 */

/**
 * Initial equipment data.
 * @type {Equipment[]}
 */
const initialEquipment = [
    {
        id: 'EQ-101',
        name: 'Canon EOS R6',
        category: 'Cameras',
        status: 'available'
    },
    {
        id: 'EQ-102',
        name: 'Sony FX3',
        category: 'Cameras',
        status: 'loaned'
    },
    {
        id: 'EQ-103',
        name: 'Manfrotto Tripod',
        category: 'Accessories',
        status: 'available'
    },
    {
        id: 'EQ-104',
        name: 'MacBook Pro 16"',
        category: 'Laptops',
        status: 'available'
    }
];

/**
 * Initial loan data.
 * @type {Loan[]}
 */
const initialLoans = [
    {
        id: 'LN-501',
        equipmentId: 'EQ-102',
        borrowerName: 'Alex Root',
        borrowerEmail: 'alexroot@college.ac.uk',
        dueDate: '2026-08-15',
        status: 'active'
    }
];

/**
 * Seed localStorage with initial data if none exists.
 */
function seedInitialData() {
    if (!localStorage.getItem(STORAGE_KEYS.EQUIPMENT)) {
        localStorage.setItem(
            STORAGE_KEYS.EQUIPMENT,
            JSON.stringify(initialEquipment)
        );
    }

    if (!localStorage.getItem(STORAGE_KEYS.LOANS)) {
        localStorage.setItem(
            STORAGE_KEYS.LOANS,
            JSON.stringify(initialLoans)
        );
    }
}

seedInitialData();

/**
 * Data access service.
 * All storage operations are handled here.
 */
export const dataService = {

    /**
     * Retrieve all equipment records.
     * @returns {Promise<Equipment[]>}
     */
    async getEquipment() {
        const data = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
        return JSON.parse(data) || [];
    },

    /**
     * Retrieve all loan records.
     * @returns {Promise<Loan[]>}
     */
    async getLoans() {
        const data = localStorage.getItem(STORAGE_KEYS.LOANS);
        return JSON.parse(data) || [];
    },

    /**
     * GT-101: Save a new equipment loan.
     *
     * Checks equipment availability before creating the loan.
     * Generates a unique loan ID and updates equipment status.
     *
     * @param {NewLoanData} loanData
     * @returns {Promise<Loan>}
     */
    async saveLoan(loanData) {
        const equipment = await this.getEquipment();

        const item = equipment.find(
            equipmentItem => equipmentItem.id === loanData.equipmentId
        );

        if (!item) {
            throw new Error('Equipment could not be found.');
        }

        if (item.status !== 'available') {
            throw new Error('This equipment is already loaned.');
        }

        const loans = await this.getLoans();

        const newLoan = {
            ...loanData,
            id: `LN-${crypto.randomUUID()}`,
            status: 'active'
        };

        loans.push(newLoan);

        item.status = 'loaned';

        localStorage.setItem(
            STORAGE_KEYS.LOANS,
            JSON.stringify(loans)
        );

        localStorage.setItem(
            STORAGE_KEYS.EQUIPMENT,
            JSON.stringify(equipment)
        );

        return newLoan;
    }
};