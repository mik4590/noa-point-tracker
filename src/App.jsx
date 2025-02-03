import React, { useState, useEffect } from 'react';

const GRADE_EXPECTATIONS = {
  'Math': { min: 55, target: 65 },
  'English': { min: 75, target: 85 },
  'Israeli Culture': { min: 65, target: 80 },
  'Activity Class': { min: 75, target: 85 },
  'Mishnah': { min: 65, target: 75 },
  'Literature': { min: 60, target: 70 },
  'Hebrew Language': { min: 75, target: 85 },
  'Science': { min: 70, target: 80 },
  'Torah': { min: 65, target: 75 },
  'History': { min: 75, target: 85 }
};

const DEDUCTIONS = [
  { label: 'Late', points: -2 },
  { label: 'Absence', points: -3 },
  { label: 'Disruption', points: -3 },
  { label: 'Homework not done', points: -3 },
  { label: 'Below minimum grade', points: -4 },
  { label: 'Negative teacher call', points: -5 }
];

const BONUSES = [
  { label: 'Grade at/above target', points: 5 },
  { label: 'Positive feedback', points: 5 }
];

const ENTRY_TYPES = [
  { label: 'Deduction', value: 'deduction' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Grade', value: 'grade' },
  { label: 'Custom', value: 'custom' }
];

function App() {
  const [points, setPoints] = useState(100);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('actions');
  const [selectedType, setSelectedType] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [customDesc, setCustomDesc] = useState('');
  const [customPoints, setCustomPoints] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [actionToConfirm, setActionToConfirm] = useState(null);

  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const savedData = localStorage.getItem(`points-${month}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setPoints(data.points);
      setHistory(data.history);
    }
  }, [month]);

  useEffect(() => {
    localStorage.setItem(`points-${month}`, JSON.stringify({ points, history }));
  }, [points, history, month]);

  const checkPassword = () => {
    if (password === '102030') {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setPassword('');
      // Execute the pending action
      if (actionToConfirm) {
        actionToConfirm();
        setActionToConfirm(null);
      }
    } else {
      alert('Incorrect code');
      setPassword('');
    }
  };
  
  const requirePassword = (action) => {
    if (isAdmin) {
      action();
    } else {
      setActionToConfirm(() => action);
      setShowPasswordPrompt(true);
    }
  };

  const addEntry = (description, pointValue) => {
    requirePassword(() => {
      const entry = {
        description,
        points: pointValue,
        date: new Date().toLocaleDateString(),
        isPositive: pointValue > 0
      };
      setHistory(prev => [...prev, entry]);
      setPoints(prev => prev + pointValue);
      setSelectedType('');
      setSelectedEvent('');
    });
  };
  const addGrade = () => {
    requirePassword(() => {
      if (!selectedSubject || !grade) return;
      
      const expectation = GRADE_EXPECTATIONS[selectedSubject];
      let points = 0;
      let description = `${selectedSubject} grade: ${grade}`;
  
      if (grade < expectation.min) {
        points = -4;
        description += ' (Below minimum)';
      } else if (grade >= expectation.target) {
        points = 5;
        description += ' (Met target)';
      }
  
      addEntry(description, points);
      setSelectedSubject('');
      setGrade('');
    });
  };

  const handleEdit = (entry, index) => {
    requirePassword(() => {
      setEditingEntry({ ...entry, index });
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    requirePassword(() => {
      const oldEntry = history[editingEntry.index];
      const pointsDiff = editingEntry.points - oldEntry.points;
      
      setPoints(prev => prev + pointsDiff);
      setHistory(prev => prev.map((entry, i) => 
        i === editingEntry.index ? {
          ...editingEntry,
          isPositive: editingEntry.points > 0
        } : entry
      ));
      setEditingEntry(null);
    });
  };

  const handleDelete = (index) => {
    requirePassword(() => {
      const entry = history[index];
      setPoints(prev => prev - entry.points);
      setHistory(prev => prev.filter((_, i) => i !== index));
      setEditingEntry(null);
    });
  };

  const exportData = () => {
    let csvContent = 'Date,Description,Points,Total\n';
    let total = 100;
    csvContent += history.map(entry => {
      total += entry.points;
      return `${entry.date},"${entry.description}",${entry.points},${total}`;
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `points-${month}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100 p-4">
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80">
            <h3 className="text-xl font-semibold text-pink-800 mb-4">Enter Code</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-pink-200 rounded-xl mb-4"
              placeholder="Enter code to make changes"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                  setActionToConfirm(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={checkPassword}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Points Display */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
          <div className="relative h-4 bg-gray-200 rounded-full mb-4">
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-pink-500"
              style={{ width: `${Math.min(100, Math.max(0, points))}%` }}
            />
          </div>
          <h1 className="text-4xl font-bold text-pink-800 mb-2">✨ {points} Points ✨</h1>
          <p className="text-pink-600 text-xl">
            {points >= 100 
              ? `${points} shekels (100 base + ${points - 100} bonus)`
              : 'Keep collecting points! 💫'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-6 py-3 rounded-full transition-all ${
              activeTab === 'actions' 
                ? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-white text-pink-600'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`px-6 py-3 rounded-full transition-all ${
              activeTab === 'points' 
                ? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-white text-pink-600'
            }`}
          >
            Point Values
          </button>
        </div>

        {activeTab === 'actions' ? (
         <div className="space-y-6">
           {/* Entry Form */}
           <div className="bg-white rounded-2xl shadow-lg p-6">
             <select
               value={selectedType}
               onChange={(e) => setSelectedType(e.target.value)}
               className="w-full p-3 mb-4 border border-pink-200 rounded-xl"
             >
               <option value="">Select Entry Type</option>
               <option value="deduction">Deduction</option>
               <option value="bonus">Bonus</option>
               <option value="grade">Grade</option>
               <option value="custom">Custom Entry</option>
             </select>

             {selectedType === 'deduction' && (
               <select
                 value={selectedEvent}
                 onChange={(e) => {
                   const deduction = DEDUCTIONS.find(d => d.label === e.target.value);
                   if (deduction) addEntry(deduction.label, deduction.points);
                 }}
                 className="w-full p-3 border border-pink-200 rounded-xl"
               >
                 <option value="">Select Deduction</option>
                 {DEDUCTIONS.map(d => (
                   <option key={d.label} value={d.label}>{d.label} ({d.points})</option>
                 ))}
               </select>
             )}

             {selectedType === 'bonus' && (
               <select
                 value={selectedEvent}
                 onChange={(e) => {
                   const bonus = BONUSES.find(b => b.label === e.target.value);
                   if (bonus) addEntry(bonus.label, bonus.points);
                 }}
                 className="w-full p-3 border border-pink-200 rounded-xl"
               >
                 <option value="">Select Bonus</option>
                 {BONUSES.map(b => (
                   <option key={b.label} value={b.label}>{b.label} (+{b.points})</option>
                 ))}
               </select>
             )}

             {selectedType === 'grade' && (
               <div className="flex gap-2">
                 <select
                   value={selectedSubject}
                   onChange={(e) => setSelectedSubject(e.target.value)}
                   className="flex-1 p-3 border border-pink-200 rounded-xl"
                 >
                   <option value="">Select Subject</option>
                   {Object.entries(GRADE_EXPECTATIONS).map(([subject, { min, target }]) => (
                     <option key={subject} value={subject}>
                       {subject} ({min}-{target})
                     </option>
                   ))}
                 </select>
                 <input
                   type="number"
                   value={grade}
                   onChange={(e) => setGrade(e.target.value)}
                   placeholder="Grade"
                   className="w-24 p-3 border border-pink-200 rounded-xl"
                 />
                 <button
                   onClick={addGrade}
                   className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700"
                 >
                   Add Grade
                 </button>
               </div>
             )}

             {selectedType === 'custom' && (
               <div className="flex gap-2">
                 <input
                   value={customDesc}
                   onChange={(e) => setCustomDesc(e.target.value)}
                   placeholder="Description"
                   className="flex-1 p-3 border border-pink-200 rounded-xl"
                 />
                 <input
                   type="number"
                   value={customPoints}
                   onChange={(e) => setCustomPoints(e.target.value)}
                   placeholder="Points"
                   className="w-24 p-3 border border-pink-200 rounded-xl"
                 />
                 <button
                   onClick={() => {
                     if (customDesc && customPoints) {
                       addEntry(customDesc, parseInt(customPoints));
                       setCustomDesc('');
                       setCustomPoints('');
                     }
                   }}
                   className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700"
                 >
                   Add
                 </button>
               </div>
             )}
           </div>

           {/* History */}
           <div className="bg-white rounded-2xl shadow-lg p-6">
             <h3 className="text-xl font-semibold text-pink-800 mb-4">History</h3>
             <div className="space-y-2">
               {history.map((entry, index) => (
                 <div
                   key={index}
                   className={`p-4 rounded-xl flex justify-between items-center group ${
                     entry.isPositive ? 'bg-green-50' : 'bg-pink-50'
                   }`}
                 >
                   <span className={entry.isPositive ? 'text-green-700' : 'text-pink-700'}>
                     {entry.date}: {entry.description} {entry.isPositive && '🤩'}
                   </span>
                   <div className="flex items-center gap-4">
                     <span className={entry.isPositive ? 'text-green-600' : 'text-red-600'}>
                       {entry.points > 0 ? '+' : ''}{entry.points}
                     </span>
                     <button
                       onClick={() => handleEdit(entry, index)}
                       className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                     >
                       ⋮
                     </button>
                   </div>
                 </div>
               ))}
             </div>
             <button
               onClick={exportData}
               className="w-full mt-4 p-3 text-pink-600 hover:bg-pink-50 rounded-xl"
             >
               Export History
             </button>
           </div>
         </div>
       ) : (
         <div className="bg-white rounded-2xl shadow-lg p-6">
           <div className="space-y-4">
             <h3 className="text-xl font-semibold text-pink-800 mb-4">Grade Expectations</h3>
             {Object.entries(GRADE_EXPECTATIONS).map(([subject, { min, target }]) => (
               <div key={subject} className="flex justify-between items-center p-2 border-b border-pink-100">
                 <span className="font-medium">{subject}</span>
                 <span>
                   Min: <span className="text-red-600">{min}</span>, 
                   Target: <span className="text-green-600">{target}</span> 
                   <span className="text-sm text-gray-500 ml-2">(+5 points when reached)</span>
                 </span>
               </div>
             ))}
             <h3 className="text-xl font-semibold text-pink-800 mt-6 mb-4">Points System</h3>
             {[...DEDUCTIONS, ...BONUSES].map((item) => (
               <div key={item.label} className="flex justify-between items-center p-2 border-b border-pink-100">
                 <span>{item.label}</span>
                 <span className={item.points > 0 ? 'text-green-600' : 'text-red-600'}>
                   {item.points > 0 ? '+' : ''}{item.points}
                 </span>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Edit Modal */}
       {editingEntry && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
           <div className="bg-white rounded-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
             <h3 className="text-xl font-semibold text-pink-800 mb-4">Edit Entry</h3>
             <form onSubmit={handleSaveEdit} className="space-y-4">
               <input
                 type="text"
                 value={editingEntry.date}
                 onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                 className="w-full p-3 border border-pink-200 rounded-xl"
               />
               <input
                 type="text"
                 value={editingEntry.description}
                 onChange={e => setEditingEntry({...editingEntry, description: e.target.value})}
                 className="w-full p-3 border border-pink-200 rounded-xl"
               />
               <input
                 type="number"
                 value={editingEntry.points}
                 onChange={e => setEditingEntry({...editingEntry, points: parseInt(e.target.value)})}
                 className="w-full p-3 border border-pink-200 rounded-xl"
               />
               <div className="flex justify-end gap-2">
                 <button
                   type="button"
                   onClick={() => handleDelete(editingEntry.index)}
                   className="px-4 py-2 text-red-600 hover:text-red-700"
                 >
                   Delete
                 </button>
                 <button
                   type="button"
                   onClick={() => setEditingEntry(null)}
                   className="px-4 py-2 text-gray-600 hover:text-gray-700"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="px-6 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700"
                 >
                   Save
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
     </div>
   </div>
 );
}

export default App;