import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur capturee :", error);
    console.error("Stack :", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red" }}>
          <h2>Une erreur est survenue</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
