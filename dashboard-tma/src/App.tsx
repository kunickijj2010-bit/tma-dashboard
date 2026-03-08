import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { LayoutDashboard, Users, Clock, ChevronRight, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

interface Employee {
    name: string
    startTime: string
    endTime: string
    isDop: boolean
    department?: string
}

interface Department {
    id: string
    name: string
    onlineCount: number
    totalCapacity: number
    employees: Employee[]
}

interface Analytics {
    totalOnline: number
    totalDops: number
    mskTimeStr: string
}

function App() {
    const [activeDept, setActiveDept] = useState<string | null>(null)
    const [data, setData] = useState<Department[]>([])
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            const resp = await fetch('https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/telegram-bot?format=json')
            const json = await resp.json()

            if (json.departments) {
                setData(json.departments)
                setAnalytics({
                    totalOnline: json.totalOnline,
                    totalDops: json.totalDops,
                    mskTimeStr: json.mskTimeStr
                })
            }
        } catch (e) {
            console.error('Fetch error:', e)
        } finally {
            setLoading(false)
        }
    }

    const getTimeRemaining = (endTimeStr: string) => {
        const [hours, minutes] = endTimeStr.split(':').map(Number);
        const now = new Date();
        const mskOffset = 3 * 60 * 60 * 1000;
        const mskDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + mskOffset);

        let end = new Date(mskDate);
        end.setHours(hours, minutes, 0, 0);

        if (end < mskDate) {
            end.setDate(end.getDate() + 1);
        }

        const diffMs = end.getTime() - mskDate.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs === 0) return `${diffMins}м`;
        return `${diffHrs}ч ${diffMins}м`;
    }

    useEffect(() => {
        WebApp.ready()
        WebApp.expand()
        fetchData()

        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="loading-screen">
                <Activity className="pulse" size={40} />
                <p>Loading Dashboard...</p>
            </div>
        )
    }

    return (
        <div className="app-container">
            <header className="header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="header-content"
                >
                    <LayoutDashboard className="icon-main" />
                    <h1>Live Ops Dashboard</h1>
                </motion.div>

                <div className="stats-container">
                    <motion.div layout className="stat-item">
                        <span className="stat-value">{analytics?.totalOnline || 0}</span>
                        <span className="stat-label">На смене</span>
                    </motion.div>
                    <motion.div layout className="stat-item dops">
                        <span className="stat-value">{analytics?.totalDops || 0}</span>
                        <span className="stat-label">Допы</span>
                    </motion.div>
                </div>

                <div className="status-bar">
                    <Activity size={14} className="pulse" />
                    <span>Real-time • {analytics?.mskTimeStr} MSK</span>
                </div>
            </header>

            <main className="dashboard-grid">
                {(data || []).map((dept) => (
                    <motion.div
                        key={dept.id}
                        layout
                        className={`dept-card ${activeDept === dept.id ? 'active' : ''} ${dept.onlineCount === 0 ? 'offline' : ''}`}
                        onClick={() => setActiveDept(activeDept === dept.id ? null : dept.id)}
                    >
                        <div className="card-top">
                            <div className="dept-info">
                                <span className="dept-label">{dept.name}</span>
                                <div className="count-section">
                                    <span className="count-number">{dept.onlineCount === 0 ? 'OFFLINE' : dept.onlineCount}</span>
                                    {dept.onlineCount > 0 && <span className="capacity">/ {dept.totalCapacity}</span>}
                                </div>
                            </div>
                            <ChevronRight className={`arrow ${activeDept === dept.id ? 'rotated' : ''}`} />
                        </div>

                        <div className="progress-container">
                            <motion.div
                                className="progress-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((dept.onlineCount / dept.totalCapacity) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>

                        <AnimatePresence>
                            {activeDept === dept.id && (dept.employees || []).length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="employee-details"
                                >
                                    <div className="divider" />
                                    <ul className="employee-list">
                                        {(dept.employees || []).map((emp, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="employee-item"
                                            >
                                                <div className="emp-avatar">
                                                    {emp.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="emp-meta">
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span className="emp-name">{emp.name}</span>
                                                        {emp.isDop && <span className="badge-dop">ДОП</span>}
                                                    </div>
                                                    <div className="emp-time">
                                                        <div className="time-box">
                                                            <Clock size={12} />
                                                            <span>{emp.startTime} - {emp.endTime}</span>
                                                        </div>
                                                        <span className="time-remaining">
                                                            осталось: {getTimeRemaining(emp.endTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </main>

            <footer className="footer">
                <p>Antigravity Swarm • Premium TMA</p>
            </footer>
        </div>
    )
}

export default App
