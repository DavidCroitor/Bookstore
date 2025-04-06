import { useDebugValue, useState } from 'react';
import styles from '../styles/book-form.module.css';

export default function BookForm({ onAddBook, sumbitButtonLabel }) {
    const [form, setForm] = useState({ title: '', author: '', genre: '', price:''});
    const [error, setError] = useState({});


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

        return true;
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onAddBook(form);  // Handle adding book
            
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
                value={form.author}
                onChange={handleChange}
                placeholder="Author"
                className={styles.input}
                required
            />
            <input
                name="genre"
                value={form.genre}
                onChange={handleChange}
                placeholder="Genre"
                className={styles.input}
                required
                />
            <input
                name="price"
                vale={form.price}
                onChange={handleChange}
                placeholder="price"
                className={styles.input}
                required
            />
            
            </div>
            

            <button type="submit" className={styles.addButton }>
                {sumbitButtonLabel}
            </button>
        </form>
    );
}
