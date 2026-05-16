import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ScreenRecordingProvider } from './context/ScreenRecordingContext';
import { CustomThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <CustomThemeProvider>
      <ScreenRecordingProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-900 overflow-hidden">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </ScreenRecordingProvider>
    </CustomThemeProvider>
  )
}

export default App
