import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { LayoutDashboard, Users, Clock, ChevronRight, Activity, Zap, Sparkles, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

interface Employee {
    name: string;
    startTime: string;
    endTime: string;
    isDop: boolean;
    isDopToday?: boolean;
    department?: string;
    dopStartTime?: string | null;
    dopEndTime?: string | null;
}

const Timeline = ({ shifts, currentMins, showIndicator }: { shifts: Employee[], currentMins: number, showIndicator: boolean }) => {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isDesktop = typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : true;
    
    const toMins = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const containerHeight = Math.max(40, shifts.length * 14 + 10);

    return (
        <div className="timeline-wrapper">
            <div className="timeline-grid">
                {hours.map(h => (
                    <div key={h} className="timeline-hour-mark">
                        <span>{h}</span>
                    </div>
                ))}
            </div>
            <div className="timeline-bars-container" style={{ height: `${containerHeight}px` }}>
                {shifts.map((emp, i) => {
                    const start = toMins(emp.startTime);
                    let end = toMins(emp.endTime);
                    if (end <= start) end += 1440; 

                    const left = (start / 1440) * 100;
                    const width = ((end - start) / 1440) * 100;
                    const barId = `${emp.name}-${i}`;

                    return (
                        <div key={i} className="timeline-row-container" style={{ top: `${i * 14}px`, height: '14px', position: 'absolute', width: '100%' }}>
                            <motion.div 
                                className={`timeline-bar ${emp.isDop ? 'dop' : 'regular'}`}
                                style={{ 
                                    left: `${left}%`, 
                                    width: `${width}%`,
                                    position: 'absolute'
                                }}
                                onMouseEnter={() => isDesktop && setActiveTooltip(barId)}
                                onMouseLeave={() => isDesktop && setActiveTooltip(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(activeTooltip === barId ? null : barId);
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <AnimatePresence>
                                    {activeTooltip === barId && (
                                        <motion.div 
                                            className="timeline-tooltip"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={(e) => !isDesktop && (e.stopPropagation(), setActiveTooltip(null))}
                                        >
                                            <span className="tooltip-name">{emp.name}</span>
                                            <span className="tooltip-time">{emp.startTime} — {emp.endTime}</span>
                                            {!isDesktop && <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '8px' }}>Нажмите, чтобы закрыть</div>}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    );
                })}
                {/* Current Time Indicator */}
                {showIndicator && (
                    <div 
                        className="timeline-now-indicator"
                        style={{ left: `${(currentMins / 1440) * 100}%` }}
                    />
                )}
            </div>
            {/* Глобальный оверлей для закрытия тултипа на мобильных */}
            {!isDesktop && activeTooltip && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} 
                    onClick={() => setActiveTooltip(null)} 
                />
            )}
        </div>
    );
};

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
    const [showDops, setShowDops] = useState(false)
    const [data, setData] = useState<Department[]>([])
    const [allEmployees, setAllEmployees] = useState<Employee[]>([])
    const [allDayShifts, setAllDayShifts] = useState<Employee[]>([])
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [currentMins, setCurrentMins] = useState(0)
    const [loading, setLoading] = useState(true)

    const isPremiumMode = () => {
        const url = window.location.href;
        const search = window.location.search;
        const hash = window.location.hash;
        return url.includes('view=premium') || search.includes('view=premium') || hash.includes('view=premium');
    }

    const fetchData = async () => {
        try {
            const resp = await fetch('https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/telegram-bot?format=json')
            const json = await resp.json()

            if (json.departments) {
                setData(json.departments)
                setAllEmployees(json.onlineNow || [])
                setAllDayShifts(json.allDayShifts || [])
                
                // Calculate current MSK minutes for the timeline indicator
                const [h, m] = (json.mskTimeStr || "00:00").split(':').map(Number);
                setCurrentMins(h * 60 + m);

                setAnalytics({
                    totalOnline: json.totalOnline,
                    totalDops: json.totalDops,
                    mskTimeStr: json.mskTimeStr
                })
                
                // Debug log for view param
                console.log('App Loaded. View Search:', new URLSearchParams(window.location.search).get('view'));
                console.log('App Loaded. View Hash:', new URLSearchParams(window.location.hash.split('?')[1]).get('view'));
                console.log('Is Premium Mode:', isPremiumMode());
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

    const dopsList = allEmployees.filter(e => e.isDopToday);

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
                    <motion.div
                        layout
                        className="stat-item dops clickable"
                        style={{ cursor: 'pointer', zIndex: 100, position: 'relative', pointerEvents: 'auto' }}
                        onTap={() => {
                            console.log('Dops Tapped');
                            setShowDops(true);
                        }}
                        onClick={(e) => {
                            console.log('Dops Clicked');
                            e.stopPropagation();
                            setShowDops(true);
                        }}
                    >
                        <Zap className="stat-icon-mini" size={14} />
                        <span className="stat-value">{analytics?.totalDops || 0}</span>
                        <span className="stat-label">Допы</span>
                        <div className="click-hint">нажми для деталей</div>
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

                        {!isPremiumMode() && (
                            <Timeline 
                                shifts={allDayShifts.filter(s => s.department === dept.name)} 
                                currentMins={currentMins}
                                showIndicator={true}
                            />
                        )}

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

            <AnimatePresence>
                {showDops && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDops(false)}
                    >
                             <motion.div
                                className="modal-content"
                                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                            <div className="modal-header">
                                <Sparkles size={20} color="#00f2ff" />
                                <h2>Дополнительные смены</h2>
                                <button className="close-btn" onClick={() => setShowDops(false)}>×</button>
                            </div>

                            <div className="dops-list">
                                {dopsList.length === 0 ? (
                                    <div className="no-data">
                                        <Star size={40} opacity={0.2} />
                                        <p>Сегодня нет доп. смен</p>
                                    </div>
                                ) : (
                                    <div className="dops-card-list">
                                        {dopsList.map((emp, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="dops-card"
                                            >
                                                <div className="dops-card-header">
                                                    <span className="dops-card-name">{emp.name}</span>
                                                    <span className="dops-card-dept">{emp.department}</span>
                                                </div>
                                                <div className="dops-card-time">
                                                    <Clock size={16} opacity={0.6} />
                                                    <span>{emp.startTime} — {emp.endTime}</span>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                                                        ({emp.isDop ? 'осталось' : 'через'} {getTimeRemaining(emp.endTime)})
                                                    </span>
                                                </div>
                                                <div className="dops-card-status">
                                                    {emp.isDop ? '⚡ НА ДОП. СМЕНЕ' : '🕒 Будущий доп'}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="footer">
                <p>Antigravity Swarm • v3.1.5-UX</p>
                <p style={{ fontSize: '0.6rem', opacity: 0.3 }}>Build: {new Date().toLocaleString('ru-RU')} | Ref: {window.location.href.split('?')[1] || 'no-query'}</p>
            </footer>
        </div>
    );
}

export default App;
