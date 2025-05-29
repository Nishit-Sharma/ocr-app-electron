'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-2xl mx-auto my-16">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 border border-red-200 dark:border-red-800">
              <div className="flex items-center mb-6">
                <svg className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h1 className="text-2xl font-bold text-red-800 dark:text-red-300">
                  Something went wrong
                </h1>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The application encountered an unexpected error. This might be due to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                  <li>A corrupted or malformed file</li>
                  <li>Memory constraints with large files</li>
                  <li>Network connectivity issues</li>
                  <li>Browser compatibility problems</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                >
                  Reload Application
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                  <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
                    Error Details (Development Mode)
                  </summary>
                  <div className="text-xs font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                  </div>
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap mt-2">
                    {this.state.errorInfo.componentStack}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 