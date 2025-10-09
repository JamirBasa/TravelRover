import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

class TripViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error("TripView Error Boundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // If there's a retry callback, call it
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="brand-card p-8 max-w-md mx-auto text-center">
            <div className="brand-gradient p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-bold brand-gradient-text mb-3">
              Something went wrong
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              We encountered an error while loading your trip data. This might
              be due to malformed data or a temporary issue.
            </p>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full brand-gradient text-white hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs font-mono text-red-600 overflow-auto max-h-32">
                  <div className="font-semibold mb-1">Error:</div>
                  <div className="mb-2">{this.state.error.toString()}</div>
                  <div className="font-semibold mb-1">Stack:</div>
                  <div>{this.state.errorInfo.componentStack}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TripViewErrorBoundary;
