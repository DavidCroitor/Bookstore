import React, {useEffect, useState} from "react";
import GenreDistributionChart from "@/components/genre-distribution-chart";
import PriceDistributionChart from "@/components/price-distribution-chart";
import AveragePricePerGenreChart from "@/components/average-price-per-genre";
import BookStatsDisplay from "@/components/book-stats-display";
import styles from '../styles/statistics.module.css';

export default function StatisticsPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Bookstore Statistics</h1>
            <BookStatsDisplay />
            
            <div className={styles.chartWrapper}>
                <GenreDistributionChart />
            </div>
            
            <div className={styles.chartWrapper}>
                <AveragePricePerGenreChart />
            </div>
            
            <div className={styles.chartWrapper}>
                <PriceDistributionChart />
            </div>
        </div>
    );
}