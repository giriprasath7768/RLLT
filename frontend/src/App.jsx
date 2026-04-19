import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ScreenRecordingProvider } from './context/ScreenRecordingContext';

function App() {
  return (
    <ScreenRecordingProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 overflow-hidden">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </ScreenRecordingProvider>
  )
}

export default App
