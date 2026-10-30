import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users
} from 'lucide-react';
import PublicNav, { PublicFooter } from '../components/PublicNav';
import { SecureNote, Spinner, SuccessMark } from '../components/UI';
import { useLanguage, localDepartmentName } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { addDaysISO, todayISO } from '../lib/format';
import { saveToken } from '../lib/savedTokens';
import { FALLBACK_DEPARTMENTS } from '../lib/fallbackDepartments';

const PRIORITIES = [
  { value: 'general', icon: Users },
  { value: 'senior', icon: Sparkles },
  { value: 'pregnant', icon: HeartPulse },
  { value: 'disabled', icon: ShieldCheck },
  { value: 'emergency', icon: AlertTriangle }
];

const makeInitialForm = () => ({
  kind: 'walkin',
  patientName: '',
  phone: '',
  age: '',
  gender: 'female',
  departmentId: '',
  doctorId: '',
  date: todayISO(),
  slotTime: '',
  priority: 'general',
  language: 'en',
  notes: ''
});

export default function BookPage() {
  const { t, language, setLanguage } = useLanguage();
  const { push } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...makeInitialForm(), language });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [slotRefresh, setSlotRefresh] = useState(0);
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedDepartment = departments.find((department) => String(department.id) === String(form.departmentId));
  const doctors = selectedDepartment?.doctors || [];

  useEffect(() => {
    let active = true;
    api('/api/public/departments', { auth: false })
      .then((data) => {
        if (!active) return;
        const depts = (data.departments && data.departments.length > 0)
          ? data.departments
          : FALLBACK_DEPARTMENTS;
        setDepartments(depts);
        const first = depts[0];
        if (first) {
          setForm((current) => ({
            ...current,
            departmentId: current.departmentId || first.id,
            doctorId: current.doctorId || first.doctors?.[0]?.id || ''
          }));
        }
      })
      .catch(() => {
        // API unreachable – keep the form visible, but tell the patient tokens can't be issued yet
        if (!active) return;
        setApiOffline(true);
        setDepartments(FALLBACK_DEPARTMENTS);
        const first = FALLBACK_DEPARTMENTS[0];
        if (first) {
          setForm((current) => ({
            ...current,
            departmentId: current.departmentId || first.id,
            doctorId: current.doctorId || first.doctors?.[0]?.id || ''
          }));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm((current) => ({ ...current, language }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (!form.departmentId) return;
    const department = departments.find((item) => String(item.id) === String(form.departmentId));
    if (!department) return;
    const doctorExists = department.doctors.some((doctor) => String(doctor.id) === String(form.doctorId));
    if (!doctorExists) {
      setForm((current) => ({ ...current, doctorId: department.doctors?.[0]?.id || '', slotTime: '' }));
    }
  }, [form.departmentId, departments]);

  useEffect(() => {
    let active = true;
    if (form.kind !== 'appointment' || !form.doctorId || !form.date) {
      setSlots([]);
      return () => { active = false; };
    }
    setSlotsLoading(true);
    api(`/api/public/slots?doctorId=${form.doctorId}&date=${form.date}`, { auth: false })
      .then((data) => {
        if (!active) return;
        const hasFree = data.slots.some((slot) => slot.available);
        // Nothing left today (e.g. after clinic hours): move to the next day automatically.
        if (!hasFree && form.date === todayISO() && !autoAdvanced) {
          setAutoAdvanced(true);
          setForm((current) => ({ ...current, date: addDaysISO(1), slotTime: '' }));
          return;
        }
        setSlots(data.slots);
        setForm((current) => {
          const stillAvailable = data.slots.some((slot) => slot.time === current.slotTime && slot.available);
          return stillAvailable ? current : { ...current, slotTime: data.slots.find((slot) => slot.available)?.time || '' };
        });
      })
      .catch((error) => push(error.message, 'error'))
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.kind, form.doctorId, form.date, slotRefresh]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (form.kind === 'appointment' && !form.slotTime) {
      push('Please select an available time slot', 'error');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        ...form,
        age: form.age === '' ? null : Number(form.age),
        departmentId: Number(form.departmentId),
        doctorId: Number(form.doctorId),
        date: form.kind === 'walkin' ? todayISO() : form.date, // server ignores this for walk-ins
        slotTime: form.kind === 'walkin' ? null : form.slotTime || null,
        selfCheckIn: form.kind === 'walkin'
      };
      const result = await api('/api/public/bookings', { method: 'POST', auth: false, body: payload });
      const issued = result?.ticket?.ticket || result?.ticket;
      if (!issued?.ticketCode) throw new Error('The server did not return a token. Please try again.');
      setApiOffline(false);
      saveToken(result);
      setConfirmation(result);
      push(form.kind === 'walkin' ? 'Your token is ready' : 'Appointment confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(error.message);
      push(error.message, 'error');
      // Slot was taken or passed meanwhile: reload fresh availability.
      if (error.status === 409 || form.kind === 'appointment') setSlotRefresh((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setConfirmation(null);
    setSubmitError('');
    setForm({ ...makeInitialForm(), language, departmentId: form.departmentId, doctorId: form.doctorId });
  };

  return (
    <div className="public-shell">
      <PublicNav />
      <main className="booking-page">
        <div className="booking-page-inner">
          <div className="booking-page-head">
            <Link to="/" className="text-link"><ArrowLeft size={15} /> {t('nav.home')}</Link>
            <span className="eyebrow">{t('home.bookEyebrow')}</span>
            <h1>{t('home.bookTitle')}</h1>
            <p>{t('home.bookSubtitle')}</p>
          </div>

          <div className="booking-workspace">
            <div className="booking-card" id="booking">
              {confirmation ? (
                <BookingSuccess confirmation={confirmation} onReset={resetBooking} t={t} />
              ) : (
                <>
                  <div className="booking-card-head">
                    <div>
                      <span className="eyebrow-small">{t('home.bookEyebrow')}</span>
                      <h2>{t('home.bookTitle')}</h2>
                      <p>{t('home.bookSubtitle')}</p>
                    </div>
                    <span className="no-login-chip"><ShieldCheck size={14} /> {t('home.bookBadge')}</span>
                  </div>
                  <div className="kind-switch">
                    <button type="button" className={form.kind === 'walkin' ? 'is-active' : ''} onClick={() => update('kind', 'walkin')}>
                      <Ticket size={16} /> {t('home.walkin')}
                    </button>
                    <button type="button" className={form.kind === 'appointment' ? 'is-active' : ''} onClick={() => { setAutoAdvanced(false); update('kind', 'appointment'); }}>
                      <Clock3 size={16} /> {t('home.appointment')}
                    </button>
                  </div>
                  {loading ? (
                    <div className="booking-loading"><Spinner /> {t('common.loading')}</div>
                  ) : (
                    <form onSubmit={handleSubmit} className="booking-form">
                      <div className="form-grid two">
                        <label className="field">
                          <span>{t('home.patientName')}</span>
                          <input
                            required
                            value={form.patientName}
                            onChange={(event) => update('patientName', event.target.value)}
                            placeholder={t('home.patientNamePlaceholder')}
                          />
                        </label>
                        <label className="field">
                          <span>{t('home.phone')}</span>
                          <input
                            required
                            inputMode="tel"
                            value={form.phone}
                            onChange={(event) => update('phone', event.target.value)}
                            placeholder={t('home.phonePlaceholder')}
                          />
                        </label>
                      </div>
                      <div className="form-grid three">
                        <label className="field">
                          <span>{t('home.age')}</span>
                          <input type="number" min="0" max="120" value={form.age} onChange={(event) => update('age', event.target.value)} placeholder="34" />
                        </label>
                        <label className="field">
                          <span>{t('home.gender')}</span>
                          <select value={form.gender} onChange={(event) => update('gender', event.target.value)}>
                            <option value="female">{t('home.female')}</option>
                            <option value="male">{t('home.male')}</option>
                            <option value="other">{t('home.other')}</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>{t('common.language')}</span>
                          <select value={form.language} onChange={(event) => { update('language', event.target.value); setLanguage(event.target.value); }}>
                            <option value="en">English</option>
                            <option value="mr">मराठी</option>
                            <option value="hi">हिंदी</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-grid two">
                        <label className="field">
                          <span>{t('home.department')}</span>
                          <select value={form.departmentId} onChange={(event) => update('departmentId', event.target.value)} required>
                            <option value="">{t('home.selectDepartment')}</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>{localDepartmentName(department, language)}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>{t('home.doctor')}</span>
                          <select value={form.doctorId} onChange={(event) => update('doctorId', event.target.value)} required>
                            <option value="">{t('home.selectDoctor')}</option>
                            {doctors.map((doctor) => (
                              <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.room}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {form.kind === 'appointment' && (
                        <div className="form-grid two">
                          <label className="field">
                            <span>{t('home.date')}</span>
                            <input type="date" min={todayISO()} max={addDaysISO(30)} value={form.date} onChange={(event) => update('date', event.target.value)} />
                          </label>
                          <label className="field">
                            <span>{t('home.slot')}</span>
                            <select required value={form.slotTime} onChange={(event) => update('slotTime', event.target.value)} disabled={slotsLoading || !form.doctorId}>
                              <option value="">{slotsLoading ? t('common.loading') : t('home.selectSlot')}</option>
                              {slots.filter((slot) => slot.available).map((slot) => (
                                <option key={slot.time} value={slot.time}>{slot.time}</option>
                              ))}
                            </select>
                          </label>
                          {!slotsLoading && form.doctorId && slots.length > 0 && !slots.some((slot) => slot.available) && (
                            <div className="inline-warning"><AlertTriangle size={14} /> No free slots on this date. Please pick another day.</div>
                          )}
                        </div>
                      )}
                      <div className="priority-section">
                        <div className="field-label-row">
                          <span>{t('home.priority')}</span>
                          <small>{t('home.priorityHint')}</small>
                        </div>
                        <div className="priority-options">
                          {PRIORITIES.map((priority) => {
                            const Icon = priority.icon;
                            return (
                              <button
                                type="button"
                                key={priority.value}
                                className={`priority-option priority-${priority.value} ${form.priority === priority.value ? 'is-selected' : ''}`}
                                onClick={() => update('priority', priority.value)}
                              >
                                <Icon size={15} />
                                {t(`priority.${priority.value}`)}
                              </button>
                            );
                          })}
                        </div>
                        {form.priority === 'emergency' && (
                          <div className="inline-warning"><AlertTriangle size={14} /> {t('home.emergencyNote')}</div>
                        )}
                      </div>
                      <label className="field">
                        <span>{t('home.notes')} <em>{t('common.optional')}</em></span>
                        <textarea rows="2" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder={t('home.notesPlaceholder')} />
                      </label>
                      {apiOffline && (
                        <div className="inline-warning"><AlertTriangle size={14} /> Cannot reach the server, so a token can't be issued right now. Make sure the SQMS API is running (npm run dev), then reload this page.</div>
                      )}
                      {submitError && (
                        <div className="inline-warning" role="alert"><AlertTriangle size={14} /> {submitError}</div>
                      )}
                      <button className="btn btn-primary btn-wide booking-submit" type="submit" disabled={submitting || (form.kind === 'appointment' && !slotsLoading && !form.slotTime)}>
                        {submitting ? <><Spinner size={16} /> {t('home.submitting')}</> : (
                          <>
                            {form.kind === 'walkin' ? t('home.submitWalkin') : t('home.submitAppointment')}
                            <ArrowRight size={17} />
                          </>
                        )}
                      </button>
                      <SecureNote>{t('track.smsNote')}</SecureNote>
                    </form>
                  )}
                </>
              )}
            </div>

            <aside className="booking-aside">
              <div className="booking-help-card">
                <span className="booking-help-icon"><ShieldCheck size={19} /></span>
                <h3>{t('book.helpTitle')}</h3>
                <p>{t('book.helpBody')}</p>
              </div>
              <div className="booking-help-card">
                <span className="booking-help-icon amber"><Phone size={19} /></span>
                <h3>{t('book.emergencyTitle')}</h3>
                <p>{t('home.emergencyNote')}</p>
              </div>
              <div className="booking-help-card muted">
                <Ticket size={18} />
                <p>{t('home.savedOnDevice')}</p>
                <Link to="/" className="text-link">{t('home.savedTitle')} <ArrowRight size={14} /></Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function BookingSuccess({ confirmation, onReset, t }) {
  const ticket = confirmation.ticket?.ticket || confirmation.ticket;
  const status = ticket?.status;
  const isWaiting = status === 'waiting';
  const position = confirmation.ticket?.position;
  const eta = confirmation.ticket?.etaMinutes;

  return (
    <div className="booking-success">
      <SuccessMark />
      <span className="eyebrow-small">{isWaiting ? t('home.successTitle') : t('home.successAppointment')}</span>
      <h2>{ticket?.tokenLabel}</h2>
      <p>{t('home.successBody')}</p>
      <div className="success-token-meta">
        <div><span>{t('track.department')}</span><strong>{confirmation.ticket?.department?.name || '—'}</strong></div>
        <div><span>{t('track.doctor')}</span><strong>{confirmation.ticket?.doctor?.name || '—'}</strong></div>
        <div><span>{t('track.room')}</span><strong>{confirmation.ticket?.doctor?.room || '—'}</strong></div>
        <div><span>{t('track.date')}</span><strong>{ticket?.date} {ticket?.slotTime ? `· ${ticket.slotTime}` : ''}</strong></div>
      </div>
      {isWaiting ? (
        <div className="success-live">
          <div><span>{t('track.yourPosition')}</span><strong>{position ?? '—'}</strong></div>
          <div><span>{t('track.estimatedWait')}</span><strong>{eta ?? '—'} <small>{t('common.min')}</small></strong></div>
        </div>
      ) : (
        <div className="inline-success"><CheckCircle2 size={16} /> Check in from your tracker on the day of your visit.</div>
      )}
      <div className="inline-success"><CheckCircle2 size={16} /> {t('home.savedOnDevice')}</div>
      <div className="success-code">
        <span>Tracking code</span>
        <code>{ticket?.ticketCode}</code>
      </div>
      <Link to={`/track/${ticket?.ticketCode}`} className="btn btn-primary btn-wide">{t('home.openTracker')} <ArrowRight size={17} /></Link>
      <Link to="/" className="btn btn-ghost btn-wide">{t('home.savedTitle')} <ArrowRight size={17} /></Link>
      <button type="button" className="btn btn-ghost btn-wide" onClick={onReset}>{t('home.bookAnother')}</button>
      <span className="success-sms"><Phone size={13} /> SMS confirmation sent · {ticket?.phoneMasked}</span>
    </div>
  );
}
