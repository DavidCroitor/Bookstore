import { useState } from 'react';
import styles from '../styles/book-form.module.css';

export default function BookEditForm({ book, onEditBook, onCancel, onDelete, submitButtonLabel, deleteButtonLabel }) {
    const [form, setForm] = useState({ id: book.id, ...book });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };


    const validateForm = () => {
        if (form.title.length < 2 || form.title.length > 200) {
            alert('Title must be between 2 and 200 characters.');
            return false;
        }

        if(!isNaN(form.author)){
            alert('Author name cannot be a number');
            return false;
        }

        if (form.author.length < 2 || form.author.length > 100) {
            alert('Author name must be between 2 and 100 characters.');
            return false;
        }

        if(!isNaN(form.genre)){
            alert('Genre name cannot be a number');
            return false;
        }

        if (form.genre.length < 3 || form.genre.length > 50) {
            alert('Genre must be between 3 and 50 characters.');
            return false;
        }

        if (form.price) {
            const price = parseFloat(form.price);
            if (isNaN(price) || price <= 0) {
                alert('Price must be a positive number.');
                return false;
            }
        }
        if (form.rating) {
            const rating = parseFloat(form.rating);
            if (isNaN(rating) || rating < 0 || rating > 5) {
                alert('Rating must be a number between 0 and 5.');
                return false;
            }
        }

        return true;
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.id) {
            console.error('Missing book ID in form data', form);
            alert('Error: Book ID is missing. Cannot update book.');
            return;
        }

        if (validateForm()) {
            onEditBook(form); 
        }
    };


    return (
        <form onSubmit={handleSubmit} className={styles.container}>
            <div className={styles.inputGroup}>
                <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Book Title"
                    className={styles.input}
                    required
                />
                <input
                    name="author"
                    value={form.author.name}
                    onChange={handleChange}
                    placeholder="Author"
                    className={styles.input}
                    required
                />
                <input
                    name="genre"
                    value={form.genre.name}
                    onChange={handleChange}
                    placeholder="Genre"
                    className={styles.input}
                    required
                />
                <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Price"
                    className={styles.input}
                    required
                />
            </div>

            <div className={styles.buttonGroup}>
                <button 
                type="submit" 
                className={styles.addButton}>{submitButtonLabel}</button>
                <button 
                type="button" 
                className={styles.cancelButton} 
                onClick={onCancel}>Cancel</button>
                <button 
                type="button" 
                className={styles.deleteButton} 
                onClick={onDelete}>{deleteButtonLabel}</button>
            </div>
        </form>
    );
}
