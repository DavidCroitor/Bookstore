import React, {useEffect, useState} from "react";
import GenreDistributionChart from "@/components/genre-distribution-chart";
import PriceDistributionChart from "@/components/price-distribution-chart";
import AveragePricePerGenreChart from "@/components/average-price-per-genre";
import BookStatsDisplay from "@/components/book-stats-display";

export default function Statistics(){
        return (
            <div>
                <h1>Bookstore Dashboard</h1>
                <BookStatsDisplay />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
                 {/* Arrange charts as needed */}
                 <GenreDistributionChart />
                 <AveragePricePerGenreChart />
            </div>

            <div style={{ marginTop: '30px' }}>
                <PriceDistributionChart />
            </div>
            </div>
        );
}