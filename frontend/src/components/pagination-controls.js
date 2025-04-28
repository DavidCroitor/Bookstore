import React from 'react';
import PropTypes from 'prop-types'; 
import styles from '../styles/pagination-controls.module.css';

function PaginationControls({ currentPage, totalPages, onPreviousPage, onNextPage }) {

    return (
        <div className={styles.paginationContainer}>
            <button
                onClick={onPreviousPage}
                disabled={currentPage === 1}
                className={styles.paginationButton}
                aria-label="Go to previous page" 
            >
                « Previous
            </button>

            <span className={styles.paginationInfo} aria-live="polite">
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={onNextPage}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
                aria-label="Go to next page" 
            >
                Next »
            </button>
        </div>
    );
}

PaginationControls.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPreviousPage: PropTypes.func.isRequired,
    onNextPage: PropTypes.func.isRequired,
};

export default PaginationControls;