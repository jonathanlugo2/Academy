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
            <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-mono rounded-full ${
              activeState === state.id 
                ? 'bg-text-active/15 text-text-active' 
                : 'bg-bg-main/50 text-text-muted'
            }`}>
              {state.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
