import React from "react";
import { FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import { Button } from "../ui/button";

class GoogleMapsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Google Maps Error:", error, errorInfo);
    this.setState({ error: error });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-96 rounded-xl overflow-hidden brand-card flex items-center justify-center">
          <div className="text-center p-6">
            <div className="brand-gradient p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FaExclamationTriangle className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Map Loading Error
            </h3>

            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              There was an issue loading the interactive map. This might be due
              to invalid coordinates or a temporary Google Maps service issue.
            </p>

            <div className="space-y-2">
              <Button
                onClick={this.handleRetry}
                size="sm"
                className="brand-gradient text-white hover:opacity-90"
              >
                <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                Retry Map
              </Button>
            </div>

            {/* Show error in development */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-500">
                  Debug Info (Dev Only)
                </summary>
                <pre className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 overflow-auto max-h-20">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GoogleMapsErrorBoundary;
