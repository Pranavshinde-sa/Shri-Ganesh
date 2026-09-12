import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-lg mx-auto mt-24 p-6 rounded-xl border border-red-200 bg-red-50 text-red-800">
          <h2 className="font-semibold text-lg mb-2">Something went wrong on this page</h2>
          <p className="text-sm mb-3">{String(this.state.error?.message || this.state.error)}</p>
          <button
            className="text-sm font-medium underline"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
