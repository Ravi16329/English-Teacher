import { Tutor } from './components/Tutor';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">Ravi</span>
        <span className="app-tagline">Speaking practice, one conversation at a time</span>
      </header>
      <main className="app-content">
        <Tutor />
      </main>
    </div>
  );
}
