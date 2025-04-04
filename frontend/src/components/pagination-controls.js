import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes for prop validation
import styles from '../styles/pagination-controls.module.css'; // We'll create this CSS file next

function PaginationControls({ currentPage, totalPages, onPreviousPage, onNextPage }) {
    // No need to render if there's only one page or less.
    // The parent component (Home) already handles this, but it's good practice
    // for the component itself to be robust. However, we'll keep the check in Home
    // to avoid rendering an empty div.

    return (
        <div className={styles.paginationContainer}>
            <button
                onClick={onPreviousPage}
                disabled={currentPage === 1}
                className={styles.paginationButton}
                aria-label="Go to previous page" // Accessibility improvement
            >
                « Previous
            </button>

            <span className={styles.paginationInfo} aria-live="polite"> {/* Announce changes */}
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={onNextPage}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
                aria-label="Go to next page" // Accessibility improvement
            >
                Next »
            </button>
        </div>
    );
}

// Define prop types for type checking and documentation
PaginationControls.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPreviousPage: PropTypes.func.isRequired,
    onNextPage: PropTypes.func.isRequired,
};

export default PaginationControls;