import { Dashboard } from "./pages/Dashboard";

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              L&amp;F
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Lost &amp; Found Matcher
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Campus Recovery System
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            University Campus Portal
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Dashboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <p>
            The Lost &amp; Found Matcher calculates a heuristic similarity score to support human review.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
