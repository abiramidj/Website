import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getAdminStats, getAdminStudents } from '../../lib/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import styles from './AdminDashboard.module.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function KpiCard({ label, value, icon, iconBg }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIconWrap} style={{ background: iconBg || '#eff6ff' }}>{icon}</div>
      <div className={styles.kpiValue}>{value ?? '—'}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsData, studentsData] = await Promise.all([
          getAdminStats(getToken),
          getAdminStudents(getToken),
        ]);
        setStats(statsData);
        setStudents(studentsData.students || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading admin dashboard…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Platform overview and analytics</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {stats && (
          <>
            {/* KPI Cards */}
            <div className={styles.kpiRow}>
              <KpiCard label="Total Students" value={stats.totalStudents ?? 0} icon="👥" iconBg="#eef2ff" />
              <KpiCard label="Approved Questions" value={stats.totalApprovedQuestions ?? 0} icon="✅" iconBg="#ecfdf5" />
              <KpiCard label="Total Attempts" value={stats.totalAttempts ?? 0} icon="📝" iconBg="#fffbeb" />
              <KpiCard label="Pending Review" value={stats.pendingQuestions ?? 0} icon="⏳" iconBg="#eff6ff" />
            </div>

            {/* Bar Chart */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Average Score by Topic</h2>
              <div className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={stats.topicStats || []}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="topic"
                      tick={{ fontSize: 13, fill: '#6b7280' }}
                      tickFormatter={t => t.length > 14 ? t.slice(0, 14) + '…' : t}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Avg Score']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="avgScore" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent Attempts */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Attempts</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Topic</th>
                      <th>Score</th>
                      <th>Correct</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentAttempts || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>No attempts yet.</td>
                      </tr>
                    ) : (
                      (stats.recentAttempts || []).map(a => (
                        <tr key={a.id}>
                          <td className={styles.idCell}>
                            {String(a.student_id).slice(0, 8)}…
                          </td>
                          <td>{a.topic}</td>
                          <td>
                            <span className={`${styles.scoreBadge} ${
                              a.score >= 80 ? styles.scoreGreen :
                              a.score >= 60 ? styles.scoreYellow : styles.scoreRed
                            }`}>
                              {a.score?.toFixed(1)}%
                            </span>
                          </td>
                          <td>{a.correct}/{a.total}</td>
                          <td>{formatDate(a.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Students Table */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Student Roster</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Attempts</th>
                  <th>Avg Score</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>No students yet.</td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.user_id}>
                      <td className={styles.nameCell}>{s.full_name || '—'}</td>
                      <td className={styles.idCell}>
                        {String(s.user_id).slice(0, 8)}…
                      </td>
                      <td>{s.attemptCount}</td>
                      <td>
                        {s.attemptCount > 0 ? (
                          <span className={`${styles.scoreBadge} ${
                            s.avgScore >= 80 ? styles.scoreGreen :
                            s.avgScore >= 60 ? styles.scoreYellow : styles.scoreRed
                          }`}>
                            {s.avgScore.toFixed(1)}%
                          </span>
                        ) : (
                          <span className={styles.naText}>—</span>
                        )}
                      </td>
                      <td>{formatDate(s.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
