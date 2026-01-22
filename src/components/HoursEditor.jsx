import { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HoursEditor({ formData, onChange }) {
  
  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === 'Closed') return { isOpen: false, is24h: false, slots: [{ start: '', end: '' }] };
    if (timeStr === '24 Hours' || timeStr === '00:00-23:59') return { isOpen: true, is24h: true, slots: [{ start: '00:00', end: '23:59' }] };
    
    const rawSlots = timeStr.split(',').map(s => s.trim());
    const slots = rawSlots.map(slot => {
        if (slot === '-') return { start: '', end: '' };
        const parts = slot.split('-');
        return { start: parts[0]?.trim() || '', end: parts[1]?.trim() || '' };
    });
    return { isOpen: true, is24h: false, slots: slots.length > 0 ? slots : [{ start: '', end: '' }] };
  };

  const formatTime = (state) => {
    if (!state.isOpen) return 'Closed';
    if (state.is24h) return '00:00-23:59';
    return state.slots.map(s => {
        if (!s.start && !s.end) return '-'; 
        return `${s.start}-${s.end}`;
    }).join(', ');
  };

  const updateState = (day, partialState) => {
    const key = `hours_${day.toLowerCase()}`;
    const currentState = parseTime(formData[key]);
    const newState = { ...currentState, ...partialState };
    onChange(key, formatTime(newState));
  };

  const handleToggleOpen = (day, isChecked) => {
    if (isChecked) {
        updateState(day, { isOpen: true, is24h: false, slots: [{ start: '09:00', end: '17:00' }] });
    } else {
        updateState(day, { isOpen: false });
    }
  };

  const handleSlotChange = (day, index, field, value) => {
    const key = `hours_${day.toLowerCase()}`;
    const currentState = parseTime(formData[key]);
    const newSlots = [...currentState.slots];
    newSlots[index][field] = value;
    updateState(day, { slots: newSlots });
  };

  const addSlot = (day) => {
    const key = `hours_${day.toLowerCase()}`;
    const currentState = parseTime(formData[key]);
    updateState(day, { slots: [...currentState.slots, { start: '', end: '' }] });
  };

  const removeSlot = (day, index) => {
    const key = `hours_${day.toLowerCase()}`;
    const currentState = parseTime(formData[key]);
    const newSlots = currentState.slots.filter((_, i) => i !== index);
    if (newSlots.length === 0) newSlots.push({ start: '', end: '' });
    updateState(day, { slots: newSlots });
  };

  const copyMondayToAll = () => {
    const monValue = formData['hours_monday'];
    DAYS.forEach(day => {
      if (day !== 'Monday') onChange(`hours_${day.toLowerCase()}`, monValue);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button 
            type="button" 
            onClick={copyMondayToAll}
            style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
            Copy Monday to All Weekdays
        </button>
      </div>

      {DAYS.map(day => {
        const key = `hours_${day.toLowerCase()}`;
        const state = parseTime(formData[key]);

        return (
          <div key={day} style={{ 
            display: 'flex', alignItems: 'flex-start', gap: '12px', 
            padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: state.isOpen ? 'var(--surface)' : 'var(--bg)' 
          }}>
            
            {/* TOGGLE */}
            <div style={{ width: '110px', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '5px' }}>
                <input 
                    type="checkbox" 
                    checked={state.isOpen} 
                    onChange={e => handleToggleOpen(day, e.target.checked)} 
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: '500', fontSize: '14px', color: state.isOpen ? 'var(--text-main)' : 'var(--text-secondary)' }}>{day}</span>
            </div>

            {/* INPUTS */}
            <div style={{ flex: 1 }}>
                {!state.isOpen ? (
                    <div style={{ color: 'var(--text-placeholder)', fontSize: '13px', fontStyle: 'italic', paddingTop: '6px' }}>Closed</div>
                ) : state.is24h ? (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '6px' }}>
                        <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '13px' }}>Open 24 Hours</span>
                        <button type="button" onClick={() => updateState(day, { is24h: false, slots: [{start:'09:00', end:'17:00'}] })} style={linkBtnStyle}>Edit Hours</button>
                     </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {state.slots.map((slot, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                    type="time" 
                                    value={slot.start} 
                                    onChange={e => handleSlotChange(day, idx, 'start', e.target.value)}
                                    style={inputStyle}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>to</span>
                                <input 
                                    type="time" 
                                    value={slot.end} 
                                    onChange={e => handleSlotChange(day, idx, 'end', e.target.value)}
                                    style={inputStyle}
                                />
                                {state.slots.length > 1 && (
                                    <button type="button" onClick={() => removeSlot(day, idx)} style={iconBtnStyle}>✕</button>
                                )}
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <button type="button" onClick={() => addSlot(day)} style={linkBtnStyle}>+ Add Split</button>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <input type="checkbox" checked={state.is24h} onChange={e => updateState(day, { is24h: e.target.checked })} />
                                24h
                            </label>
                        </div>
                    </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const inputStyle = { 
    padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', width: '105px', background: 'var(--surface)', color: 'var(--text-main)' 
};
const iconBtnStyle = { 
    background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
};
const linkBtnStyle = { 
    background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', padding: 0, textDecoration: 'underline'
};