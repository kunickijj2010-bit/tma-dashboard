// scripts/test_ui_locally.ts
// Test script for verifying QuickChart URL generation logic from index.ts

const generateMockDashboard = () => {
    const mskTimeStr = "00:15";
    const deptCounts: Record<string, number> = {
        "GDS": 5,
        "NDC": 3,
        "VIP": 2,
        "отели": 0,
        "работа с поставщиками": 0,
        "МА Супервизия": 1,
        "Jivo-chat": 0,
        "Социальный": 0,
        "Специалисты по распределению запросов": 0,
        "МА АДМИНИСТРАЦИЯ": 0
    };

    const targetDepts = [
        "GDS", "NDC", "VIP", "отели", "работа с поставщиками",
        "МА Супервизия", "Jivo-chat", "Социальный",
        "Специалисты по распределению запросов", "МА АДМИНИСТРАЦИЯ"
    ];

    const counts = targetDepts.map(d => deptCounts[d] || 0);
    const labels = targetDepts.map(d => {
        if (d === "Специалисты по распределению запросов") return "Распределение";
        if (d === "работа с поставщиками") return "Поставщики";
        return d;
    });

    const empStrings = targetDepts.map(d => {
        if (deptCounts[d] > 0) return "Emp A (09:00), Emp B (18:00)";
        return "—";
    });

    const chartConfig = {
        type: 'horizontalBar',
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
            title: {
                display: true,
                text: `LIVE STATUS • ${mskTimeStr} MSK`,
                fontColor: '#ffffff', fontSize: 26, padding: 30, fontStyle: 'bold', fontFamily: 'Helvetica'
            },
            legend: { display: false },
            plugins: {
                backgroundImageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1000&q=80',
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: { family: 'Helvetica', weight: 'bold', size: 14 },
                    anchor: 'start',
                    align: 'right',
                    offset: 5,
                    formatter: `(value, context) => {
            const counts = [${counts.join(',')}];
            const empStrings = ${JSON.stringify(empStrings)};
            const count = counts[context.dataIndex];
            const employees = empStrings[context.dataIndex];
            if (count === 0) return 'OFFLINE';
            return count + ' | ' + employees;
          }`
                }
            },
            scales: {
                xAxes: [{
                    stacked: false, display: false, ticks: { min: 0 }
                }],
                yAxes: [{
                    stacked: true,
                    ticks: { fontColor: '#ffffff', fontSize: 14, fontStyle: 'bold', padding: 20 },
                    gridLines: { display: false }
                }]
            }
        }
    };

    const finalUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=800&h=600&bkg=%23050510`;
    return finalUrl;
};

const url = generateMockDashboard();
console.log("Mock Dashboard URL:");
console.log(url);
