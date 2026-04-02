import { Component, type ReactNode } from 'react';

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;
  label?:    string;  // e.g. "Orderbook", "Chart"
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

/**
 * Generic React Error Boundary.
 * Wrap individual trading panels with this to prevent one panel's error
 * from crashing the entire trading page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[ErrorBoundary:${this.props.label ?? 'unknown'}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
          <span className="text-color-error text-large">⚠</span>
          <p className="text-small text-color-text-1 font-medium">
            {this.props.label ?? '컴포넌트'} 오류
          </p>
          <p className="text-tiny text-color-text-0 text-center">
            {this.state.error?.message ?? '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 rounded bg-color-layer-3 text-tiny text-color-text-1 hover:bg-color-layer-4 transition-colors"
          >
            재시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
