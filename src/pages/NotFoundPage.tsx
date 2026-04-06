import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <span className="text-6xl font-bold text-color-text-2 opacity-30">404</span>
      <h1 className="text-xl font-semibold text-color-text-1">Page not found</h1>
      <p className="text-sm text-color-text-2 max-w-xs">
        This page doesn't exist or has been moved.
      </p>
      <Link to="/market" className="mt-2 px-6 py-2 bg-color-accent text-white rounded-lg text-sm font-medium">
        Go to Market
      </Link>
    </div>
  )
}
