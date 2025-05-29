import OcrApp from '../components/OcrApp';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <main className="max-w-6xl mx-auto my-8">
          <h1 className="text-4xl font-bold text-center text-blue-800 dark:text-blue-300 mb-6">
            Accounting Document Organizer
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Upload your accounting documents (images or PDFs) and our AI will automatically organize them 
            by category, making your financial document management effortless.
          </p>
          
          <OcrApp />
        </main>
        
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12 pb-8">
          <p>© 2025 Accounting Document Organizer. All rights reserved.</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
