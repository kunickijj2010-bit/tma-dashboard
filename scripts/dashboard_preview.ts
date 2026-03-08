// scripts/dashboard_preview.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PORT = 8080;

const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dashboard Preview</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <style>
        body {
            background: #050510;
            color: white;
            font-family: 'Helvetica', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-image: url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1000&q=80');
            background-size: cover;
        }
        .container {
            width: 800px;
            height: 600px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <canvas id="dashboardChart"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('dashboardChart').getContext('2d');
        Chart.register(ChartDataLabels);

        const labels = ["GDS", "NDC", "VIP", "отели", "Поставщики", "МА Супервизия", "Jivo-chat", "Социальный", "Распределение", "МА АДМИНИСТРАЦИЯ"];
        const counts = [5, 3, 2, 0, 0, 1, 0, 0, 0, 0];
        const empStrings = ["Ivanov (18:00), Petrov (19:00)", "Sidorov (20:00)", "Alekseev (21:00)", "—", "—", "Sergeev (10:00)", "—", "—", "—", "—"];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        data: counts,
                        backgroundColor: counts.map(c => c > 0 ? 'rgba(0, 255, 204, 0.8)' : 'rgba(255, 51, 102, 0.1)'),
                        borderColor: counts.map(c => c > 0 ? '#00ffcc' : 'rgba(255, 51, 102, 0.2)'),
                        borderWidth: 2,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    },
                    {
                        data: labels.map(() => Math.max(...counts, 5)),
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        barPercentage: 0.9,
                        categoryPercentage: 0.8,
                        datalabels: { display: false }
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'LIVE STATUS • 00:15 MSK',
                        color: '#ffffff',
                        font: { size: 26, weight: 'bold' },
                        padding: { bottom: 30 }
                    },
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        color: '#ffffff',
                        font: { weight: 'bold', size: 14 },
                        anchor: 'start',
                        align: 'right',
                        offset: 10,
                        formatter: (value, context) => {
                            const count = counts[context.dataIndex];
                            const employees = empStrings[context.dataIndex];
                            if (count === 0) return 'OFFLINE';
                            return count + ' | ' + employees;
                        }
                    }
                },
                scales: {
                    x: { display: false, stacked: false, min: 0 },
                    y: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: '#ffffff', font: { size: 14, weight: 'bold' } }
                    }
                }
            }
        });
    </script>
</body>
</html>
`;

console.log(`Preview server running at http://localhost:${PORT}`);
serve(() => new Response(html, { headers: { "content-type": "text/html" } }), { port: PORT });
