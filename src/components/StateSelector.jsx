export default function StateSelector({ states, activeState, onChange }) {
  return (
    <div className="state-selector inline-flex">
      {states.map((state) => (
        <button
          key={state.id}
          onClick={() => onChange(state.id)}
          className={`state-selector-tab ${activeState === state.id ? 'active' : ''}`}
        >
          {state.label}
          {state.count !== undefined && (
            <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono rounded-full ${
              activeState === state.id 
                ? 'bg-slate-600 text-slate-100' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {state.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
