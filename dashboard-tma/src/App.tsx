import React, { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { LayoutDashboard, Users, Clock, ChevronRight, Activity, Zap, Sparkles, Star, Calendar, Bell, Trash2, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

interface Employee {
    id?: number;
    name: string;
    department?: string;
    startTime: string;
    endTime: string;
    isDop: boolean;
    isDopToday?: boolean;
    dopStartTime?: string | null;
    dopEndTime?: string | null;
    workHours?: string;
    location?: string;
    competencies?: Record<string, string>;
}

const Timeline = ({ shifts, currentMins, showIndicator, onEmployeeClick }: { shifts: Employee[], currentMins: number, showIndicator: boolean, onEmployeeClick: (emp: Employee) => void }) => {
    const [activeEmp, setActiveEmp] = useState<Employee | null>(null);
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

                    return (
                        <div key={i} className="timeline-row-container" style={{ top: `${i * 14}px`, height: '14px', position: 'absolute', width: '100%' }}>
                            <motion.div 
                                className={`timeline-bar ${emp.isDop ? 'dop' : 'regular'}`}
                                style={{ 
                                    left: `${left}%`, 
                                    width: `${width}%`,
                                    position: 'absolute'
                                }}
                                onMouseEnter={() => isDesktop && setActiveEmp(emp)}
                                onMouseLeave={() => isDesktop && setActiveEmp(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEmployeeClick(emp);
                                }}
                                whileTap={{ scale: 0.98 }}
                            />
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

            {/* Глобальный Тултип: Вынесен за пределы контейнеров с трансформацией */}
            <AnimatePresence>
                {activeEmp && (
                    <motion.div 
                        className="timeline-tooltip"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveEmp(null);
                        }}
                    >
                        <div className="tooltip-name">{activeEmp.name}</div>
                        <div className="tooltip-time">{activeEmp.startTime} — {activeEmp.endTime}</div>
                        <div className="tooltip-hint">{isDesktop ? 'Наведите на другой график' : 'Нажмите, чтобы закрыть'}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Глобальный оверлей для закрытия на мобильных */}
            {!isDesktop && activeEmp && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} 
                    onClick={() => setActiveEmp(null)} 
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

const EmployeeProfileModal = ({ emp, onClose }: { emp: Employee, onClose: () => void }) => {
    const systems = [
        "Amadeus", "Ctrip", "Farel API", "FareLogix", "FlyOne API", "GDS Avtra", 
        "GDS Cockpit", "Mixvel [Sirena]", "NDC Aeroflot", "NDC AirArabia", "NDC Ajet", 
        "NDC Emirates", "NDC FlyArystan", "NDC FlyDubai", "NDC FlyNas", "NDC FlyOne", 
        "NDC Pegasus", "NDC S7", "NDC Tais", "NDC Tais UT", "NDC TezJet", 
        "NDC Turkish Airlines", "NDC U6", "Pobeda API", "UAPI", "Альтея", "Сирена", "Сирена-П"
    ];

    return (
        <motion.div 
            className="modal-overlay profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div 
                className="profile-modal"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="profile-header">
                    <div className="profile-avatar">
                        <Users size={32} />
                    </div>
                    <div className="profile-info">
                        <h2>{emp.name}</h2>
                        <span className="profile-dept">{emp.department}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="profile-body">
                    <div className="info-grid">
                        <div className="info-block">
                            <Clock size={16} />
                            <div>
                                <label>График</label>
                                <span>{emp.startTime} — {emp.endTime}</span>
                            </div>
                        </div>
                        {emp.location && (
                            <div className="info-block">
                                <Sparkles size={16} />
                                <div>
                                    <label>Локация</label>
                                    <span>{emp.location}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="competencies-section">
                        <h3>Композиция навыков</h3>
                        <div className="competencies-grid">
                            {systems.map(sys => {
                                const level = emp.competencies?.[sys];
                                const isActive = !!level;
                                return (
                                    <div key={sys} className={`comp-item ${isActive ? 'active' : ''}`}>
                                        <div className="comp-name">{sys}</div>
                                        <div className="comp-level">{level || '-'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const getMskDateOffset = (offsetDays: number) => {
    const now = new Date();
    const mskOffset = 3 * 60 * 60 * 1000;
    const mskDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + mskOffset);
    mskDate.setDate(mskDate.getDate() + offsetDays);
    return mskDate.toISOString().split("T")[0];
};

const getDepartments = (shifts: Employee[]) => {
    const staticDepts = [
        "GDS", "NDC", "VIP", "отели", "работа с поставщиками",
        "МА Супервизия", "Jivo-chat", "Социальный",
        "Специалисты по распределению запросов", "МА АДМИНИСТРАЦИЯ"
    ];
    const foundDepts = Array.from(new Set(shifts.map(s => s.department || "Другое")));
    
    const merged = [...staticDepts];
    foundDepts.forEach(d => {
        if (d && !merged.some(m => m.toLowerCase() === d.toLowerCase())) {
            merged.push(d);
        }
    });
    return merged;
};

const InteractiveHeatmap = ({ 
    allDayShifts, 
    currentMins, 
    showIndicator, 
    onEmployeeClick 
}: { 
    allDayShifts: Employee[], 
    currentMins: number, 
    showIndicator: boolean,
    onEmployeeClick: (emp: Employee) => void
}) => {
    const [selectedCell, setSelectedCell] = useState<{ dept: string, hour: number } | null>(null);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const departments = getDepartments(allDayShifts);
    
    const toMins = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const getCellEmployees = (dept: string, h: number) => {
        const checkMin = h * 60 + 30;
        return allDayShifts.filter(emp => {
            const empDept = (emp.department || "").trim().toLowerCase();
            const target = dept.toLowerCase();
            const isDeptMatch = empDept === target || 
                               (target === 'vip' && empDept === 'вип') || 
                               (target === 'gds' && empDept === 'гдс') ||
                               (target === 'отели' && empDept === 'hotels');
            if (!isDeptMatch) return false;

            const start = toMins(emp.startTime);
            let end = toMins(emp.endTime);
            if (end <= start) {
                end += 1440;
            }
            return checkMin >= start && checkMin < end;
        });
    };

    const getCellColor = (count: number) => {
        if (count === 0) return 'rgba(255, 255, 255, 0.02)';
        if (count === 1) return 'rgba(0, 242, 255, 0.12)';
        if (count === 2) return 'rgba(0, 242, 255, 0.3)';
        if (count === 3) return 'rgba(0, 242, 255, 0.55)';
        return 'rgba(0, 242, 255, 0.8)';
    };

    const currentHour = Math.floor(currentMins / 60) % 24;

    const selectedEmployees = selectedCell 
        ? getCellEmployees(selectedCell.dept, selectedCell.hour)
        : [];

    return (
        <div className="heatmap-container">
            <div className="heatmap-grid-scroll">
                <div className="heatmap-grid">
                    {/* Header Row */}
                    <div className="heatmap-header-cell sticky-col">Отдел</div>
                    {hours.map(h => {
                        const isCurrent = h === currentHour && showIndicator;
                        return (
                            <div key={h} className={`heatmap-header-cell ${isCurrent ? 'current-hour-header' : ''}`}>
                                {h.toString().padStart(2, '0')}
                            </div>
                        );
                    })}

                    {/* Department Rows */}
                    {departments.map((dept, deptIdx) => (
                        <React.Fragment key={deptIdx}>
                            <div className="heatmap-dept-label sticky-col">{dept}</div>
                            {hours.map(h => {
                                const employees = getCellEmployees(dept, h);
                                const count = employees.length;
                                const isCurrent = h === currentHour && showIndicator;
                                const isSelected = selectedCell?.dept === dept && selectedCell?.hour === h;

                                return (
                                    <div 
                                        key={h}
                                        className={`heatmap-cell ${isCurrent ? 'current-hour-cell' : ''} ${isSelected ? 'selected-cell' : ''}`}
                                        style={{ 
                                            backgroundColor: getCellColor(count),
                                            borderColor: isSelected ? '#00f2ff' : 'rgba(255,255,255,0.05)'
                                        }}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedCell(null);
                                            } else {
                                                setSelectedCell({ dept, hour: h });
                                            }
                                        }}
                                    >
                                        {count > 0 && <span className="heatmap-cell-count">{count}</span>}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-legend">
                <span className="legend-label">Сотрудников на линии:</span>
                <div className="legend-items">
                    <div className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }} /> 0</div>
                    <div className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(0, 242, 255, 0.12)' }} /> 1</div>
                    <div className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(0, 242, 255, 0.3)' }} /> 2</div>
                    <div className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(0, 242, 255, 0.55)' }} /> 3</div>
                    <div className="legend-item"><span className="legend-box" style={{ backgroundColor: 'rgba(0, 242, 255, 0.8)' }} /> 4+</div>
                </div>
            </div>

            {/* Selected Cell Details */}
            <AnimatePresence>
                {selectedCell && (
                    <motion.div 
                        className="heatmap-details-panel"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                    >
                        <div className="details-header">
                            <h3>{selectedCell.dept} в {selectedCell.hour.toString().padStart(2, '0')}:00</h3>
                            <button className="details-close" onClick={() => setSelectedCell(null)}>×</button>
                        </div>
                        {selectedEmployees.length === 0 ? (
                            <p className="no-emps-msg">В этот час нет сотрудников на смене</p>
                        ) : (
                            <div className="details-emp-list">
                                {selectedEmployees.map((emp, i) => (
                                    <div 
                                        key={i} 
                                        className="details-emp-item"
                                        onClick={() => onEmployeeClick(emp)}
                                    >
                                        <div className="details-emp-avatar">
                                            {emp.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="details-emp-info">
                                            <div className="details-emp-name-row">
                                                <span className="details-emp-name">{emp.name}</span>
                                                {emp.isDop && <span className="badge-dop">ДОП</span>}
                                            </div>
                                            <span className="details-emp-time">{emp.startTime} — {emp.endTime}</span>
                                        </div>
                                        <ChevronRight size={16} opacity={0.5} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function App() {
    const [activeTab, setActiveTab] = useState<'timeline' | 'heatmap' | 'reminders'>('timeline')
    const [targetDate, setTargetDate] = useState<string>(() => getMskDateOffset(0))
    const [activeDept, setActiveDept] = useState<string | null>(null)
    const [showDops, setShowDops] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [data, setData] = useState<Department[]>([])
    const [allEmployees, setAllEmployees] = useState<Employee[]>([])
    const [allDayShifts, setAllDayShifts] = useState<Employee[]>([])
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [currentMins, setCurrentMins] = useState(0)
    const [loading, setLoading] = useState(true)

    // Reminders state
    const [reminders, setReminders] = useState<any[]>([])
    const [remindersLoading, setRemindersLoading] = useState(false)
    const [ticket, setTicket] = useState('')
    const [remindAt, setRemindAt] = useState('')
    const [targetUser, setTargetUser] = useState('self')
    const [reminderText, setReminderText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isPremiumMode = () => {
        const url = window.location.href;
        const search = window.location.search;
        const hash = window.location.hash;
        return url.includes('view=premium') || search.includes('view=premium') || hash.includes('view=premium');
    }

    const fetchData = async (dateParam?: string) => {
        try {
            const dateToFetch = dateParam || targetDate;
            const resp = await fetch(`https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/telegram-bot?format=json&date=${dateToFetch}`)
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

    const fetchReminders = async () => {
        setRemindersLoading(true);
        try {
            const userId = WebApp.initDataUnsafe?.user?.id || 12345678;
            const resp = await fetch(`https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/telegram-bot?action=get_reminders&chat_id=${userId}`);
            const json = await resp.json();
            if (json.success) {
                setReminders(json.reminders || []);
            }
        } catch (e) {
            console.error("Error fetching reminders:", e);
        } finally {
            setRemindersLoading(false);
        }
    };

    const handleCreateReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reminderText || !remindAt) return;
        setIsSubmitting(true);
        try {
            const userId = WebApp.initDataUnsafe?.user?.id || 12345678;
            const username = WebApp.initDataUnsafe?.user?.username || "Guest";
            const remindAtIso = new Date(remindAt).toISOString();

            const resp = await fetch(`https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/telegram-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_reminder',
                    chat_id: userId,
                    username: username,
                    ticket: ticket || 'none',
                    remind_at: remindAtIso,
                    target_user: targetUser,
                    text: reminderText
                })
            });
            const json = await resp.json();
            if (json.success) {
                setTicket('');
                setRemindAt('');
                setTargetUser('self');
                setReminderText('');
                await fetchReminders();
            } else {
                alert(json.message || "Ошибка создания напоминания");
            }
        } catch (err) {
            console.error("Error creating reminder:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        try {
            const userId = WebApp.initDataUnsafe?.user?.id || 12345678;
            const resp = await fetch(`https://pkpvsdqvpqpqvlneevud.supabase.co/functions/v1/telegram-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_reminder',
                    chat_id: userId,
                    id: id
                })
            });
            const json = await resp.json();
            if (json.success) {
                await fetchReminders();
            } else {
                alert(json.message || "Ошибка удаления");
            }
        } catch (err) {
            console.error("Error deleting reminder:", err);
        }
    };

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
    }, [])

    useEffect(() => {
        fetchData(targetDate)

        const interval = setInterval(() => {
            fetchData(targetDate)
        }, 30000)
        return () => clearInterval(interval)
    }, [targetDate])

    useEffect(() => {
        if (activeTab === 'reminders') {
            fetchReminders();
        }
    }, [activeTab])

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

                {/* Date Picker Bar */}
                <div className="date-picker-bar">
                    <button 
                        className={`date-picker-btn ${targetDate === getMskDateOffset(-1) ? 'active' : ''}`}
                        onClick={() => setTargetDate(getMskDateOffset(-1))}
                    >
                        Вчера
                    </button>
                    <button 
                        className={`date-picker-btn ${targetDate === getMskDateOffset(0) ? 'active' : ''}`}
                        onClick={() => setTargetDate(getMskDateOffset(0))}
                    >
                        Сегодня
                    </button>
                    <button 
                        className={`date-picker-btn ${targetDate === getMskDateOffset(1) ? 'active' : ''}`}
                        onClick={() => setTargetDate(getMskDateOffset(1))}
                    >
                        Завтра
                    </button>
                </div>

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
                    <span>
                        {targetDate === getMskDateOffset(0) ? 'В эфире' : 'Архив'} • {targetDate} • {analytics?.mskTimeStr} MSK
                    </span>
                </div>

                {/* View/Tab Switcher */}
                <div className="tab-switcher-bar">
                    <button 
                        className={`tab-switcher-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('timeline')}
                    >
                        <Clock size={16} />
                        <span>Таймлайн</span>
                    </button>
                    <button 
                        className={`tab-switcher-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
                        onClick={() => setActiveTab('heatmap')}
                    >
                        <Calendar size={16} />
                        <span>Теплокарта</span>
                    </button>
                    <button 
                        className={`tab-switcher-btn ${activeTab === 'reminders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reminders')}
                    >
                        <Bell size={16} />
                        <span>Напоминания</span>
                    </button>
                </div>
            </header>

            {activeTab === 'timeline' ? (
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
                                    showIndicator={targetDate === getMskDateOffset(0)}
                                    onEmployeeClick={(emp) => {
                                        const fullEmp = allEmployees.find(e => e.name === emp.name) || emp;
                                        setSelectedEmployee(fullEmp);
                                    }}
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
                                                    onTap={() => setSelectedEmployee(emp)}
                                                    onClick={() => setSelectedEmployee(emp)}
                                                    style={{ cursor: 'pointer' }}
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
            ) : activeTab === 'heatmap' ? (
                <main className="heatmap-main">
                    <InteractiveHeatmap 
                        allDayShifts={allDayShifts}
                        currentMins={currentMins}
                        showIndicator={targetDate === getMskDateOffset(0)}
                        onEmployeeClick={(emp) => {
                            const fullEmp = allEmployees.find(e => e.name === emp.name) || emp;
                            setSelectedEmployee(fullEmp);
                        }}
                    />
                </main>
            ) : (
                <main className="reminders-main">
                    <div className="reminders-container">
                        <div className="reminder-form-card">
                            <h3 className="form-title">
                                <Plus size={18} />
                                <span>Новое напоминание</span>
                            </h3>
                            <form onSubmit={handleCreateReminder} className="reminder-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="ticket">Тикет (номер или none)</label>
                                        <input 
                                            id="ticket"
                                            type="text" 
                                            placeholder="например: 12345" 
                                            value={ticket}
                                            onChange={(e) => setTicket(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="targetUser">Кому</label>
                                        <input 
                                            id="targetUser"
                                            type="text" 
                                            placeholder="self или Фамилия" 
                                            value={targetUser}
                                            onChange={(e) => setTargetUser(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="remindAt">Когда напомнить</label>
                                        <input 
                                            id="remindAt"
                                            type="datetime-local" 
                                            value={remindAt}
                                            onChange={(e) => setRemindAt(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reminderText">Текст напоминания</label>
                                    <textarea 
                                        id="reminderText"
                                        placeholder="Что нужно не забыть?" 
                                        value={reminderText}
                                        onChange={(e) => setReminderText(e.target.value)}
                                        required
                                        rows={2}
                                    />
                                </div>

                                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Сохранение...' : 'Создать напоминание'}
                                </button>
                            </form>
                        </div>

                        <div className="reminders-list-section">
                            <h3 className="section-title">
                                <Bell size={18} />
                                <span>Активные напоминания</span>
                            </h3>
                            
                            {remindersLoading ? (
                                <div className="reminders-loading">
                                    <Activity className="pulse" size={24} />
                                    <p>Загрузка напоминаний...</p>
                                </div>
                            ) : reminders.length === 0 ? (
                                <div className="no-reminders">
                                    <p>Нет активных напоминаний</p>
                                    <span>Вы можете создать напоминание через форму выше или в чате с ботом фразой на естественном языке.</span>
                                </div>
                            ) : (
                                <div className="reminders-grid">
                                    {reminders.map((r: any) => {
                                        const remindDate = new Date(r.remind_at);
                                        const timeStr = remindDate.toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit', timeZone: "Europe/Moscow" });
                                        const dateStr = remindDate.toLocaleDateString("ru-RU", { day: '2-digit', month: '2-digit', timeZone: "Europe/Moscow" });
                                        
                                        return (
                                            <div key={r.id} className="reminder-card">
                                                <div className="reminder-card-header">
                                                    <span className="reminder-ticket">
                                                        {r.ticket_number && r.ticket_number !== 'none' ? `Тикет #${r.ticket_number}` : 'Общее напоминание'}
                                                    </span>
                                                    <button 
                                                        className="delete-reminder-btn"
                                                        onClick={() => handleDeleteReminder(r.id)}
                                                        title="Удалить"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <p className="reminder-text">{r.reminder_text}</p>
                                                <div className="reminder-meta">
                                                    <span className="reminder-time">📅 {dateStr} в {timeStr} MSK</span>
                                                    <span className="reminder-target">👤 Кому: {r.target_username || 'self'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            )}

            <AnimatePresence>
                {selectedEmployee && (
                    <EmployeeProfileModal 
                        emp={selectedEmployee} 
                        onClose={() => setSelectedEmployee(null)} 
                    />
                )}

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
                                                onClick={() => setSelectedEmployee(emp)}
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
                <p>Antigravity Swarm • v3.1.8-ACCESSIBILITY</p>
                <p style={{ fontSize: '0.6rem', opacity: 0.3 }}>Build: {new Date().toLocaleString('ru-RU')} | Ref: {window.location.href.split('?')[1] || 'no-query'}</p>
            </footer>
        </div>
    );
}

export default App;
